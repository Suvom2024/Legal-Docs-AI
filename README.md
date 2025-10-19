# Legal Document Templating System

An AI-powered legal document templating system that converts legal documents into reusable templates and generates new drafts through intelligent Q&A.

**Built with:** Python FastAPI + Next.js + Gemini AI + SQLite + Exa.ai (Bonus)

---

## 🎯 What This Does

1. **Upload & Templatize** - Drag a legal DOCX/PDF → AI extracts reusable variables → saves as Markdown template
2. **Draft via Chat** - Type a request → finds best template → asks questions → generates final document
3. **Web Bootstrap (Bonus)** - No local template? Search web → auto-create template → continue drafting

---

## 📐 Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTIONS                         │
├─────────────────┬──────────────────────┬────────────────────┤
│   Upload Page   │    Chat/Draft Page   │  Templates Page    │
│  (Ingest Flow)  │ (Drafting Flow)      │  (Manage Flows)    │
└────────┬────────┴──────────┬───────────┴────────────┬───────┘
         │                   │                        │
    ┌────▼────┐         ┌────▼────┐          ┌───────▼──────┐
    │ UPLOAD  │         │ TEMPLATE │          │ USE TEMPLATE │
    │ Extract │         │ MATCHING │          │ or SEARCH    │
    │ Variables│        │ (Vector  │          │              │
    │         │        │ + LLM)   │          └──────┬───────┘
    └────┬────┘        └────┬─────┘                 │
         │                  │◄────────────────────────┘
         │                  │
    ┌────▼──────────────────▼──────────────────┐
    │         GEMINI AI (Multi-Purpose)        │
    ├──────────────────────────────────────────┤
    │ • Extract Variables from Documents       │
    │ • Classify Best Template Match           │
    │ • Generate Human-Friendly Questions      │
    │ • Pre-fill Variables from User Query     │
    │ • Extract Templates from Web Content     │
    └────┬──────────────────┬─────────────────┘
         │                  │
    ┌────▼────┐        ┌────▼────────────────┐
    │DATABASE  │        │ VECTOR EMBEDDINGS   │
    │(SQLite)  │        │(Cosine Similarity)  │
    │          │        │                     │
    │Templates │        │Find Similar Docs    │
    │Variables │        │for Retrieval        │
    │Documents │        │                     │
    │Instances │        │                     │
    └──────────┘        └─────────────────────┘
         ▲
         │
    ┌────┴─────────────────────────────────────┐
    │  Optional: WEB BOOTSTRAP (Bonus)         │
    │  ┌──────────────────────────────────┐    │
    │  │ Exa.ai Search                    │    │
    │  │ (When no local template found)   │    │
    │  │                                  │    │
    │  │ Search → Fetch → Clean → Extract │    │
    │  │ Variables → Create Template      │    │
    │  └──────────────────────────────────┘    │
    └─────────────────────────────────────────┘
```

### Three Core Flows

**FLOW 1: INGEST & TEMPLATIZE**
```
User uploads DOCX/PDF
        ↓
Extract clean text (parser)
        ↓
Gemini: Identify reusable variables
        ↓
Return JSON: {key, label, description, example, required, dtype, regex, enum}
        ↓
Build Markdown with {{variable}} placeholders
        ↓
Store: templates + template_variables tables
        ↓
Generate embedding for retrieval
```

**FLOW 2: TEMPLATE MATCHING & DRAFTING**
```
User: "Draft a notice to insurer for motor accident in India"
        ↓
Generate embedding of user query
        ↓
Vector search: Find top 3 candidate templates (cosine similarity)
        ↓
Gemini classifier: "Which is best match? Return confidence + justification"
        ↓
If confidence < 0.6 → trigger Web Bootstrap (bonus)
        ↓
Show Template Match Card: best + alternatives
        ↓
For missing variables: Generate human-friendly questions
        ↓
User answers questions
        ↓
Variable substitution: {{variable}} → actual value
        ↓
Render final Markdown draft
        ↓
User: Copy / Download .md / Download .docx / Edit & Regenerate
```

**FLOW 3: WEB BOOTSTRAP (BONUS)**
```
No local template match found
        ↓
Exa.ai search: "sample [doc_type] [jurisdiction] [example query]"
        ↓
Fetch top results (title, URL, text content, highlights)
        ↓
Gemini: Extract actual template from web content (remove FAQ/SEO)
        ↓
