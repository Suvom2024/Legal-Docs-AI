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

## 🛠️ Tech Stack

### Backend
- **Python 3.10+**
- **FastAPI**: REST API framework
- **SQLite**: Database for templates and drafts
- **Gemini API** (google-genai SDK): AI for variable extraction, classification, and embeddings
- **exa.ai**: Web search and document retrieval (BONUS feature)
- **python-docx & pdfplumber**: Document parsing

### Frontend
- **Next.js 15**: React framework
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Styling
- **shadcn/ui**: UI components
- **react-markdown**: Markdown rendering

---

## 📐 Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Upload UI    │  │ Chat UI      │  │ Templates    │      │
│  │ (Drag/Drop)  │  │ (Q&A Flow)   │  │ (Management) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Python)                  │
│  • Document Parsing (DOCX/PDF → Text)                       │
│  • Variable Extraction (Gemini AI with deduplication)       │
│  • Template Matching (Embeddings + Classification)          │
│  • Question Generation (Human-friendly)                      │
│  • Draft Generation (Variable substitution)                  │
│  • Web Bootstrap (exa.ai - BONUS)                            │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    SQLite Database                           │
│  • templates (with embeddings)                               │
│  • template_variables                                        │
│  • documents (uploaded files)                                │
│  • instances (draft history)                                 │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 🚀 Setup Instructions

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Gemini API Key** (REQUIRED) - Free from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Exa API Key** (OPTIONAL) - Free $10 credit from [exa.ai](https://dashboard.exa.ai/)

### Backend Setup

1. **Navigate to backend directory:**
   \`\`\`bash
   cd backend
   \`\`\`

2. **Create virtual environment:**
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

3. **Install dependencies:**
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

4. **Configure environment variables:**
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   
   **Edit `.env` and add your API keys:**
   \`\`\`env
   # REQUIRED - Get from https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=AIzaSyC...your_key_here
   
   # OPTIONAL - Get from https://dashboard.exa.ai/ (free $10 credit)
   EXA_API_KEY=your_exa_key_here
   
   # Configuration
   MAX_FILE_SIZE_MB=10
   CONFIDENCE_THRESHOLD=0.6
   
   # Model Settings (using new google-genai SDK)
   GEMINI_MODEL=gemini-2.0-flash-exp
   GEMINI_EMBEDDING_MODEL=text-embedding-004
   \`\`\`

5. **Run the backend server:**
   \`\`\`bash
   python main.py
   \`\`\`
   
   The API will be available at `http://localhost:8000`
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure environment variables:**
   \`\`\`bash
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   \`\`\`

3. **Run the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   
   The app will be available at `http://localhost:3000`

---

## 📖 Usage Guide

### 1. Upload a Document

1. Go to **Upload Document** page
2. Drag and drop a DOCX or PDF legal document
3. Enter a title for the template (e.g., "Notice to Insurer - Motor Accident")
4. Optionally add a description
5. Click **Extract Variables**
6. Review the extracted variables and metadata
7. Click **Save Template**

### 2. Draft a Document

1. Go to **Draft Document** (Chat) page
2. Type your request, for example:
   - "Draft a notice to insurer for a motor accident in India"
   - "/draft Create a rental agreement for Mumbai"
3. The system will:
   - Find the best matching template
   - Show you the match with confidence score and justification
   - Pre-fill any variables it can extract from your query
4. Click **Use This Template** (or select from alternatives)
5. Answer the questions for missing variables
6. Toggle **Strict Replace** if needed
7. Click **Generate Draft**
8. Copy, download (.md or .docx), edit variables, or regenerate

### 3. Special Commands

- Type `/vars` in chat to see filled and missing variables
- Type `/draft` before your request to explicitly trigger drafting mode

### 4. Web Bootstrap (BONUS)

If no template is found locally (confidence < 0.6):
1. The system will automatically search the web using exa.ai
2. You'll see a list of similar documents found online
3. Select a document to create a template from
4. The system will fetch, templatize, and save it
5. Continue with the drafting flow

---

## 🔌 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload and parse document |
| `/api/extract` | POST | Extract variables from document |
| `/api/templates` | POST | Save template |
| `/api/templates` | GET | List all templates |
| `/api/templates/{id}` | GET | Get template by ID |
| `/api/draft` | POST | Start drafting (match template + generate questions) |
| `/api/draft/finalize` | POST | Generate final draft with answers |
| `/api/draft/regenerate` | POST | Regenerate draft with same variables |
| `/api/draft/edit` | POST | Edit variables and regenerate |
| `/api/draft/download` | POST | Download draft as DOCX |
| `/api/web/search` | POST | Search web for documents (BONUS) |
| `/api/web/bootstrap` | POST | Create template from web document (BONUS) |

---

## 🗄️ Database Schema

### templates
- `id`: UUID primary key
- `template_id`: Unique template identifier (e.g., "tpl_notice_to_insurer")
- `title`: Template title
- `file_description`: Template description
- `doc_type`: Document type (e.g., "Notice to Insurer")
- `jurisdiction`: Legal jurisdiction (e.g., "India")
- `similarity_tags`: Array of tags for retrieval
- `body_md`: Markdown template with `{{variables}}`
- `embedding`: Vector embedding for semantic search
- `tracking_code`: UOIONHHC tracking identifier
- `created_at`, `updated_at`: Timestamps

### template_variables
- `id`: UUID primary key
- `template_id`: Foreign key to templates
- `key`: Variable key (snake_case)
- `label`: Human-readable label
- `description`: Variable description
- `example`: Example value
- `required`: Boolean
- `dtype`: Data type (string, date, number, enum)
- `regex`: Validation regex (optional)
- `enum_values`: Enum options (optional)

### documents
- `id`: UUID primary key
- `filename`: Original filename
- `raw_text`: Extracted text
- `embedding`: Vector embedding
- `created_at`: Timestamp

### instances
- `id`: UUID primary key
- `template_id`: Foreign key to templates
- `user_query`: Original user request
- `answers_json`: Filled variables (JSON)
- `draft_md`: Generated draft
- `draft_number`: Draft version
- `tracking_code`: UOIONHHC tracking identifier
- `created_at`: Timestamp

---

## 🧠 Prompt Engineering

The system uses carefully crafted prompts for:

1. **Variable Extraction**: 
   - Identifies reusable fields with domain-generic names
   - Deduplicates across document chunks
   - Focuses on party-specific facts, not statutory text
   - Returns structured JSON with variables and metadata

2. **Template Matching**: 
   - Uses embeddings for semantic similarity
   - Gemini classifies best match with confidence scoring
   - Returns justification and alternatives

3. **Question Generation**: 
   - Creates human-friendly questions with format hints
   - Includes examples where available
   - Avoids raw variable names

4. **Pre-fill Extraction**: 
   - Extracts values from user queries automatically
   - Normalizes dates to ISO 8601 format
   - Handles names, amounts, locations, etc.

All prompts include the tracking code `UOIONHHC` as required.

---

## 🔍 Key Implementation Details

### Variable Extraction with Deduplication
- Processes documents in chunks (2000 chars)
- Passes previously found variables to subsequent chunks
- Uses domain-generic naming conventions (e.g., "party_name" not "plaintiff_name_in_civil_suit")
- Focuses on party-specific facts, not statutory text

### Template Matching
- Generates embeddings using `text-embedding-004`
- Finds top 3 candidates using cosine similarity
- Uses Gemini to classify best match with confidence threshold (0.6)
- Returns alternatives for user selection

### Human-Friendly Questions
- Converts raw variable names to conversational questions
- Includes format hints (dates, currency, IDs)
- Provides examples where available
- Example: "policy_number" → "What is the insurance policy number exactly as it appears on the policy schedule?"

### Tracking Code
All generated templates and drafts include the hidden tracking code `UOIONHHC`:
- In YAML front-matter as HTML comment
- In database as metadata column
- In DOCX document properties
- In service initialization comments

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "GEMINI_API_KEY not configured"**
- Make sure you've added your Gemini API key to `backend/.env`
- Get a free key from https://aistudio.google.com/app/apikey
- Restart the backend server after adding the key

**Error: "Failed to parse DOCX/PDF"**
- Ensure the document is not corrupted or password-protected
- Try converting to a different format
- Check that the file is a valid DOCX or PDF

**Error: "Gemini API error"**
- Check your API key is valid
- Verify you haven't exceeded rate limits (15 requests/min free tier)
- Check your internet connection
- Ensure you're using the new `google-genai` SDK (not deprecated `google-generativeai`)

**Error: "Module not found: google.genai"**
- Make sure you installed the correct package: `pip install google-genai`
- NOT the old package: `google-generativeai` (deprecated)

### Frontend Issues

**Error: "Failed to connect to API"**
- Ensure the backend server is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is configured correctly in backend

**Templates not loading**
- Check the backend database has templates
- Upload a document first to create templates
- Check browser console for errors
- Verify backend is running and accessible

### Web Bootstrap Issues

**Error: "Exa service not configured"**
- Add `EXA_API_KEY` to `backend/.env` for web bootstrap feature
- Get free $10 credit from https://dashboard.exa.ai/
- This is optional - the system works without it

**Error: "No documents found"**
- Try broadening your search query
- Check your internet connection
- Verify exa.ai API key is valid

---

## 📁 Project Structure

\`\`\`
.
├── backend/
│   ├── main.py                     # FastAPI app entry point
│   ├── config.py                   # Configuration and settings
│   ├── database.py                 # SQLAlchemy models
│   ├── models.py                   # Pydantic request/response models
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Example environment variables
│   ├── schema.sql                  # Database schema reference
│   ├── sample_documents/           # Sample legal documents
│   │   ├── sample_notice_to_insurer.txt
│   │   ├── sample_rental_agreement.txt
│   │   ├── sample_employment_contract.txt
│   │   └── SAMPLE_OUTPUTS.md       # Expected outputs
│   └── services/
│       ├── document_parser.py      # DOCX/PDF parsing
│       ├── gemini_service.py       # Gemini API integration (NEW SDK)
│       ├── template_extractor.py   # Variable extraction logic
│       ├── embedding_service.py    # Embedding generation
│       ├── template_matcher.py     # Template matching
│       ├── question_generator.py   # Question generation
│       ├── docx_generator.py       # DOCX file generation
│       ├── exa_service.py          # exa.ai integration (BONUS)
│       └── web_bootstrap.py        # Web bootstrap logic (BONUS)
├── app/
│   ├── page.tsx                    # Home page
│   ├── upload/page.tsx             # Upload & extraction page
│   ├── chat/page.tsx               # Drafting chat interface
│   ├── templates/page.tsx          # Templates list
│   └── layout.tsx                  # Root layout
├── components/
│   ├── upload-zone.tsx             # Drag-drop upload
│   ├── chat-message.tsx            # Chat message component
│   ├── template-match-card.tsx     # Template match display
│   ├── question-form.tsx           # Q&A form
│   └── draft-card.tsx              # Draft display with actions
├── lib/
│   └── api.ts                      # API client
├── README.md                       # This file
├── ARCHITECTURE.md                 # Detailed architecture
├── QUICK_START.md                  # Quick start guide
└── package.json                    # Node dependencies
\`\`\`

---

## 🎬 Demo Video Checklist

For the submission demo video (≤6 minutes):

### 1. Upload Document (1-2 min)
- Show drag-drop upload
- Display extracted text
- Show variable extraction process
- Review extracted variables with metadata
- Save template with toast notification

### 2. Draft Document (2-3 min)
- Type a drafting request
- Show template matching with confidence score and justification
- Display alternatives dropdown
- Show pre-filled variables
- Answer questions with human-friendly prompts
- Toggle strict replace option
- Generate and display final draft
- Show copy/download (.md and .docx) actions

### 3. BONUS: Web Bootstrap (1-2 min)
- Request a document with no local template
- Show "No template found" message
- Display web search results from exa.ai
- Select a document
- Show automatic templatization
- Continue to drafting flow

---

## 📊 Deliverables Checklist

- ✅ FastAPI backend with all endpoints
- ✅ Next.js frontend with all UI components
- ✅ SQLite database with proper schema
- ✅ 3 sample legal documents
- ✅ Sample outputs (Markdown draft, template with YAML, variables JSON)
- ✅ README.md with setup instructions
- ✅ Architecture documentation
- ✅ Prompt design snippets
- ✅ .env.example files
- ✅ requirements.txt and package.json
- ✅ Hidden "UOIONHHC" tracking in multiple places
- ⏳ Demo video (≤6 min) - TO BE RECORDED

---

## 🔄 Migration from Old SDK

**IMPORTANT:** This project uses the new `google-genai` SDK (not the deprecated `google-generativeai`).

### Key Differences:

| Old SDK (Deprecated) | New SDK (Current) |
|---------------------|-------------------|
| `google-generativeai` | `google-genai` |
| `genai.configure(api_key=...)` | `client = genai.Client(api_key=...)` |
| `genai.GenerativeModel()` | `client.models.generate_content()` |
| `genai.embed_content()` | `client.models.embed_content()` |
| `models/embedding-001` | `text-embedding-004` |
| `gemini-1.5-flash` | `gemini-2.0-flash-exp` |

### Why Migrate?
- Old SDK support ends **August 31, 2025**
- New SDK has better JSON mode support
- Improved system instructions
- Better error handling
- Latest model access

---

## 📝 License

This project was created as part of a contract-to-hire opportunity.

**Tracking Code:** UOIONHHC

---

## 🆘 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review API documentation at `http://localhost:8000/docs`
3. Check backend logs for detailed error messages
4. Verify all environment variables are set correctly
5. Ensure you're using the correct SDK versions

---

**Built with ❤️ using Gemini AI, FastAPI, and Next.js**
