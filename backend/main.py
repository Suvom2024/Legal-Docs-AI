from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import uvicorn
import uuid
from contextlib import asynccontextmanager

from database import init_db, get_db, Document, Template, TemplateVariable, Instance
from models import (
    DocumentUploadResponse,
    ExtractionRequest,
    ExtractionResponse,
    TemplateResponse,
    TemplateWithVariables,
    TemplateCreate,
    DraftRequest,
    DraftResponse,
    AnswerSubmission,
    FinalDraftResponse,
    VariableSchema,
    QuestionSchema,
    WebSearchRequest,
    WebSearchResponse,
    WebSearchResult,
    WebBootstrapRequest,
    WebBootstrapResponse
)
from config import settings
from services.document_parser import DocumentParser
from services.template_extractor import TemplateExtractor
from services.embedding_service import embedding_service
from services.template_matcher import template_matcher
from services.question_generator import question_generator
from services.web_bootstrap import web_bootstrap
from services.docx_generator import docx_generator
import os
import tempfile
import re
from fastapi.responses import FileResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        init_db()
        print("Database initialized successfully")
        
        # Validate API keys
        if not settings.GEMINI_API_KEY:
            print("⚠️  WARNING: GEMINI_API_KEY not configured - template extraction will fail")
        else:
            print(f"✅ Gemini API Key configured: {settings.GEMINI_API_KEY[:10]}...")
            
        if not settings.EXA_API_KEY:
            print("⚠️  WARNING: EXA_API_KEY not configured - web bootstrap feature disabled")
        else:
            print(f"✅ Exa API Key configured: {settings.EXA_API_KEY[:10]}...")
            
        # Test API connections
        try:
            from services.gemini_service import gemini_service
            print("✅ Gemini service initialized successfully")
        except Exception as e:
            print(f"❌ Gemini service initialization failed: {str(e)}")
            
        try:
            from services.exa_service import exa_service
            if exa_service:
                print("✅ Exa service initialized successfully")
            else:
                print("⚠️  Exa service not available (no API key)")
        except Exception as e:
            print(f"❌ Exa service initialization failed: {str(e)}")
            
    except Exception as e:
        print(f"❌ Startup failed: {str(e)}")
        raise
    
    yield
    
    # Shutdown (if needed)
    print("Shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="Legal Document Templating API",
    description="AI-powered legal document templating system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request size validation middleware
@app.middleware("http")
async def validate_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if int(content_length) > max_size_bytes:
            return JSONResponse(
                status_code=413,
                content={"detail": f"Request too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB"}
            )
    
    response = await call_next(request)
    return response

def _format_template_content(content: str) -> str:
    """Format template content for better markdown rendering"""
    # Remove YAML front-matter if present
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            content = parts[2].strip()
    
    # Remove tracking code from visible content
    content = content.replace("UOIONHHC", "")
    content = content.replace("<!--  -->", "")
    
    # Clean up extra whitespace
    content = content.strip()
    
    # Ensure proper line breaks for common patterns
    # Fix "To," patterns - add line breaks after recipients
    content = re.sub(r'To,\s*\n?\s*', 'To,\n\n', content)
    
    # Fix date patterns - add line breaks after dates
    content = re.sub(r'Date:\s*([^\n]+)\n?', r'Date: \1\n\n', content)
    
    # Fix subject patterns - add line breaks after subject
    content = re.sub(r'Subject:\s*([^\n]+)\n?', r'Subject: \1\n\n', content)
    
    # Fix "Dear" patterns - add line breaks after salutation
    content = re.sub(r'Dear\s+([^\n]+),\n?', r'Dear \1,\n\n', content)
    
    # Fix signature patterns - add line breaks before signatures
    content = re.sub(r'\n(Yours\s+(?:faithfully|sincerely))', r'\n\n\1', content, flags=re.IGNORECASE)
    
    # Ensure double line breaks between paragraphs
    # Replace multiple newlines with exactly two
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Clean up any trailing whitespace
    content = re.sub(r'\n\s+', '\n', content)
    
    return content

def _format_draft_markdown(content: str) -> str:
    """Format draft markdown for beautiful display with proper markdown syntax"""
    lines = content.split('\n')
    formatted_lines = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Skip empty lines
        if not stripped:
            formatted_lines.append('')
            continue
        
        # Main title (first line, all caps or starts with specific patterns)
        if i == 0 or (stripped.isupper() and len(stripped.split()) <= 6):
            formatted_lines.append(f"# {stripped}")
        
        # Date line
        elif stripped.startswith('Date:'):
            formatted_lines.append(f"**{stripped}**")
            formatted_lines.append('')  # Add space after
        
        # To, From patterns
        elif stripped in ['To,', 'From:']:
            formatted_lines.append(f"**{stripped}**")
        
        # Subject line
        elif stripped.startswith('Subject:'):
            formatted_lines.append(f"**{stripped}**")
            formatted_lines.append('')
        
        # Section headers (ALL CAPS, colon at end)
        elif stripped.isupper() and stripped.endswith(':') and len(stripped.split()) <= 5:
            formatted_lines.append('')
            formatted_lines.append(f"### {stripped[:-1]}")
            formatted_lines.append('')
        
        # Salutation (Dear...)
        elif stripped.startswith('Dear '):
            formatted_lines.append(f"**{stripped}**")
            formatted_lines.append('')
        
        # Closing (Yours faithfully, Yours sincerely, etc.)
        elif re.match(r'^Yours\s+(faithfully|sincerely)', stripped, re.IGNORECASE):
            formatted_lines.append('')
            formatted_lines.append(f"**{stripped}**")
        
        # Name/signature at end
        elif i > len(lines) - 5 and stripped and not stripped.startswith(('-', 'Contact:', 'Email:', 'Address:', '1.', '2.', '3.')):
            # Could be a name
            if not any(stripped.startswith(prefix) for prefix in ['I ', 'The ', 'Please ', 'Enclosed ']):
                formatted_lines.append(f"**{stripped}**")
            else:
                formatted_lines.append(stripped)
        
        # Bullet points (lines starting with dash or number)
        elif stripped.startswith('-') or re.match(r'^\d+\.', stripped):
            formatted_lines.append(stripped)
        
        # Contact info at end
        elif stripped.startswith(('Contact:', 'Email:', 'Address:')):
            formatted_lines.append(f"**{stripped}**")
        
        # Regular paragraph text
        else:
            formatted_lines.append(stripped)
    
    return '\n'.join(formatted_lines)

@app.get("/")
async def root():
    return {
        "message": "Legal Document Templating API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "exa_configured": bool(settings.EXA_API_KEY)
    }

@app.post("/api/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and parse DOCX/PDF document"""
    try:
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size first
        max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_size_bytes:
            raise HTTPException(
                status_code=413, 
                detail=f"File size ({file_size / 1024 / 1024:.1f}MB) exceeds limit ({settings.MAX_FILE_SIZE_MB}MB)"
            )
        
        # Validate file type
        is_valid, error_message = DocumentParser.validate_file(
            file.filename or "unknown",
            file_size,
            settings.MAX_FILE_SIZE_MB
        )
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        
        # Parse document
        try:
            extracted_text = DocumentParser.parse_document(file_content, file.filename or "unknown")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        if not extracted_text or len(extracted_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Document appears to be empty or too short. Please upload a valid document."
            )
        
        # Store in database
        document = Document(
            id=str(uuid.uuid4()),
            filename=file.filename,
            mime_type=file.content_type,
            raw_text=extracted_text,
            file_path=None  # We're storing text directly, not saving files
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return DocumentUploadResponse(
            document_id=document.id,
            filename=document.filename,
            extracted_text=extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
            message=f"Document uploaded successfully. Extracted {len(extracted_text)} characters."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/extract", response_model=ExtractionResponse)
async def extract_template(
    request: ExtractionRequest,
    db: Session = Depends(get_db)
):
    """Extract variables and create template from uploaded document"""
    try:
        # Get document from database
        document = db.query(Document).filter(Document.id == request.document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        print(f"DEBUG: Extracting variables from document (length: {len(document.raw_text)} chars)")
        
        # Extract variables using Gemini
        extraction_result = TemplateExtractor.extract_variables_from_document(document.raw_text)
        
        print(f"DEBUG: Extracted {len(extraction_result['variables'])} variables")
        print(f"DEBUG: Variable keys: {[v['key'] for v in extraction_result['variables']]}")
        
        # Generate template ID
        template_id = TemplateExtractor.generate_template_id(request.title)
        
        # Create template markdown
        template_markdown = TemplateExtractor.create_template_markdown(
            document.raw_text,
            extraction_result['variables'],
            template_id,
            request.title,
            extraction_result.get('doc_type', 'Unknown'),
            extraction_result.get('jurisdiction', 'Unknown'),
            extraction_result.get('similarity_tags', []),
            request.file_description or ""
        )
        
        print(f"DEBUG: Template markdown length: {len(template_markdown)}")
        
        return ExtractionResponse(
            template_id=template_id,
            title=request.title,
            doc_type=extraction_result.get('doc_type'),
            jurisdiction=extraction_result.get('jurisdiction'),
            similarity_tags=extraction_result.get('similarity_tags', []),
            variables=[VariableSchema(**v) for v in extraction_result['variables']],
            template_markdown=template_markdown,
            message=f"Extracted {len(extraction_result['variables'])} variables successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@app.post("/api/templates", response_model=TemplateResponse)
async def save_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db)
):
    """Save template with variables to database"""
    try:
        # Check if template_id already exists
        existing = db.query(Template).filter(Template.template_id == template_data.template_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Template ID already exists")
        
        # Generate embedding for template
        embedding_text = f"{template_data.title} {template_data.doc_type} {template_data.jurisdiction} {' '.join(template_data.similarity_tags)}"
        embedding = embedding_service.generate_document_embedding(embedding_text)
        
        # Create template
        template = Template(
            id=str(uuid.uuid4()),
            template_id=template_data.template_id,
            title=template_data.title,
            file_description=template_data.file_description,
            doc_type=template_data.doc_type,
            jurisdiction=template_data.jurisdiction,
            similarity_tags=template_data.similarity_tags,
            body_md=template_data.body_md,
            embedding=embedding
        )
        
        db.add(template)
        db.flush()  # Get template.id
        
        # Create variables
        for var_data in template_data.variables:
            variable = TemplateVariable(
                id=str(uuid.uuid4()),
                template_id=template.id,
                key=var_data.key,
                label=var_data.label,
                description=var_data.description,
                example=var_data.example,
                required=var_data.required,
                dtype=var_data.dtype,
                regex=var_data.regex,
                enum_values=var_data.enum_values
            )
            db.add(variable)
        
        db.commit()
        db.refresh(template)
        
        return TemplateResponse(
            id=template.id,
            template_id=template.template_id,
            title=template.title,
            file_description=template.file_description,
            doc_type=template.doc_type,
            jurisdiction=template.jurisdiction,
            similarity_tags=template.similarity_tags,
            body_md=template.body_md,
            created_at=template.created_at,
            updated_at=template.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save template: {str(e)}")

@app.get("/api/templates", response_model=list[TemplateResponse])
async def list_templates(db: Session = Depends(get_db)):
    """List all templates"""
    templates = db.query(Template).order_by(Template.created_at.desc()).all()
    return templates

@app.get("/api/templates/{template_id}", response_model=TemplateWithVariables)
async def get_template(template_id: str, db: Session = Depends(get_db)):
    """Get template with variables"""
    template = db.query(Template).filter(Template.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    variables = db.query(TemplateVariable).filter(
        TemplateVariable.template_id == template.id
    ).all()
    
    return TemplateWithVariables(
        id=template.id,
        template_id=template.template_id,
        title=template.title,
        file_description=template.file_description,
        doc_type=template.doc_type,
        jurisdiction=template.jurisdiction,
        similarity_tags=template.similarity_tags,
        body_md=template.body_md,
        created_at=template.created_at,
        updated_at=template.updated_at,
        variables=[VariableSchema(
            key=v.key,
            label=v.label,
            description=v.description,
            example=v.example,
            required=v.required,
            dtype=v.dtype
        ) for v in variables]
    )

@app.post("/api/draft", response_model=DraftResponse)
async def create_draft(
    request: DraftRequest,
    db: Session = Depends(get_db)
):
    """Start drafting process - match template and generate questions"""
    try:
        # Check if template_id is provided directly
        if hasattr(request, 'template_id') and request.template_id:
            print(f"DEBUG: Draft request with direct template_id: {request.template_id}")
            
            # Load template directly
            template = db.query(Template).filter(Template.template_id == request.template_id).first()
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")
            
            # Find alternatives by using a simple query to other templates
            all_templates = db.query(Template).all()
            alternatives = []
            for t in all_templates:
                if t.template_id != request.template_id:  # Don't include current template
                    alternatives.append({
                        "template_id": t.template_id,
                        "title": t.title,
                        "doc_type": t.doc_type
                    })
            
            match_result = {
                "template": template,
                "confidence": 1.0,
                "justification": f"Using selected template: {template.title}",
                "alternatives": alternatives[:2]  # Limit to 2 alternatives
            }
        else:
            print(f"DEBUG: Draft request for query: {request.user_query}")
            
            # Match template by query
            match_result = template_matcher.match_template(request.user_query, db)
            
            print(f"DEBUG: Match result: {match_result}")
            
            if not match_result:
                print(f"DEBUG: No template found - returning 404")
                raise HTTPException(
                    status_code=404,
                    detail=f"No suitable template found (confidence < {settings.CONFIDENCE_THRESHOLD}). Try uploading a template or broadening your request."
                )
        
        template = match_result["template"]
        
        # Get template variables
        variables = db.query(TemplateVariable).filter(
            TemplateVariable.template_id == template.id
        ).all()
        
        # Convert to dict format
        variable_dicts = [
            {
                "key": v.key,
                "label": v.label,
                "description": v.description,
                "example": v.example,
                "required": v.required,
                "dtype": v.dtype
            }
            for v in variables
        ]
        
        # Extract pre-filled values from query
        pre_filled = question_generator.extract_values_from_query(
            request.user_query or f"Load template: {template.title}",
            variable_dicts
        )
        
        # Find missing variables
        missing_vars = [
            v for v in variable_dicts
            if v["key"] not in pre_filled or pre_filled[v["key"]] is None
        ]
        
        # Generate questions for missing variables
        questions = question_generator.generate_questions(missing_vars)
        
        # Create instance
        instance = Instance(
            id=str(uuid.uuid4()),
            template_id=template.id,
            user_query=request.user_query or f"Load template: {template.title}",
            answers_json=pre_filled,
            draft_md=None,
            draft_number=1
        )
        
        db.add(instance)
        db.commit()
        db.refresh(instance)
        
        return DraftResponse(
            instance_id=instance.id,
            template_id=template.template_id,
            template_title=template.title,
            pre_filled_variables=pre_filled,
            missing_variables=[v["key"] for v in missing_vars],
            questions=[QuestionSchema(**q) for q in questions],
            draft_md=None,
            message=f"Matched template '{template.title}' with {match_result['confidence']:.0%} confidence. {len(questions)} questions to answer.",
            alternatives=match_result.get("alternatives", [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"DEBUG: Draft endpoint error: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Draft creation failed: {str(e)}")

@app.post("/api/draft/finalize", response_model=FinalDraftResponse)
async def finalize_draft(
    submission: AnswerSubmission,
    db: Session = Depends(get_db)
):
    """Generate final draft with user answers"""
    try:
        # Get instance
        instance = db.query(Instance).filter(Instance.id == submission.instance_id).first()
        if not instance:
            raise HTTPException(status_code=404, detail="Draft instance not found")
        
        # Get template
        template = db.query(Template).filter(Template.id == instance.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Merge pre-filled and new answers
        all_answers = {**(instance.answers_json or {}), **submission.answers}
        
        # CRITICAL CHECK: Ensure template has variables
        template_variables = db.query(TemplateVariable).filter(
            TemplateVariable.template_id == template.id
        ).all()
        
        if len(template_variables) == 0:
            raise HTTPException(
                status_code=400,
                detail="Template has no variables - it appears to be an article/description, not a template. "
                       "Please try a different document or upload the template directly."
            )
        
        # Replace variables in template
        draft_md = template.body_md
        
        # Format the template content for better markdown rendering
        draft_md = _format_template_content(draft_md)
        
        # Debug logging
        print(f"DEBUG: All answers: {all_answers}")
        print(f"DEBUG: Template variables count: {len(template_variables)}")
        print(f"DEBUG: Template body preview: {draft_md[:500]}")
        
        # Replace variables
        replaced_count = 0
        for key, value in all_answers.items():
            if value is not None:
                placeholder = f"{{{{{key}}}}}"
                if placeholder in draft_md:
                    print(f"DEBUG: Replacing {placeholder} with {value}")
                    draft_md = draft_md.replace(placeholder, str(value))
                    replaced_count += 1
                else:
                    print(f"DEBUG: Warning - placeholder {placeholder} not found in template")
        
        print(f"DEBUG: Replaced {replaced_count}/{len(all_answers)} variables")
        
        # Remove UOIONHHC tracking code from final output
        draft_md = draft_md.replace("UOIONHHC", "")
        draft_md = draft_md.replace("<!--  -->", "")
        
        # Clean up any remaining HTML comments
        import re
        draft_md = re.sub(r'<!--.*?-->', '', draft_md, flags=re.DOTALL)
        
        # Format the markdown for better display
        draft_md = _format_draft_markdown(draft_md)
        
        print(f"DEBUG: Final draft preview: {draft_md[:500]}")
        
        # Update instance
        instance.answers_json = all_answers
        instance.draft_md = draft_md
        
        db.commit()
        db.refresh(instance)
        
        return FinalDraftResponse(
            instance_id=instance.id,
            draft_md=draft_md,
            draft_number=instance.draft_number,
            message="Draft generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Draft finalization failed: {str(e)}")

@app.post("/api/web/search", response_model=WebSearchResponse)
async def search_web(request: WebSearchRequest):
    """Search for similar documents on the web using exa.ai"""
    try:
        print(f"DEBUG: Web search requested for query: {request.query}")
        print(f"DEBUG: Exa API configured: {bool(settings.EXA_API_KEY)}")
        
        results = web_bootstrap.search_web_documents(request.query, request.num_results)
        
        print(f"DEBUG: Web search returned {len(results)} results")
        
        return WebSearchResponse(
            results=[WebSearchResult(**r) for r in results],
            message=f"Found {len(results)} documents online"
        )
    except ValueError as e:
        print(f"DEBUG: Web search ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"DEBUG: Web search Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Web search failed: {str(e)}")

@app.post("/api/web/bootstrap", response_model=WebBootstrapResponse)
async def bootstrap_from_web(request: WebBootstrapRequest, db: Session = Depends(get_db)):
    """Fetch document from web and create template"""
    try:
        result = web_bootstrap.fetch_and_templatize(
            request.document_id,
            request.document_url,
            request.title,
            db
        )
        
        return WebBootstrapResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Web bootstrap failed: {str(e)}")

@app.get("/api/draft/{instance_id}/download/docx")
async def download_draft_docx(instance_id: str, db: Session = Depends(get_db)):
    """Download draft as DOCX file"""
    try:
        # Get instance
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance or not instance.draft_md:
            raise HTTPException(status_code=404, detail="Draft not found")
        
        print(f"DEBUG: Generating DOCX for instance {instance_id}")
        print(f"DEBUG: Draft markdown length: {len(instance.draft_md)}")
        print(f"DEBUG: Draft preview: {instance.draft_md[:200]}")
        
        # Create temporary file
        temp_dir = tempfile.gettempdir()
        output_path = os.path.join(temp_dir, f"draft_{instance.draft_number}.docx")
        
        # Generate DOCX
        docx_generator.markdown_to_docx(instance.draft_md, output_path)
        
        print(f"DEBUG: DOCX generated successfully at {output_path}")
        
        return FileResponse(
            output_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=f"draft_{instance.draft_number}.docx"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOCX generation failed: {str(e)}")

@app.post("/api/draft/{instance_id}/regenerate", response_model=FinalDraftResponse)
async def regenerate_draft(instance_id: str, db: Session = Depends(get_db)):
    """Regenerate draft with existing answers"""
    try:
        # Get instance
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            raise HTTPException(status_code=404, detail="Draft instance not found")
        
        # Get template
        template = db.query(Template).filter(Template.id == instance.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Replace variables in template
        draft_md = template.body_md
        all_answers = instance.answers_json or {}
        
        for key, value in all_answers.items():
            if value is not None:
                draft_md = draft_md.replace(f"{{{{{key}}}}}", str(value))
        
        # Increment draft number
        instance.draft_number += 1
        instance.draft_md = draft_md
        
        db.commit()
        db.refresh(instance)
        
        return FinalDraftResponse(
            instance_id=instance.id,
            draft_md=draft_md,
            draft_number=instance.draft_number,
            message="Draft regenerated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regeneration failed: {str(e)}")

@app.post("/api/draft/{instance_id}/edit", response_model=DraftResponse)
async def edit_draft_variables(instance_id: str, db: Session = Depends(get_db)):
    """Get questions for editing draft variables"""
    try:
        # Get instance
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            raise HTTPException(status_code=404, detail="Draft instance not found")
        
        # Get template
        template = db.query(Template).filter(Template.id == instance.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Get template variables
        variables = db.query(TemplateVariable).filter(
            TemplateVariable.template_id == template.id
        ).all()
        
        # Convert to dict format
        variable_dicts = [
            {
                "key": v.key,
                "label": v.label,
                "description": v.description,
                "example": v.example,
                "required": v.required,
                "dtype": v.dtype
            }
            for v in variables
        ]
        
        # Generate questions for all variables
        questions = question_generator.generate_questions(variable_dicts)
        
        return DraftResponse(
            instance_id=instance.id,
            template_id=template.template_id,
            template_title=template.title,
            pre_filled_variables=instance.answers_json or {},
            missing_variables=[v["key"] for v in variable_dicts],
            questions=[QuestionSchema(**q) for q in questions],
            draft_md=instance.draft_md,
            message=f"Edit mode: {len(questions)} variables available"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Edit failed: {str(e)}")

@app.get("/api/draft/alternatives/{template_id}")
async def get_template_alternatives(template_id: str, user_query: str, db: Session = Depends(get_db)):
    """Get alternative templates for selection"""
    try:
        # Match template to get alternatives
        match_result = template_matcher.match_template(user_query, db)
        
        if not match_result:
            return {"alternatives": []}
        
        alternatives = match_result.get("alternatives", [])
        
        return {"alternatives": alternatives}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get alternatives: {str(e)}")

if __name__ == "__main__":
    # Configure uvicorn with file size limits
    max_request_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024  # Convert MB to bytes
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        limit_max_requests=1000,
        limit_concurrency=100,
        # Note: uvicorn doesn't have a direct max_request_size parameter
        # File size is handled in the upload endpoint
    )
