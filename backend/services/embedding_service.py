from typing import List, Tuple
import numpy as np
from scipy.spatial.distance import cosine
from services.gemini_service import gemini_service

class EmbeddingService:
    """Service for generating and comparing embeddings"""
    
    @staticmethod
    def generate_document_embedding(text: str) -> List[float]:
        """Generate embedding for a document"""
        return gemini_service.generate_embedding(text)
    
    @staticmethod
    def generate_query_embedding(query: str) -> List[float]:
        """Generate embedding for a search query"""
        return gemini_service.generate_query_embedding(query)
    
    @staticmethod
    def cosine_similarity(embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        return 1 - cosine(embedding1, embedding2)
    
    @staticmethod
    def find_most_similar(
        query_embedding: List[float],
        candidate_embeddings: List[Tuple[str, List[float]]],
        top_k: int = 3
    ) -> List[Tuple[str, float]]:
        """Find most similar embeddings to query
        
        Args:
            query_embedding: Query embedding vector
            candidate_embeddings: List of (id, embedding) tuples
            top_k: Number of top results to return
            
        Returns:
            List of (id, similarity_score) tuples, sorted by similarity
        """
        similarities = []
        
        for candidate_id, candidate_embedding in candidate_embeddings:
            similarity = EmbeddingService.cosine_similarity(query_embedding, candidate_embedding)
            similarities.append((candidate_id, similarity))
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]

embedding_service = EmbeddingService()
