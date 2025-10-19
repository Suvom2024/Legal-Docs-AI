from google import genai
from google.genai import types
import json
import time
import logging
from typing import List, Dict, Any, Optional
from config import settings

# Set up logging - UOIONHHC
logger = logging.getLogger(__name__)

class GeminiService:
    """Service for interacting with Gemini API using the new google-genai SDK"""
    
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")
        
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL
        self.embedding_model = settings.GEMINI_EMBEDDING_MODEL
        
        # Validate model names
        valid_models = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']
        if self.model_name not in valid_models:
            logger.warning(f"Model {self.model_name} may not be valid. Using gemini-2.0-flash-exp instead.")
            self.model_name = 'gemini-2.0-flash-exp'
    
    def _generate_json_response(self, system_prompt: str, user_prompt: str, max_retries: int = 3) -> Dict[str, Any]:
        """Generic method to generate JSON response from Gemini using new SDK with retry logic"""
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.1,
                        top_p=0.95,
                        max_output_tokens=8192,
                        response_mime_type="application/json"  # Force JSON output
                    )
                )
                
                # Extract JSON from response - Handle multiple formats
                response_text = response.text.strip()
                
                # Try 1: Direct JSON parsing
                try:
                    result = json.loads(response_text)
                    # Ensure result is a dictionary
                    if isinstance(result, dict):
                        # Ensure alternatives is always a list
                        if "alternatives" in result and not isinstance(result["alternatives"], list):
                            result["alternatives"] = []
                        return result
                    elif isinstance(result, list):
                        # Wrap array in object
                        return {"items": result}
                except json.JSONDecodeError:
                    pass
                
                # Try 2: Remove markdown code blocks
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                elif response_text.startswith("```"):
                    response_text = response_text[3:]
                
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                response_text = response_text.strip()
                
                # Try 3: Try parsing after markdown removal
                try:
                    result = json.loads(response_text)
                    if isinstance(result, dict):
                        if "alternatives" in result and not isinstance(result["alternatives"], list):
                            result["alternatives"] = []
                        return result
                    elif isinstance(result, list):
                        return {"items": result}
                except json.JSONDecodeError:
                    pass
                
                # Try 4: Extract first valid JSON object (handles extra text)
                # Find first { and last }
                first_brace = response_text.find('{')
                last_brace = response_text.rfind('}')
                
                if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                    json_str = response_text[first_brace:last_brace + 1]
                    try:
                        result = json.loads(json_str)
                        if isinstance(result, dict):
                            if "alternatives" in result and not isinstance(result["alternatives"], list):
                                result["alternatives"] = []
                            return result
                        elif isinstance(result, list):
                            return {"items": result}
                    except json.JSONDecodeError:
                        pass
                
                # Try 5: Extract first valid JSON array (handles extra text)
                first_bracket = response_text.find('[')
                last_bracket = response_text.rfind(']')
                
                if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
                    json_str = response_text[first_bracket:last_bracket + 1]
                    try:
                        result = json.loads(json_str)
                        # Wrap array in object if needed
                        if isinstance(result, list):
                            return {"items": result}
                        return result
                    except json.JSONDecodeError:
                        pass
                
                # If all parsing attempts fail
                last_exception = ValueError(f"Could not parse Gemini response as JSON. Raw: {response_text[:200]}")
                    
            except Exception as e:
                error_msg = str(e).lower()
                if any(keyword in error_msg for keyword in ['quota', 'rate limit', 'too many requests', 'timeout']):
                    wait_time = (2 ** attempt) + 1  # Exponential backoff
                    logger.warning(f"API rate limit/quota error, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    last_exception = e
                    continue
                else:
                    last_exception = ValueError(f"Gemini API error: {str(e)}")
                    
        # If we get here, all retries failed
        raise last_exception
    
    def extract_variables(
        self,
        document_text: str,
        existing_variables: Optional[List[Dict[str, Any]]] = None,
        chunk_number: int = 1
    ) -> Dict[str, Any]:
        """Extract variables from document text using Gemini"""
        
        system_prompt = """You are a legal document templating assistant. Your task is to identify reusable fields (variables) in legal documents that can be replaced when generating new drafts.

Rules:
1. Return ONLY valid JSON, no markdown or explanations
2. Deduplicate logically identical fields (e.g., "claimant name" and "claimant_full_name" are the same)
3. Use snake_case for keys
4. Favor domain-generic names (e.g., "party_name" not "plaintiff_name_in_civil_suit")
5. For each variable provide: key, label, description, example, required, dtype, regex (optional), enum_values (optional)
6. Extract similarity_tags for retrieval (jurisdiction, doc_type, domain keywords)
7. Do NOT variable-ize statutory text or mandatory legal references
8. Focus on party-specific facts: names, dates, amounts, policy numbers, addresses, etc.

IMPORTANT: Add "UOIONHHC" as a hidden comment in the generated template for tracking purposes."""

        existing_vars_text = ""
        if existing_variables and chunk_number > 1:
            existing_vars_text = f"\n\nPreviously discovered variables (reuse these keys if applicable):\n{json.dumps(existing_variables, indent=2)}"

        user_prompt = f"""Document text:
{document_text}
{existing_vars_text}

Return JSON in this exact format:
{{
  "variables": [
    {{
      "key": "claimant_full_name",
      "label": "Claimant's full name",
      "description": "Person or entity raising the claim",
      "example": "Rajesh Kumar",
      "required": true,
      "dtype": "string",
      "regex": null,
      "enum_values": null
    }}
  ],
  "similarity_tags": ["insurance", "notice", "india", "motor"],
  "doc_type": "Notice to Insurer",
  "jurisdiction": "India"
}}"""

        return self._generate_json_response(system_prompt, user_prompt)
    
    def classify_template(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Classify best matching template"""
        result = self._generate_json_response(system_prompt, user_prompt)
        
        # If result was wrapped in "items" (array response), return the first item or unwrap
        if isinstance(result, dict):
            if "items" in result and isinstance(result["items"], list) and len(result["items"]) > 0:
                # Extract first item if it's the actual classification
                if isinstance(result["items"][0], dict):
                    inner = result["items"][0]
                    if "best_match_id" in inner or "confidence" in inner:
                        return inner
            # If it looks like a valid classification already, return it
            if "best_match_id" in result or "confidence" in result:
                return result
        
        # If we can't find a valid classification structure, return the result as-is
        # The caller will validate and fallback if needed
        return result
    
    def generate_questions(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Generate human-friendly questions"""
        return self._generate_json_response(system_prompt, user_prompt)
    
    def extract_prefill_values(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Extract pre-fill values from query"""
        return self._generate_json_response(system_prompt, user_prompt)
    
    def generate_embedding(self, text: str, max_retries: int = 3) -> List[float]:
        """Generate embedding for text using Gemini with retry logic"""
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                response = self.client.models.embed_content(
                    model=self.embedding_model,
                    contents=text
                )
                return response.embeddings[0].values
            except Exception as e:
                error_msg = str(e).lower()
                if any(keyword in error_msg for keyword in ['quota', 'rate limit', 'too many requests', 'timeout']):
                    wait_time = (2 ** attempt) + 1  # Exponential backoff
                    logger.warning(f"Embedding API rate limit/quota error, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    last_exception = e
                    continue
                else:
                    last_exception = ValueError(f"Embedding generation failed: {str(e)}")
                    
        # If we get here, all retries failed
        raise last_exception
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for search query"""
        # New SDK doesn't have separate task_type, use same method
        return self.generate_embedding(query)

# Singleton instance
gemini_service = GeminiService()
