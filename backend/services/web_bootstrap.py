from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from services.exa_service import exa_service
from services.gemini_service import gemini_service
from services.template_extractor import TemplateExtractor
from services.embedding_service import embedding_service
from database import Template, TemplateVariable
import uuid
import json

class WebBootstrap:
    """Bootstrap templates from web when no local match is found"""
    
    @staticmethod
    def _extract_template_with_llm(raw_content: str, title: str) -> str:
        """Use Gemini to intelligently extract the actual template from messy web content
        
        Args:
            raw_content: Raw HTML text from web page (may include FAQ, SEO, etc.)
            title: Template title for context
            
        Returns:
            Clean template content with only the actual document
        """
        system_prompt = """You are a legal document extraction expert. Your task is to extract ANY usable template or form content from web page content that may contain mixed elements.

INSTRUCTIONS:
1. Look for ANY template-like structure, even if mixed with other content
2. Extract template patterns including:
   - Date fields, name fields, address fields
   - Placeholder patterns like [DATE], [NAME], [COMPANY]
   - Form fields or blank spaces for filling
   - Structured letter formats
   - Any content that looks like it could be a fillable template

3. REMOVE obvious junk:
   - FAQ sections (but keep if they contain template examples)
   - Pure marketing text (Buy now, Download now)
   - Navigation elements

4. KEEP and format:
   - Any template structure you find
   - Placeholder patterns (convert [DATE] to {{date}})
   - Structured content that could be used as a template
   - If you find a sample letter or form, extract it

5. FORMATTING RULES:
   - Use proper markdown structure with blank lines between sections
   - Put heading on its own line with blank line after
   - Put date field on its own line with blank line after
   - Put "Dear {{name}}," on its own line with blank line after
   - Add blank lines between paragraphs
   - Do NOT duplicate placeholders (use each {{variable}} only once)

6. If you find even a partial template or form structure, return it
7. Only return "NO_TEMPLATE_FOUND" if there's absolutely no template-like content
8. Convert all [VARIABLE] patterns to {{variable}} format (snake_case)

CRITICAL: You MUST return valid JSON with a "template" key, even if the content is not ideal."""

        user_prompt = f"""Extract the actual legal document template from this web content.

TEMPLATE TITLE: {title}

WEB CONTENT:
{raw_content[:8000]}

Return ONLY valid JSON:
{{"template": "<extracted template content here, or empty string if nothing found>"}}"""

        try:
            print(f"DEBUG: LLM extraction for template: {title}")
            print(f"DEBUG: Raw content length: {len(raw_content)}")
            print(f"DEBUG: Raw content preview: {raw_content[:500]}")

            result = gemini_service._generate_json_response(system_prompt, user_prompt)
            
            # Handle different response structures
            if isinstance(result, dict):
                extracted = result.get('template', '')
            else:
                print(f"DEBUG: Unexpected result type: {type(result)}, result: {result}")
                extracted = ''
            
            extracted = extracted.strip() if extracted else ''
            print(f"DEBUG: LLM extracted template length: {len(extracted)}")
            print(f"DEBUG: LLM extracted preview: {extracted[:300] if extracted else 'None'}")

            # Check if template was actually found
            if not extracted or extracted == "NO_TEMPLATE_FOUND" or len(extracted) < 100:
                raise ValueError(
                    "Could not extract a valid template from the web content. "
                    "The page appears to be mostly FAQ/description text with no usable template structure."
                )

            # Convert [VARIABLE] patterns to {{variable}} format (fallback if LLM didn't do it)
            extracted = WebBootstrap._convert_placeholders(extracted)
            
            # Clean up formatting issues
            extracted = WebBootstrap._clean_template_formatting(extracted)

            return extracted
            
        except Exception as e:
            # If LLM extraction fails, try with cleaned content
            print(f"DEBUG: Template extraction error: {str(e)}")
            raise ValueError(f"Template extraction failed: {str(e)}")

    @staticmethod
    def _convert_placeholders(template_text: str) -> str:
        """Convert [VARIABLE] placeholders to {{variable}} format"""
        import re

        # Pattern to match [VARIABLE_NAME] and convert to {{variable_name}}
        pattern = r'\[([^\]]+)\]'

        def convert_placeholder(match):
            variable_name = match.group(1).strip()

            # Convert to snake_case and lowercase
            snake_case = re.sub(r'[^a-zA-Z0-9]', '_', variable_name).lower()

            # Handle special cases
            if snake_case == 'employee_name':
                return '{{employee_name}}'
            elif snake_case == 'company_name':
                return '{{company_name}}'
            elif snake_case == 'termination_date':
                return '{{termination_date}}'
            elif snake_case == 'date':
                return '{{date}}'
            elif snake_case == 'your_name':
                return '{{your_name}}'
            elif snake_case == 'your_title':
                return '{{your_title}}'
            elif snake_case == 'reason_for_termination':
                return '{{reason_for_termination}}'
            elif snake_case == 'information_on_final_paycheck_benefits_and_return_of_company_property':
                return '{{final_paycheck_info}}'
            else:
                # Generic conversion - keep as is but in {{}} format
                return '{{' + snake_case + '}}'

        return re.sub(pattern, convert_placeholder, template_text)
    
    @staticmethod
    def _clean_template_formatting(template_text: str) -> str:
        """Clean up formatting issues in extracted templates"""
        import re
        
        # Remove duplicate consecutive placeholders (e.g., {{date}} {{date}} → {{date}})
        template_text = re.sub(r'(\{\{[^}]+\}\})\s*\1', r'\1', template_text)
        
        # Ensure proper line breaks after heading
        template_text = re.sub(r'(# [^\n]+)\n(\{\{)', r'\1\n\n\2', template_text)
        
        # Add line breaks after date/address fields
        template_text = re.sub(r'(\{\{date\}\})\n(\{\{date\}\})', r'\1\n\n', template_text)
        
        # Ensure proper spacing around "Dear" salutation
        template_text = re.sub(r'(\{\{[^}]+\}\})\n(Dear)', r'\1\n\n\2', template_text)
        
        # Add line breaks between major sections
        template_text = re.sub(r'(\.\})\n([A-Z][a-z])', r'\1\n\n\2', template_text)
        
        # Fix property placeholder if too long
        template_text = re.sub(
            r'\{\{type_of_property__cellphone__laptop__keys__etc__\}\}',
            '{{company_property}}',
            template_text
        )
        
        return template_text
    
    @staticmethod
    def _convert_field_labels_to_placeholders(template_text: str) -> str:
        """Convert standalone field labels to {{variable}} placeholders
        
        Handles templates that are just form field lists like:
        Full Name
        Age
        Address
        
        Converts to:
        Full Name: {{full_name}}
        Age: {{age}}
        Address: {{address}}
        """
        import re
        
        # Common field label patterns
        field_patterns = {
            r'^Full Name$': 'full_name',
            r'^First Name$': 'first_name',
            r'^Last Name$': 'last_name',
            r'^Age$': 'age',
            r'^Address$': 'address',
            r'^Email$': 'email',
            r'^Contact No$': 'contact_number',
            r'^Phone$': 'phone',
            r'^Profession$': 'profession',
            r'^Square Feet$': 'square_feet',
            r'^Survey Number$': 'survey_number',
            r'^Agreement From Date$': 'agreement_from_date',
            r'^Agreement To Date$': 'agreement_to_date',
            r'^Monthly Rent$': 'monthly_rent',
            r'^Security Deposit$': 'security_deposit',
        }
        
        lines = template_text.split('\n')
        processed_lines = []
        
        for line in lines:
            stripped = line.strip()
            matched = False
            
            # Check if line matches a field label pattern
            for pattern, var_name in field_patterns.items():
                if re.match(pattern, stripped, re.IGNORECASE):
                    # Convert to "Label: {{variable}}" format
                    processed_lines.append(f"{stripped}: {{{{{var_name}}}}}")
                    matched = True
                    break
            
            if not matched:
                # Check for generic patterns like "Owner Details", "Tenant Details"
                if stripped.endswith('Details'):
                    processed_lines.append(f"\n## {stripped}\n")
                elif len(stripped) > 0 and len(stripped) < 50 and stripped[0].isupper():
                    # Looks like a field label - convert to snake_case variable
                    var_name = re.sub(r'[^a-zA-Z0-9]', '_', stripped).lower().strip('_')
                    processed_lines.append(f"{stripped}: {{{{{var_name}}}}}")
                else:
                    processed_lines.append(line)
        
        return '\n'.join(processed_lines)
    
    @staticmethod
    def _convert_blanks_to_placeholders(template_text: str) -> str:
        """Convert blank lines (______) to proper {{variable}} placeholders
        
        This is critical for web-extracted templates that have underscore
        placeholder lines instead of {{variable}} format.
        """
        import re
        
        # Pattern: lines with lots of underscores/dashes/dots (blank line indicators)
        # Examples: ________________, _____________, ...................
        blank_patterns = [
            (r'_{15,}', 'field'),  # 15+ underscores = blank field
            (r'\.{15,}', 'field'),  # 15+ dots = blank field
            (r'-{15,}', 'field'),   # 15+ dashes = blank field
        ]
        
        lines = template_text.split('\n')
        processed_lines = []
        field_counter = {}  # Track field numbers for uniqueness
        
        for i, line in enumerate(lines):
            # Check if line contains mostly blank indicators
            modified_line = line
            for pattern, field_type in blank_patterns:
                matches = re.findall(pattern, line)
                if matches:
                    # Replace blank line with placeholder
                    # Try to infer field name from context
                    context = ''
                    
                    # Look at previous line for context
                    if i > 0:
                        prev_line = lines[i - 1].lower()
                        if 'name' in prev_line or 'party' in prev_line:
                            context = 'party_name'
                        elif 'address' in prev_line or 'location' in prev_line:
                            context = 'address'
                        elif 'date' in prev_line:
                            context = 'date'
                        elif 'signature' in prev_line:
                            context = 'signature'
                        elif 'email' in prev_line:
                            context = 'email'
                        elif 'phone' in prev_line or 'contact' in prev_line:
                            context = 'phone'
                        elif 'purpose' in prev_line:
                            context = 'purpose'
                        elif 'period' in prev_line or 'duration' in prev_line:
                            context = 'period'
                        elif 'amount' in prev_line or 'cost' in prev_line or 'price' in prev_line:
                            context = 'amount'
                    
                    # If no context found, use generic field name
                    if not context:
                        field_counter['generic_field'] = field_counter.get('generic_field', 0) + 1
                        context = f'field_{field_counter["generic_field"]}'
                    else:
                        field_counter[context] = field_counter.get(context, 0) + 1
                        if field_counter[context] > 1:
                            context = f'{context}_{field_counter[context]}'
                    
                    # Replace the blank with {{context}}
                    modified_line = re.sub(pattern, f'{{{{{context}}}}}', modified_line)
            
            processed_lines.append(modified_line)
        
        return '\n'.join(processed_lines)

    @staticmethod
    def extract_search_terms(query: str) -> str:
        """Extract key search terms from user query using Gemini"""
        system_prompt = """Extract key search terms from the user's query for finding legal documents online.

Rules:
1. Return ONLY valid JSON
2. Focus on document type, jurisdiction, and key legal terms
3. Remove filler words and conversational language
4. Keep it concise (3-5 key terms)"""

        user_prompt = f"""User query: "{query}"

Extract search terms. Return JSON:
{{
  "search_terms": ["insurance notice", "india", "motor accident"]
}}"""

        try:
            result = gemini_service._generate_json_response(system_prompt, user_prompt)
            terms = result.get("search_terms", [])
            return " ".join(terms)
        except:
            # Fallback: use original query
            return query
    
    @staticmethod
    def search_web_documents(query: str, num_results: int = 3) -> List[Dict[str, Any]]:
        """Search for similar documents on the web"""
        if not exa_service:
            raise ValueError("Exa service not configured. Please add EXA_API_KEY to environment.")
        
        # Extract search terms
        search_terms = WebBootstrap.extract_search_terms(query)
        
        # Search using exa
        results = exa_service.search_documents(search_terms, num_results=num_results)
        
        return results
    
    @staticmethod
    def fetch_and_templatize(
        document_id: str,
        document_url: str,
        title: str,
        db: Session
    ) -> Dict[str, Any]:
        """Fetch document content and create template"""
        if not exa_service:
            raise ValueError("Exa service not configured")
        
        # Fetch document content (raw from Exa)
        raw_content = exa_service.get_document_content(document_id)
        
        if not raw_content or len(raw_content.strip()) < 100:
            raise ValueError("Document content is too short or empty")
        
        # SMART EXTRACTION: Use Gemini to extract ONLY the template from messy content
        # If LLM fails, try with cleaned content as fallback
        try:
            content = WebBootstrap._extract_template_with_llm(raw_content, title)
        except ValueError:
            # Fallback: Try with cleaned content
            cleaned_content = exa_service.clean_web_content(raw_content)
            if len(cleaned_content.strip()) > 500:
                print(f"DEBUG: LLM extraction failed, trying cleaned content: {len(cleaned_content)} chars")
                content = cleaned_content
            else:
                raise ValueError("Content too short after cleaning - no usable template found")
        
        # CRITICAL: Convert field labels and blank lines to proper {{variable}} placeholders
        # This ensures web-extracted templates can have variables replaced
        print(f"DEBUG: Converting field labels to placeholders in extracted template")
        content = WebBootstrap._convert_field_labels_to_placeholders(content)
        print(f"DEBUG: Template after field label conversion, preview: {content[:500]}")
        
        print(f"DEBUG: Converting blank lines to placeholders in extracted template")
        content = WebBootstrap._convert_blanks_to_placeholders(content)
        print(f"DEBUG: Template after blank conversion, preview: {content[:500]}")
        
        # Additional validation: ensure it looks like a legal document
        content_lower = content.lower()
        legal_keywords = [
            'agreement', 'contract', 'notice', 'letter', 'termination', 
            'employment', 'lease', 'rental', 'party', 'date', 'whereas',
            'hereby', 'undersigned', 'signature', 'witness'
        ]
        
        keyword_count = sum(1 for keyword in legal_keywords if keyword in content_lower)
        if keyword_count < 2:
            raise ValueError("Content does not appear to be a legal document. Please try a different source.")
        
        # NEW: Check for excessive non-legal content
        # Count lines that are definitely NOT legal content
        non_legal_phrases = [
            "is not a futuristic concept",
            "already a part of many workplaces",
            "here's how employers",
            "expert said",
            "learn how",
            "proliferation of artificial",
            "could help usher in"
        ]
        
        non_legal_count = sum(1 for phrase in non_legal_phrases if phrase in content_lower)
        total_lines = len(content.split('\n'))
        
        # If more than 15% of the content is non-legal, reject it
        if total_lines > 20 and non_legal_count > (total_lines * 0.15):
            raise ValueError(f"Content appears to be mixed with articles/marketing content. "
                           f"Found {non_legal_count} non-legal sections out of {total_lines} lines. "
                           f"Please try a different source or upload the document directly.")
        
        # Extract variables
        extraction_result = TemplateExtractor.extract_variables_from_document(content)
        
        # CRITICAL: Ensure we extracted some variables
        if not extraction_result.get('variables') or len(extraction_result['variables']) == 0:
            raise ValueError(
                "No variables were extracted from this document. "
                "It appears to be an article or description, not a fillable template. "
                "Please try a different document that has actual form fields/placeholders, "
                "or upload your template directly via the Upload page."
            )
        
        # Generate template ID
        template_id = TemplateExtractor.generate_template_id(title)
        
        # Create template markdown
        template_markdown = TemplateExtractor.create_template_markdown(
            content,
            extraction_result['variables'],
            template_id,
            title,
            extraction_result.get('doc_type', 'Unknown'),
            extraction_result.get('jurisdiction', 'Unknown'),
            extraction_result.get('similarity_tags', []),
            f"Bootstrapped from web: {document_url}"
        )
        
        # Generate embedding
        embedding_text = f"{title} {extraction_result.get('doc_type')} {extraction_result.get('jurisdiction')} {' '.join(extraction_result.get('similarity_tags', []))}"
        embedding = embedding_service.generate_document_embedding(embedding_text)
        
        # Save template to database
        template = Template(
            id=str(uuid.uuid4()),
            template_id=template_id,
            title=title,
            file_description=f"Bootstrapped from web: {document_url}",
            doc_type=extraction_result.get('doc_type'),
            jurisdiction=extraction_result.get('jurisdiction'),
            similarity_tags=extraction_result.get('similarity_tags', []),
            body_md=template_markdown,
            embedding=embedding
        )
        
        db.add(template)
        db.flush()
        
        # Save variables
        for var_data in extraction_result['variables']:
            variable = TemplateVariable(
                id=str(uuid.uuid4()),
                template_id=template.id,
                key=var_data['key'],
                label=var_data['label'],
                description=var_data.get('description'),
                example=var_data.get('example'),
                required=var_data.get('required', False),
                dtype=var_data.get('dtype', 'string'),
                regex=var_data.get('regex'),
                enum_values=var_data.get('enum_values')
            )
            db.add(variable)
        
        db.commit()
        db.refresh(template)
        
        return {
            "template_id": template.template_id,
            "title": template.title,
            "variables_count": len(extraction_result['variables']),
            "message": f"Successfully created template from web document"
        }

web_bootstrap = WebBootstrap()
