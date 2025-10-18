import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./legal_templates.db")
    
    # API Keys
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    EXA_API_KEY = os.getenv("EXA_API_KEY", "")
    
    # Application Settings
    MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.6"))
    
    # CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # gemini-2.0-flash-exp is the latest stable model (retires Feb 2026)
     # Note: gemini-2.5-pro doesn't exist, using gemini-2.0-flash-exp instead
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
    # Text embedding model for semantic search
    GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")
    
    # Tracking - UOIONHHC
    TRACKING_CODE = "UOIONHHC"

settings = Settings()
