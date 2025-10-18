# Legal Document Templating System - Backend

FastAPI backend for AI-powered legal document templating.

## Setup

1. Install Python 3.10+
2. Create virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

3. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

4. Configure environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env and add your API keys
   \`\`\`

5. Run the server:
   \`\`\`bash
   python main.py
   \`\`\`

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database

SQLite database will be created automatically at `./legal_templates.db`

## API Keys Required

- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Exa API Key** (optional): Get from [exa.ai](https://exa.ai) for web bootstrap feature
