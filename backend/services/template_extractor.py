import re
from typing import List, Dict, Any, Tuple
from services.gemini_service import gemini_service
from config import settings

class TemplateExtractor:
    """Extract variables and create templates from documents - UOIONHHC"""
    
    CHUNK_SIZE = 2000  # tokens (approximate by characters)
    MAX_DOCUMENT_SIZE = 100000  # Maximum document size in characters (100KB)
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = CHUNK_SIZE) -> List[str]:
        """Split long text into chunks for processing"""
        # Simple chunking by paragraphs
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = []
        current_length = 0
        
        for para in paragraphs:
            para_length = len(para)
            
            if current_length + para_length > chunk_size and current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = [para]
                current_length = para_length
            else:
                current_chunk.append(para)
                current_length += para_length
        
        if current_chunk:
            chunks.append('\n\n'.join(current_chunk))
        
        return chunks
    
    @staticmethod
    def deduplicate_variables(variables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate variables by key"""
        seen_keys = set()
        unique_vars = []
        
        for var in variables:
            if var['key'] not in seen_keys:
                seen_keys.add(var['key'])
                unique_vars.append(var)
        
        return unique_vars
    
    @staticmethod
    def extract_variables_from_document(document_text: str) -> Dict[str, Any]:
        """Extract variables from entire document (handles chunking)"""
        # Check document size to prevent memory issues
        if len(document_text) > TemplateExtractor.MAX_DOCUMENT_SIZE:
            # Truncate document if too large
            document_text = document_text[:TemplateExtractor.MAX_DOCUMENT_SIZE]
            print(f"Warning: Document truncated to {TemplateExtractor.MAX_DOCUMENT_SIZE} characters")
            
        chunks = TemplateExtractor.chunk_text(document_text)
        
        all_variables = []
        similarity_tags = []
        doc_type = None
        jurisdiction = None
        
        for i, chunk in enumerate(chunks):
            chunk_number = i + 1
            
            # Pass previously found variables to avoid duplicates
            existing_vars = [{"key": v["key"], "label": v["label"]} for v in all_variables]
            
            result = gemini_service.extract_variables(
                chunk,
                existing_variables=existing_vars if chunk_number > 1 else None,
                chunk_number=chunk_number
            )
            
            # Collect variables
            all_variables.extend(result.get('variables', []))
            
            # Collect metadata from first chunk
            if chunk_number == 1:
                similarity_tags = result.get('similarity_tags', [])
                doc_type = result.get('doc_type')
                jurisdiction = result.get('jurisdiction')
        
        # Deduplicate variables
        unique_variables = TemplateExtractor.deduplicate_variables(all_variables)
        
        return {
            'variables': unique_variables,
            'similarity_tags': similarity_tags,
            'doc_type': doc_type,
            'jurisdiction': jurisdiction
        }
    
    @staticmethod
    def create_template_markdown(
        document_text: str,
        variables: List[Dict[str, Any]],
        template_id: str,
        title: str,
        doc_type: str,
        jurisdiction: str,
        similarity_tags: List[str],
        file_description: str = ""
    ) -> str:
        """Create Markdown template with YAML front-matter and variable substitution"""
        
        # Replace variable values with {{variable_key}} placeholders
        template_body = document_text
        
        # Sort variables by example length (longest first) to avoid partial replacements
        sorted_vars = sorted(
            [v for v in variables if v.get('example')],
            key=lambda x: len(x.get('example', '')),
            reverse=True
        )
        
        for var in sorted_vars:
            example = var.get('example', '')
            if example and len(example) > 2:  # Only replace meaningful examples
                # Escape special regex characters
                escaped_example = re.escape(example)
                # Replace with variable placeholder
                template_body = re.sub(
                    escaped_example,
                    f"{{{{{var['key']}}}}}",
                    template_body,
                    flags=re.IGNORECASE
                )
        
        # Create YAML front-matter
        yaml_front_matter = f"""---
template_id: {template_id}
title: {title}
doc_type: {doc_type or 'Unknown'}
jurisdiction: {jurisdiction or 'Unknown'}
similarity_tags: {similarity_tags}
File_description: {file_description}
---

<!-- {settings.TRACKING_CODE} -->

"""
        
        return yaml_front_matter + template_body
    
    @staticmethod
    def generate_template_id(title: str) -> str:
        """Generate a template ID from title"""
        # Convert to lowercase, replace spaces with underscores
        template_id = re.sub(r'[^a-z0-9]+', '_', title.lower())
        template_id = template_id.strip('_')
        return f"tpl_{template_id}"
