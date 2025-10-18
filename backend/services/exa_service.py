from typing import List, Dict, Any, Optional
from exa_py import Exa
import time
import logging
from config import settings

# Set up logging
logger = logging.getLogger(__name__)

class ExaService:
    """Service for searching and retrieving documents from the web using exa.ai"""
    
    def __init__(self):
        if not settings.EXA_API_KEY:
            raise ValueError("EXA_API_KEY not configured")
        
        self.client = Exa(api_key=settings.EXA_API_KEY)
    
    def search_documents(
        self,
        query: str,
        num_results: int = 3,
        include_domains: Optional[List[str]] = None,
        max_retries: int = 3
    ) -> List[Dict[str, Any]]:
        """Search for legal documents on the web with retry logic
        
        Args:
            query: Search query
            num_results: Number of results to return
            include_domains: Optional list of domains to search within
            max_retries: Maximum number of retry attempts
            
        Returns:
            List of search results with title, url, and snippet
        """
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                # Use Exa-style prompt from documentation
                # "here is a..." format works best for finding actual content
                # Try multiple prompt variations for better results
                prompt_variations = [
                    f"here is a professional {query} template:",
                    f"this is a downloadable {query} form:",
                    f"i need this {query} legal template:",
                    f"here's a sample {query} document:"
                ]
                exa_prompt = prompt_variations[0]  # Use first variation
                
                search_options = {
                    "num_results": num_results,
                    "use_autoprompt": True,
                    "type": "neural",  # Neural search for semantic understanding
                    "text": {
                        "max_characters": 1000  # Get preview text
                    }
                }
                
                if include_domains:
                    search_options["include_domains"] = include_domains
                
                results = self.client.search_and_contents(
                    exa_prompt,
                    **search_options
                )
                
                # Format results
                formatted_results = []
                for result in results.results:
                    # Use text for snippet (more reliable than highlights for search results)
                    text = getattr(result, 'text', '')
                    snippet = text[:200] + "..." if text else "No preview available"
                    
                    formatted_results.append({
                        "id": result.id,
                        "title": result.title,
                        "url": result.url,
                        "snippet": snippet,
                        "highlights": [],
                        "published_date": getattr(result, 'published_date', None)
                    })
                
                return formatted_results
                
            except Exception as e:
                error_msg = str(e).lower()
                if any(keyword in error_msg for keyword in ['quota', 'rate limit', 'too many requests', 'timeout']):
                    wait_time = (2 ** attempt) + 1  # Exponential backoff
                    logger.warning(f"Exa API rate limit/quota error, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    last_exception = e
                    continue
                else:
                    last_exception = ValueError(f"Exa search failed: {str(e)}")
                    
        # If we get here, all retries failed
        raise last_exception
    
    def clean_web_content(self, text: str) -> str:
        """Clean web content to extract only the legal document
        
        Removes:
        - Cookie banners
        - Navigation elements
        - Footers/headers
        - UI elements
        - Marketing/AI content
        - Articles mixed with templates
        
        Preserves:
        - Document structure (multiple sections)
        - Formatting hints (dates, names, addresses)
        - Placeholder patterns ([DATE], {{NAME}}, etc)
        """
        if not text:
            return ""
        
        import re
        
        # Common phrases to filter out (case-insensitive)
        junk_phrases = [
            "we use cookies",
            "click here to",
            "read more",
            "read less",
            "by clicking",
            "cookie policy",
            "privacy policy",
            "terms of service",
            "subscribe",
            "newsletter",
            "sign up",
            "log in",
            "create account",
            "view this form",
            "buy now",
            "download now",
            "instant download",
            "form preview",
            "related forms",
            "faq",
            "more info",
            "category:",
            "control #:",
            "format:",
            "state:",
            "us legal forms",
            "form popularity",
            # NEW: Filter AI/marketing articles
            "is not a futuristic concept",
            "already a part of many",
            "workplace and will continue",
            "employers and employees can",
            "here's how",
            "expert said",
            "learn how",
            "proliferation of artificial",
            "ensuing expected increase",
            "could help usher in",
            "boosts staff well-being",
            "improving productivity"
        ]
        
        # Lines that START legal sections (preserve these)
        section_starters = [
            "date:",
            "to:",
            "from:",
            "re:",
            "subject:",
            "dear",
            "sincerely",
            "regards",
            "signature",
            "notice of",
            "letter of",
            "agreement",
            "hereby"
        ]
        
        lines = text.split('\n')
        cleaned_lines = []
        skip_until_legal = False
        in_legal_section = False
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines (but keep some for structure)
            if not line:
                if cleaned_lines and cleaned_lines[-1] != "":  # Don't add multiple blanks
                    cleaned_lines.append("")
                continue
            
            line_lower = line.lower()
            
            # Check if this line STARTS a legal section
            if any(starter in line_lower for starter in section_starters):
                in_legal_section = True
                skip_until_legal = False
                cleaned_lines.append(line)
                continue
            
            # Check if this line starts a non-legal section
            if any(junk in line_lower for junk in junk_phrases):
                skip_until_legal = True
                in_legal_section = False
                continue
            
            # If we're in a non-legal section, look for signs of returning to legal content
            if skip_until_legal and not in_legal_section:
                # Legal documents have specific keywords
                legal_keywords = ['date', 'hereby', 'employee', 'employer', 'termination', 
                                'notice', 'agreement', 'party', 'witness', 'signature',
                                'severance', 'cobra', 'insurance', 'benefits', 'pay', 'release']
                
                if any(keyword in line_lower for keyword in legal_keywords):
                    skip_until_legal = False
                    in_legal_section = True
                else:
                    continue
            
            # Skip very short lines (likely navigation/UI)
            if len(line) < 15 and not any(c.isalnum() for c in line):
                continue
            
            # Skip lines that are just URLs or links (but keep [DATE] placeholders)
            if line.startswith("http"):
                continue
            
            if "[" in line and "](" in line and "http" in line:  # Markdown links with URLs
                continue
            
            # Skip lines that look like article titles/headlines (ALL CAPS, short)
            if len(line) < 80 and line.isupper() and line.count(' ') < 3:
                continue
            
            # Skip lines with too many symbols (likely metadata)
            symbol_count = sum(1 for c in line if c in '#@$%^&*~|')
            if symbol_count > 5:
                continue
            
            # KEEP: Lines with placeholders like [DATE], {{NAME}}, etc
            if "[" in line and "]" in line:  # Likely placeholder
                cleaned_lines.append(line)
                continue
            
            # KEEP: Lines that look like legal document content
            if in_legal_section or any(keyword in line_lower for keyword in 
                                       ['employee', 'employer', 'date', 'signature', 'hereby', 'notice']):
                cleaned_lines.append(line)
                continue
            
            # For other lines, accept if reasonably long and contain legal words
            if len(line) > 40:
                cleaned_lines.append(line)
        
        # Join with paragraph breaks
        cleaned_text = '\n'.join(cleaned_lines)
        
        # Clean up excessive whitespace (but preserve paragraph structure)
        cleaned_text = re.sub(r'\n{4,}', '\n\n\n', cleaned_text)  # Max 3 blank lines
        
        # Remove escape sequences
        cleaned_text = cleaned_text.replace('\\[', '[').replace('\\]', ']')
        
        # Remove random unicode characters
        cleaned_text = ''.join(c for c in cleaned_text if ord(c) < 128 or c in '\n')
        
        return cleaned_text.strip()
    
    def extract_template_from_highlights(self, highlights: list, full_text: str) -> str:
        """Extract template content from highlights, filtering out FAQ/metadata
        
        Args:
            highlights: List of highlight strings from Exa
            full_text: Full page text as fallback
            
        Returns:
            Clean template content
        """
        if not highlights:
            return full_text
        
        # Filter highlights - keep only those that look like template content
        template_highlights = []
        
        for highlight in highlights:
            lower = highlight.lower()
            
            # SKIP: FAQ sections
            if any(faq in lower for faq in ['who can write', 'how do i get', 'how to write', 
                                            'what documents are required', 'should i get',
                                            'how do i fill out', 'what is required']):
                continue
            
            # SKIP: Metadata/SEO
            if any(meta in lower for meta in ['related searches', 'more info', 'trusted and secure',
                                              'free preview', 'download our', 'page1/1']):
                continue
            
            # SKIP: Descriptions/articles
            if 'in the context of' in lower or 'there are at least' in lower:
                continue
            
            # KEEP: Lines that look like template structure
            if any(marker in lower for marker in ['dear', 'date:', 'to:', 'subject:', 'employee name',
                                                   'company name', 'termination date', 'signature',
                                                   'effective date', 'last day of work']):
                template_highlights.append(highlight)
                continue
            
            # KEEP: Lines with reasonable length (50-500 chars) that aren't questions
            if 50 < len(highlight) < 500 and '?' not in highlight:
                template_highlights.append(highlight)
        
        # If we filtered out everything, fall back to full text
        if not template_highlights:
            return full_text
        
        return "\n\n".join(template_highlights)
    
    def get_document_content(self, document_id: str, max_characters: int = 10000) -> str:
        """Fetch full content of a document by ID
        
        Args:
            document_id: Exa document ID
            max_characters: Maximum characters to fetch (default 10000)
            
        Returns:
            Clean template content (focused on actual document, not FAQ/metadata)
        """
        try:
            # Request BOTH text AND highlights (per Exa docs best practice)
            result = self.client.get_contents(
                [document_id],
                text={
                    "max_characters": max_characters,
                    "include_html_tags": False
                },
                highlights={
                    "num_sentences": 50,  # Get many highlights
                    "highlights_per_url": 15,
                    "query": "employment termination letter template with employee name and termination date"  # Guide highlights
                }
            )
            
            if not result.results:
                raise ValueError("Document not found")
            
            content = result.results[0]
            
            # Get highlights and full text
            highlights = getattr(content, 'highlights', [])
            full_text = getattr(content, 'text', '')
            
            if not highlights and not full_text:
                raise ValueError("No content retrieved from document")
            
            # Extract template from highlights (filtering FAQ/metadata)
            if highlights:
                text = self.extract_template_from_highlights(highlights, full_text)
            else:
                text = full_text
            
            if not text or len(text.strip()) < 200:
                raise ValueError("Document content is too short after extraction")
            
            # Apply additional cleaning
            cleaned_text = self.clean_web_content(text)
            
            # Final validation
            if len(cleaned_text.strip()) < 200:
                raise ValueError("Content too short after cleaning - may be mostly FAQ/navigation")
            
            return cleaned_text
            
        except Exception as e:
            raise ValueError(f"Failed to fetch document content: {str(e)}")

# Singleton instance (only if API key is configured)
exa_service = None
if settings.EXA_API_KEY:
    try:
        exa_service = ExaService()
    except ValueError:
        exa_service = None
