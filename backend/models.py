from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Request/Response Models
class VariableSchema(BaseModel):
    key: str
    label: str
    description: Optional[str] = None
    example: Optional[str] = None
    required: bool = False
    dtype: str = "string"
    regex: Optional[str] = None
    enum_values: Optional[List[str]] = None

class TemplateCreate(BaseModel):
    template_id: str
    title: str
    file_description: Optional[str] = None
    doc_type: Optional[str] = None
    jurisdiction: Optional[str] = None
    similarity_tags: List[str] = []
    body_md: str
    variables: List[VariableSchema]

class TemplateResponse(BaseModel):
    id: str
    template_id: str
    title: str
    file_description: Optional[str]
    doc_type: Optional[str]
    jurisdiction: Optional[str]
    similarity_tags: List[str]
    body_md: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TemplateWithVariables(TemplateResponse):
    variables: List[VariableSchema]

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    extracted_text: str
    message: str

class ExtractionRequest(BaseModel):
    document_id: str
    title: str
    file_description: Optional[str] = None

class ExtractionResponse(BaseModel):
    template_id: str
    title: str
    doc_type: Optional[str]
    jurisdiction: Optional[str]
    similarity_tags: List[str]
    variables: List[VariableSchema]
    template_markdown: str
    message: str

class TemplateMatchResult(BaseModel):
    template_id: str
    title: str
    confidence: float
    justification: str
    alternatives: List[Dict[str, Any]] = []

class QuestionSchema(BaseModel):
    variable_key: str
    question: str
    format_hint: Optional[str] = None

class DraftRequest(BaseModel):
    user_query: Optional[str] = None
    template_id: Optional[str] = None

class DraftResponse(BaseModel):
    instance_id: str
    template_id: str
    template_title: str
    pre_filled_variables: Dict[str, Any]
    missing_variables: List[str]
    questions: List[QuestionSchema]
    draft_md: Optional[str] = None
    message: str
    alternatives: List[Dict[str, Any]] = []

class AnswerSubmission(BaseModel):
    instance_id: str
    answers: Dict[str, Any]

class FinalDraftResponse(BaseModel):
    instance_id: str
    draft_md: str
    draft_number: int
    message: str

class WebSearchRequest(BaseModel):
    query: str
    num_results: int = 3

class WebSearchResult(BaseModel):
    id: str
    title: str
    url: str
    snippet: str
    published_date: Optional[str] = None

class WebSearchResponse(BaseModel):
    results: List[WebSearchResult]
    message: str

class WebBootstrapRequest(BaseModel):
    document_id: str
    document_url: str
    title: str

class WebBootstrapResponse(BaseModel):
    template_id: str
    title: str
    variables_count: int
    message: str
