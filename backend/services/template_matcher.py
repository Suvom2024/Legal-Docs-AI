from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from database import Template, TemplateVariable
from services.embedding_service import embedding_service
from services.gemini_service import gemini_service
from config import settings
import json

class TemplateMatcher:
    """Match user queries to templates using embeddings and AI classification"""
    
    @staticmethod
    def find_candidate_templates(
        query: str,
        db: Session,
        top_k: int = 3
    ) -> List[Tuple[Template, float]]:
        """Find top K candidate templates using embedding similarity"""
        
        # Generate query embedding
        query_embedding = embedding_service.generate_query_embedding(query)
        
        # Get all templates with embeddings
        templates = db.query(Template).all()
        
        if not templates:
            return []
        
        # Calculate similarities
        candidate_embeddings = [
            (template, template.embedding) 
            for template in templates 
            if template.embedding
        ]
        
        if not candidate_embeddings:
            return []
        
        # Find most similar
        similarities = []
        for template, embedding in candidate_embeddings:
            similarity = embedding_service.cosine_similarity(query_embedding, embedding)
            similarities.append((template, similarity))
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]
    
    @staticmethod
    def classify_best_match(
        query: str,
        candidates: List[Tuple[Template, float]]
    ) -> Dict[str, Any]:
        """Use Gemini to classify the best matching template"""
        
        if not candidates:
            return {
                "best_match_id": None,
                "confidence": 0.0,
                "justification": "No templates available",
                "alternatives": []
            }
        
        # Prepare candidate data for Gemini
        candidate_data = []
        for template, similarity in candidates:
            candidate_data.append({
                "template_id": template.template_id,
                "title": template.title,
                "doc_type": template.doc_type,
                "jurisdiction": template.jurisdiction,
                "similarity_tags": template.similarity_tags,
                "similarity_score": round(similarity, 3)
            })
        
        system_prompt = """You are a legal template classifier. Given a user's request and candidate templates, identify the best match.

Rules:
1. Return ONLY valid JSON
2. Consider: doc_type, jurisdiction, similarity_tags, and title
3. Return confidence score (0.0-1.0)
4. If confidence < 0.6, return "none" as best_match_id
5. Provide brief justification (1 sentence)
6. List alternative template IDs in order of relevance"""

        user_prompt = f"""User request: "{query}"

Candidate templates:
{json.dumps(candidate_data, indent=2)}

Return JSON:
{{
  "best_match_id": "tpl_incident_notice_v1",
  "confidence": 0.85,
  "justification": "This template matches the user's request for an insurance notice in India",
  "alternatives": ["tpl_id_2", "tpl_id_3"]
}}"""

        try:
            result = gemini_service.classify_template(system_prompt, user_prompt)
            return result
        except Exception as e:
            # Fallback to highest similarity
            best_template = candidates[0][0]
            return {
                "best_match_id": best_template.template_id,
                "confidence": candidates[0][1],
                "justification": f"Selected based on highest similarity score",
                "alternatives": [t.template_id for t, _ in candidates[1:]]
            }
    
    @staticmethod
    def match_template(query: str, db: Session) -> Optional[Dict[str, Any]]:
        """Complete template matching pipeline"""
        
        # Find candidates
        candidates = TemplateMatcher.find_candidate_templates(query, db, top_k=3)
        
        if not candidates:
            return None
        
        # Classify best match
        classification = TemplateMatcher.classify_best_match(query, candidates)
        
        # Check confidence threshold
        if classification["confidence"] < settings.CONFIDENCE_THRESHOLD:
            return None
        
        # Get the best matching template
        best_template_id = classification["best_match_id"]
        if not best_template_id or best_template_id == "none":
            return None
        
        best_template = db.query(Template).filter(
            Template.template_id == best_template_id
        ).first()
        
        if not best_template:
            return None
        
        # Get alternatives
        alternatives = []
        for alt_id in classification.get("alternatives", [])[:2]:
            alt_template = db.query(Template).filter(
                Template.template_id == alt_id
            ).first()
            if alt_template:
                alternatives.append({
                    "template_id": alt_template.template_id,
                    "title": alt_template.title,
                    "doc_type": alt_template.doc_type
                })
        
        return {
            "template": best_template,
            "confidence": classification["confidence"],
            "justification": classification["justification"],
            "alternatives": alternatives
        }

template_matcher = TemplateMatcher()
