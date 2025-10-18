# Legal Document Templating System

An AI-powered legal document templating system that converts legal documents into reusable templates and generates new drafts through intelligent Q&A.

**Built with:** Python FastAPI + Next.js + Gemini AI + SQLite

---

## 🎯 Features

- **Document Upload & Parsing**: Upload DOCX/PDF legal documents and extract text automatically
- **AI Variable Extraction**: Use Gemini AI to identify and extract reusable variables from documents
- **Template Generation**: Create Markdown templates with YAML front-matter and variable placeholders
- **Smart Template Matching**: Find the best matching template using embeddings and AI classification
- **Conversational Drafting**: Generate new documents through an intelligent Q&A chat interface
- **Pre-fill Variables**: Automatically extract values from user queries
- **Web Bootstrap (BONUS)**: Search and fetch similar documents from the web using exa.ai when no local template exists
- **Draft Management**: Copy, download (.md and .docx), and manage generated drafts
- **Variable Deduplication**: Intelligent deduplication across document chunks
- **Human-Friendly Questions**: Converts raw variable names to conversational questions

---

## 📐 Architecture

**Simple Flow:**

1. **Upload** → DOCX/PDF → Gemini extracts variables → Template created (Markdown + YAML)
2. **Draft** → User query → Embeddings match template → Questions asked → Draft generated
3. **Web Bootstrap** (Bonus) → No local match → Exa searches web → Create template from web → Draft

**Stack:**
- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: FastAPI + Python
- LLM: Gemini API (google-genai SDK)
- Database: SQLite with templates, variables, documents, instances
- Search (Bonus): exa.ai for web document retrieval

---

## 🚀 Setup Instructions

### Backend Setup

1. **Install Python 3.10+**

2. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment (backend/.env):**
   ```bash
   GEMINI_API_KEY=your_key_from_aistudio.google.com
   EXA_API_KEY=your_key_from_dashboard.exa.ai  # Optional for web bootstrap
   DATABASE_URL=sqlite:///./legal_templates.db
   MAX_FILE_SIZE_MB=10
   CONFIDENCE_THRESHOLD=0.6
   ```

5. **Run server:**
   ```bash
   python main.py
   ```
   API: http://localhost:8000
   Swagger UI: http://localhost:8000/docs

### Frontend Setup

1. **Install Node.js 18+**

2. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure environment (frontend/.env.local):**
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run dev server:**
   ```bash
   npm run dev
   ```
   App: http://localhost:3000

---

## 📖 Usage

### 1. Upload & Create Template
- Go to Upload page
- Drag-drop a DOCX/PDF legal document
- Enter template title
- Click "Extract Variables"
- Review extracted variables
- Click "Save Template"

### 2. Draft via Chat
- Go to Chat/Draft page
- Type: `"Draft a notice to insurer for motor accident in India"`
- System finds best matching template (with alternatives)
- Answer questions for missing variables
- Click "Generate Draft"
- Download as DOCX or Markdown

### 3. Special Commands
- `/vars` - See filled/missing variables
- `/draft [request]` - Explicitly trigger drafting

### 4. Web Bootstrap (Bonus)
- If no local template found, system auto-searches web
- Select a document to bootstrap
- System creates template automatically
- Continue with drafting

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | Upload DOCX/PDF document |
| `/api/extract` | POST | Extract variables from document |
| `/api/templates` | GET | List all templates |
| `/api/templates` | POST | Save template |
| `/api/draft` | POST | Match template + generate questions |
| `/api/draft/finalize` | POST | Generate final draft |
| `/api/draft/{id}/regenerate` | POST | Regenerate draft |
| `/api/draft/{id}/edit` | POST | Edit variables |
| `/api/draft/{id}/download/docx` | GET | Download as DOCX |
| `/api/web/search` | POST | Search web documents (Bonus) |
| `/api/web/bootstrap` | POST | Create template from web (Bonus) |

---

## 🧠 Smart Prompting Examples

### Variable Extraction
```
System: "You are a legal doc templating assistant. Identify reusable fields."
Input: Document text
Output: JSON with variables, tags, metadata
```

### Template Matching  
```
"Given user ask: 'Draft notice to insurer', 
 return best template_id with confidence (0.0-1.0) and justification.
 If confidence < 0.6, return none."
```

### Question Generation
```
Bad:  "policy_number?"
Good: "What is the insurance policy number exactly as it appears on the policy schedule?"
```

### Pre-fill Extraction
```
Input: "Draft for Rajesh Sahu on July 10, 2025"
Output: {policyholder_name: "Rajesh Sahu", accident_date: "2025-07-10"}
```

---

## 🗄️ Database Schema

- **templates**: id, template_id, title, doc_type, jurisdiction, body_md, embedding
- **template_variables**: id, template_id, key, label, description, example, required, dtype, regex
- **documents**: id, filename, raw_text, embedding
- **instances**: id, template_id, user_query, answers_json, draft_md, draft_number

---

## 🎯 Key Features

✅ **Core Features**
- Document upload (DOCX/PDF) with text extraction
- AI variable extraction with deduplication
- Template creation with Markdown + YAML format
- Smart template matching using embeddings + classification
- Human-friendly question generation for missing variables
- Draft generation with variable substitution
- DOCX and Markdown export

✅ **Bonus Features**
- Web Bootstrap: Search web for templates when no local match
- Alternative template suggestions for user selection
- Automatic template creation from web content
- Robust, steerable, safe prompts throughout

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| "GEMINI_API_KEY not configured" | Add key to backend/.env from aistudio.google.com |
| "Failed to parse DOCX/PDF" | Ensure file is not corrupted or password-protected |
| "Failed to connect to API" | Check backend running on port 8000 |
| "No templates loading" | Upload a document first via Upload page |

---

## ⚡ Tech Stack

**Backend:** FastAPI + Python 3.10+ + SQLite + Gemini API (NEW SDK: google-genai)
**Frontend:** Next.js 15 + TypeScript + Tailwind CSS v4 + shadcn/ui
**Bonus:** exa.ai for web search + document retrieval

---

**Ready to use! Create .env files, run backend + frontend, and start drafting!**

**Tracking Code:** UOIONHHC