Run same templatization as FLOW 1
        ↓
Store new template in DB
        ↓
Continue with FLOW 2 (drafting)
```

---

## 🔌 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui | Modern UI, responsive design |
| **Backend** | FastAPI + Python 3.10+ | High-performance async API |
| **LLM** | Gemini (google-genai SDK) | Variable extraction, classification, question generation |
| **Database** | SQLite | Store templates, variables, documents, instances |
| **Vector Search** | Python embeddings + cosine similarity | Find similar templates |
| **Web Retrieval** | Exa.ai SDK | Bootstrap templates from web (bonus) |
| **Document Parsing** | python-docx + pdfplumber | Extract text from DOCX/PDF |
| **Export** | python-docx | Generate downloadable DOCX files |

---

## 🚀 Setup Instructions

### Backend Setup

1. **Install Python 3.10+**
   ```bash
   python --version
   ```

2. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file (backend/.env):**
   ```bash
   # REQUIRED - Get from https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=AIzaSy...YOUR_KEY_HERE...
   
   # OPTIONAL - Get from https://dashboard.exa.ai (for Web Bootstrap bonus)
   EXA_API_KEY=your_exa_key_here
   
   # Configuration
   DATABASE_URL=sqlite:///./legal_templates.db
   MAX_FILE_SIZE_MB=10
   CONFIDENCE_THRESHOLD=0.6
   
   # Model settings
   GEMINI_MODEL=gemini-2.0-flash-exp
   GEMINI_EMBEDDING_MODEL=text-embedding-004
   ```

5. **Database auto-creates on first run:**
   ```bash
   python main.py
   ```
   This starts the FastAPI server and creates tables automatically.
   
   API: http://localhost:8000
   Swagger UI: http://localhost:8000/docs

### Frontend Setup

1. **Install Node.js 18+**
   ```bash
   node --version
   ```

2. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Create `.env.local` file (frontend/.env.local):**
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```
   App: http://localhost:3000

---

## 🧠 Smart Prompting Examples

### 1. Variable Extraction (Gemini)

**System Prompt:**
```
You are a legal document templating assistant. Your task is to identify reusable fields 
(variables) in legal documents that can be replaced when generating new drafts.

Rules:
1. Return ONLY valid JSON, no markdown or explanations
2. Deduplicate logically identical fields 
   (e.g., "claimant name" and "claimant_full_name" are the same → use one key)
3. Use snake_case for keys (e.g., claimant_full_name, not ClaimantFullName)
4. Favor domain-generic names over specific ones
   Good: "party_name" (works for lessor, lessee, buyer, seller)
   Bad:  "plaintiff_name_in_civil_suit" (too specific)
5. For each variable provide: key, label, description, example, required, dtype, regex, enum_values
6. Extract similarity_tags (jurisdiction, doc_type, domain keywords)
7. Do NOT variable-ize statutory text or mandatory legal references
   • Keep: "...pursuant to Section 498A of IPC, as amended..."
   • Variable-ize: "The accused is {{accused_name}}"
8. Focus on party-specific facts: names, dates, amounts, policy numbers, addresses, FIR numbers, etc.
9. Guardrails:
   • ISO dates: "2025-07-10" format
   • Currency: INR, USD (with precision)
   • IDs: minimal regex for patterns (e.g., policy: ^[A-Z0-9]{8,}$)
```

**User Prompt (Example):**
```
Document text:
[Insurance Notice to Insurer for Motor Accident]

Dear Sir/Madam,
I, Rajesh Sahu, the policy holder of motor insurance policy No. 46545464, 
hereby give you notice of an accident involving my vehicle on 10-July-2025...
The accident occurred at approximately 04:50 PM when a third party vehicle...
The estimated repair cost is approximately INR 100,000...

Return JSON in this exact format:
{
  "variables": [
    {
      "key": "policyholder_name",
      "label": "Policyholder's Full Name",
      "description": "Full name of the person who holds the insurance policy",
      "example": "Rajesh Sahu",
      "required": true,
      "dtype": "string",
      "regex": null,
      "enum_values": null
    },
    {
      "key": "accident_date",
      "label": "Date of Accident",
      "description": "Date when the accident occurred (ISO 8601 format)",
      "example": "2025-07-10",
      "required": true,
      "dtype": "date",
      "regex": "^\\d{4}-\\d{2}-\\d{2}$",
      "enum_values": null
    }
  ],
  "similarity_tags": ["insurance", "notice", "india", "motor", "accident", "claim"],
  "doc_type": "Notice to Insurer",
  "jurisdiction": "India"
}
```

