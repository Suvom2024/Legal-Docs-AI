from typing import List, Dict, Any
from services.gemini_service import gemini_service
import json

class QuestionGenerator:
    """Generate human-friendly questions for missing variables"""
    
    @staticmethod
    def generate_questions(variables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate friendly questions for variables"""
        
        if not variables:
            return []
        
        system_prompt = """You are a conversational assistant that generates human-friendly questions for missing legal document variables.

Rules:
1. NO raw variable names (e.g., "policy_number?")
2. Use clear, polite, unambiguous language
3. Include format hints where applicable (dates, currency, IDs)
4. One question per variable
5. Return JSON array of questions
6. Make questions conversational and easy to understand"""

        user_prompt = f"""Missing variables:
{json.dumps(variables, indent=2)}

Generate friendly questions. Return JSON:
{{
  "questions": [
    {{
      "variable_key": "policy_number",
      "question": "What is the insurance policy number exactly as it appears on the policy schedule?",
      "format_hint": "Example: 302786965"
    }}
  ]
}}"""

        try:
            result = gemini_service.generate_questions(system_prompt, user_prompt)
            return result.get("questions", [])
        except Exception as e:
            # Fallback to simple questions
            return [
                {
                    "variable_key": var["key"],
                    "question": f"Please provide {var['label'].lower()}",
                    "format_hint": var.get("example", None)
                }
                for var in variables
            ]
    
    @staticmethod
    def extract_values_from_query(
        query: str,
        variables: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Extract variable values from user query"""
        
        if not variables:
            return {}
        
        system_prompt = """Extract values from the user's query that match template variables.

Rules:
1. Return ONLY valid JSON
2. Extract dates, names, amounts, locations, etc.
3. If uncertain, return null for that variable
4. Normalize dates to ISO 8601 format (YYYY-MM-DD)
5. Keep original casing for names"""

        user_prompt = f"""User query: "{query}"

Template variables:
{json.dumps(variables, indent=2)}

Extract any values present in the query. Return JSON:
{{
  "filled_variables": {{
    "incident_date": "2025-07-12",
    "claimant_full_name": "Rajesh Kumar",
    "policy_number": null
  }}
}}"""

        try:
            result = gemini_service.extract_prefill_values(system_prompt, user_prompt)
            return result.get("filled_variables", {})
        except Exception as e:
            return {}

question_generator = QuestionGenerator()