**Key Points:**
- ✅ Deduplication prevents "claimant_name" and "claimant_full_name" both being extracted
- ✅ Domain-generic names ensure template reuse across similar document types
- ✅ Statutory text is NOT variable-ized (legal references stay fixed)
- ✅ Format guardrails: ISO dates, currency format, ID regex patterns

---

### 2. Template Matching & Classification (Gemini)

**System Prompt:**
```
You are a legal template classifier. Given a user's request and candidate templates, 
identify the best match using semantic understanding.

Rules:
1. Return ONLY valid JSON
2. Consider: doc_type, jurisdiction, similarity_tags, and title match
3. Calculate confidence score (0.0 = no match, 1.0 = perfect match)
4. If confidence < 0.6, return "none" as best_match_id (triggers Web Bootstrap)
5. Provide brief justification (1 sentence)
6. List alternative template IDs in order of relevance
7. Rationale:
   - Title match: +0.2
   - Tags match: +0.15 per tag
   - Jurisdiction match: +0.15
   - Similarity score from embeddings: use directly
```

**User Prompt (Example):**
```
User request: "Draft a notice to insurer for motor accident in India"

Candidate templates:
[
  {
    "template_id": "tpl_motor_accident_v1",
    "title": "Notice to Insurer - Motor Accident",
    "doc_type": "Notice to Insurer",
    "jurisdiction": "India",
    "similarity_tags": ["insurance", "notice", "india", "motor", "accident"],
    "similarity_score": 0.89
  },
  {
    "template_id": "tpl_notice_general",
    "title": "General Notice Template",
    "doc_type": "Notice",
    "jurisdiction": "India",
    "similarity_tags": ["notice", "india"],
    "similarity_score": 0.62
  }
]

Return JSON:
{
  "best_match_id": "tpl_motor_accident_v1",
  "confidence": 0.92,
  "justification": "Perfect match: motor accident notice for India with high semantic similarity",
  "alternatives": ["tpl_notice_general"]
}
```

**Key Points:**
- ✅ Confidence threshold (0.6) prevents poor matches
- ✅ Alternatives provided for user choice
- ✅ Semantic understanding (not just keyword matching)

---

### 3. Question Generation (Gemini)

**System Prompt:**
```
You are a conversational assistant that generates human-friendly questions for 
missing legal document variables.

Rules:
1. NO raw variable names in questions
   Bad:  "policy_number?"
   Bad:  "What is claimant_full_name?"
2. Use clear, polite, unambiguous language
3. Include format hints where applicable (dates, currency, IDs)
4. One question per variable
5. Return JSON array of questions
6. Examples:
   Bad:  "policy_number?"
   Good: "What is the insurance policy number exactly as it appears on the policy schedule?"
   
   Bad:  "accident_date?"
   Good: "On what date did the accident occur? (YYYY-MM-DD format)"
   
   Bad:  "demand_amount_inr?"
   Good: "What is the total claim amount in Indian Rupees?"
```

**User Prompt (Example):**
```
Missing variables:
[
  {
    "key": "policyholder_name",
    "label": "Policyholder's Full Name",
    "description": "Full name of the person who holds the insurance policy",
    "example": "Rajesh Sahu",
    "required": true,
    "dtype": "string"
  },
  {
    "key": "accident_date",
    "label": "Date of Accident",
    "description": "Date when the accident occurred (ISO 8601 format)",
    "example": "2025-07-10",
    "required": true,
    "dtype": "date"
  },
  {
    "key": "estimated_damage_amount",
    "label": "Estimated Damage Amount (INR)",
    "description": "Total estimated repair cost in Indian Rupees",
    "example": "100000",
    "required": false,
    "dtype": "integer"
  }
]

Generate friendly questions. Return JSON:
{
  "questions": [
    {
      "variable_key": "policyholder_name",
      "question": "What is the policyholder's full name?",
      "format_hint": "Example: Rajesh Sahu"
    },
    {
      "variable_key": "accident_date",
      "question": "On what date did the accident occur?",
      "format_hint": "Format: YYYY-MM-DD (e.g., 2025-07-10)"
    },
    {
      "variable_key": "estimated_damage_amount",
      "question": "What is the estimated total damage amount in Indian Rupees?",
      "format_hint": "Example: 100000"
    }
  ]
}
```

**Key Points:**
- ✅ Conversational tone (not robotic)
- ✅ Format hints guide user input
- ✅ No raw variable names

---

### 4. Pre-fill Value Extraction (Gemini)

**System Prompt:**
```
Extract variable values from the user's query that match template variables.

Rules:
1. Return ONLY valid JSON
2. Extract dates, names, amounts, locations, numbers from natural language
3. If uncertain, return null for that variable
4. Normalize dates to ISO 8601 format (YYYY-MM-DD)
5. Keep original casing for names
6. Preserve currency/units as specified
```

**User Prompt (Example):**
```
User query: "Draft a notice to insurer for Rajesh Sahu's motor accident on July 10, 2025 
            for policy 46545464 with estimated damage of 100000 rupees"

Template variables:
[
  {"key": "policyholder_name", "dtype": "string"},
  {"key": "accident_date", "dtype": "date"},
  {"key": "policy_number", "dtype": "string"},
  {"key": "estimated_damage_amount", "dtype": "integer"}
]

Extract any values present in the query. Return JSON:
{
  "filled_variables": {
    "policyholder_name": "Rajesh Sahu",
    "accident_date": "2025-07-10",
    "policy_number": "46545464",
    "estimated_damage_amount": "100000"
  }
}
```

**Key Points:**
- ✅ Pre-fills variables from natural language
- ✅ Handles date format conversion
- ✅ Graceful null handling

---

## 📊 Database Schema

```sql
-- Templates (reusable legal documents)
CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    template_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    file_description TEXT,
    doc_type TEXT,
    jurisdiction TEXT,
    similarity_tags JSON,           -- ["insurance", "notice", "india"]
    body_md TEXT NOT NULL,          -- Markdown with {{variables}}
    embedding JSON,                 -- Vector for retrieval
    tracking_code TEXT,             -- UOIONHHC
    created_at DATETIME,
    updated_at DATETIME
);

-- Template Variables (field definitions)
CREATE TABLE template_variables (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    key TEXT NOT NULL,              -- "policyholder_name"
    label TEXT NOT NULL,            -- "Policyholder's Full Name"
    description TEXT,
    example TEXT,
    required BOOLEAN DEFAULT FALSE,
    dtype TEXT,                     -- "string", "date", "integer", "currency"
    regex TEXT,                     -- "^[A-Z0-9]{8,}$"
    enum_values JSON,               -- ["Option A", "Option B"]
    created_at DATETIME
);

-- Uploaded Documents (for future reference)
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    filename TEXT,
    mime_type TEXT,                 -- "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    raw_text TEXT,
    embedding JSON,
    tracking_code TEXT,
    created_at DATETIME
);

-- Draft Instances (user interactions)
CREATE TABLE instances (
    id TEXT PRIMARY KEY,
    template_id TEXT,
    user_query TEXT,                -- "Draft a notice to insurer..."
    answers_json JSON,              -- {"policyholder_name": "Rajesh", "accident_date": "2025-07-10"}
    draft_md TEXT,                  -- Final rendered Markdown
    draft_number INTEGER,
    tracking_code TEXT,
    created_at DATETIME
);
```

---

## 📖 Usage Guide

### 1. Upload & Create Template

1. Navigate to **Upload** page (http://localhost:3000/upload)
2. Drag-drop a legal DOCX/PDF document
3. Click **"Extract Variables"** → Gemini identifies fields
4. Review extracted variables (edit if needed)
5. Enter template title and save
6. Template stored with ID, tags, and metadata

**Example:** Upload an insurance notice → system extracts policyholder_name, policy_number, accident_date, damage_amount

---

### 2. Draft via Chat

1. Navigate to **Chat** page (http://localhost:3000/chat)
2. Type or paste a request:
   ```
   "Draft a notice to insurer for a motor accident in India"
   ```
3. System finds best matching template (with confidence score)
4. Shows alternatives if available
5. Click **"Use This Template"**
6. Answer questions for any missing variables
7. Click **"Generate Draft"**
8. Options:
   - View Markdown
   - Download .docx
   - Edit variables & regenerate
   - Try alternative templates

---

### 3. Special Commands

In chat, type:
- `/vars` → See current filled/missing variables
- `/draft [request]` → Explicitly trigger draft generation

---

### 4. Web Bootstrap (Bonus)

If no local template matches (confidence < 0.6):
1. System auto-triggers Exa.ai web search
2. Shows found documents
3. Click a result to bootstrap it
4. System creates template from web content
5. Proceeds with normal drafting flow

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | Upload DOCX/PDF document |
| `/api/extract` | POST | Extract variables from uploaded file |
| `/api/templates` | GET | List all templates |
| `/api/templates/{template_id}` | GET | Get template with variables |
| `/api/templates` | POST | Save template to database |
| `/api/draft` | POST | Match template + generate questions |
| `/api/draft/finalize` | POST | Generate final draft with answers |
| `/api/draft/{id}/regenerate` | POST | Regenerate draft with new answers |
| `/api/draft/{id}/edit` | POST | Edit variables and regenerate |
| `/api/draft/{id}/download/docx` | GET | Download draft as DOCX |
| `/api/web/search` | POST | Search web for templates (Bonus) |
| `/api/web/bootstrap` | POST | Create template from web content (Bonus) |

---

## 🎯 Key Features

✅ **Core Features**
- Document upload (DOCX/PDF) with text extraction
- AI variable extraction with automatic deduplication
- Template creation with Markdown + YAML front-matter
- Smart template matching using embeddings + LLM classification
- Human-friendly question generation
- Draft generation with full variable substitution
- DOCX and Markdown export
- Edit variables and regenerate

✅ **Bonus Features**
- Web Bootstrap: Search web for templates when no local match
- Alternative template suggestions for user selection
- Automatic template creation from web content
- Robust, steerable, safe prompts throughout

✅ **Tracking**
- UOIONHHC code embedded in templates and documents

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| "GEMINI_API_KEY not configured" | Add key to backend/.env from aistudio.google.com |
| "Failed to parse DOCX/PDF" | Ensure file is not corrupted or password-protected |
| "Failed to connect to API" | Check backend running on `http://localhost:8000` |
| "No templates loading" | Upload a document first via Upload page |
| "Web Bootstrap not working" | Add EXA_API_KEY to backend/.env from dashboard.exa.ai |
| "Templates not matching" | Increase CONFIDENCE_THRESHOLD in .env or upload more examples |

---

## 📋 Sample Outputs

See **`sample_outputs/`** folder for real examples generated by this system:

### What's Included:
- ✅ **Motor_Insurance_MD.md** - Generated draft for motor accident insurance notice (Markdown)
- ✅ **Motor_Insurance_DOCX.docx** - Same draft formatted as DOCX (ready to use)
- ✅ **Web_BootStrap_Docx.docx** - Draft generated from web-bootstrapped template (termination letter)
- ✅ **README.md** - Detailed explanation of sample output formats

### How These Were Generated:
1. Uploaded a sample insurance notice document
2. Extracted variables using Gemini AI
3. Saved as template
4. Created drafts via chat interface
5. Answered all variable questions
6. Downloaded as Markdown and DOCX

### Generate More Examples:
```bash
cd backend
python export_sample_outputs.py
```

This exports templates with YAML front-matter, variables as JSON/CSV, and generates drafts.

---

## 🚀 Quick Start (5 minutes)

1. **Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate
   pip install -r requirements.txt
   # Create .env with GEMINI_API_KEY
   python main.py
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   # Create .env.local with NEXT_PUBLIC_API_URL
   npm run dev
   ```

3. **Use:**
   - Go to http://localhost:3000
   - Upload a sample document from `backend/sample_documents/`
   - Create a template
   - Go to Chat and draft from the template

---

## 📹 Demo Video

**🎥 Watch the full demo here:** [Loom Video (4:39)](https://www.loom.com/share/bbe2d2a5093d4cf492eba3b61327bdae?t=284&sid=b0f86d64-9edc-4738-b5c8-420804da696c)

**What's demonstrated:**
- ✅ **Upload & Templatize** - Upload insurance document → extract variables → save template
- ✅ **Chat & Draft** - Natural language request → template matched (85% confidence) → Q&A answered → draft generated (Markdown + DOCX)
- ✅ **Web Bootstrap** - Request for missing template → Exa.ai search → create template from web → continue drafting
- ✅ **Variable Editing** - Edit values → regenerate draft
- ✅ **Export Options** - Download as DOCX (formatted) and Markdown

---

**Built for Full-Stack Engineers | UOIONHHC Tracking Code**
