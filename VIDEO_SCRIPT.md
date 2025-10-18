# Video Script: Legal Document Templating System
## ⏱️ Total Duration: 6 Minutes

---

## 📖 SCRIPT WITH TIMING

### **INTRO (0:00 - 0:20) - 20 seconds**

**[Show title screen or desktop]**

**NARRATION:**
"Hello! I'm demonstrating the Legal Document Templating System - an AI-powered platform that converts legal documents into reusable templates and generates personalized drafts through intelligent Q&A.

This system uses Gemini AI for intelligence, embeddings for smart matching, and supports web-based template creation as a bonus feature.

Let me walk you through all three core features."

---

### **FEATURE 1: UPLOAD & CREATE TEMPLATE (0:20 - 2:00) - 100 seconds**

**[Open browser → http://localhost:3000/upload]**

**NARRATION:**
"Feature 1: Upload a legal document and extract variables automatically.

I'm starting on the Upload page. Notice the clean two-column layout - the left side will show extracted information, the right side has the upload zone."

**[Show the upload page with left/right columns]**

**NARRATION:**
"Let me drag and drop a sample document - I'll use this employment contract from our sample documents folder."

**[Drag and drop a DOCX file from backend/sample_documents/]**

**[Wait for upload and extraction]**

**NARRATION:**
"The system is now extracting variables from this legal document. It's using Gemini AI to identify reusable fields automatically.

This process analyzes the document structure, finds patterns, and identifies what fields should be templated."

**[Show "Extract Variables" button or wait for extraction results]**

**[Once extraction is complete, show the extracted variables table on the left]**

**NARRATION:**
"Great! The system extracted 8 variables from this employment contract:
- Employee name
- Job title
- Salary
- Start date
- Company name
- And more

Now I'll enter a template name and save it."

**[Show the Save Template form]**

**NARRATION:**
"I'm naming this 'Employment Contract Template' with tags like 'employment' and 'contract' for searchability."

**[Click "Save Template" button]**

**[Show success message/toast]**

**NARRATION:**
"Perfect! The template is now saved to our database. It's been embedded for semantic search, and all variables are indexed with their metadata."

---

### **FEATURE 2: CHAT & DRAFT GENERATION (2:00 - 4:20) - 140 seconds**

**[Navigate to http://localhost:3000/chat]**

**NARRATION:**
"Feature 2: Generate personalized drafts through intelligent conversation.

I'm now on the Chat page - notice the two-column layout again. On the right is the chat interface where I'll interact with the AI. On the left will appear template suggestions and information."

**[Show the chat page layout]**

**NARRATION:**
"Let me request a draft by describing what I need. I'll type: 'Draft an employment contract for a Senior Developer position with a salary of 120000 per year'"

**[Type the request in the chat input]**

**[Send the message]**

**[Show assistant response with template matching]**

**NARRATION:**
"The system is now:
1. Processing my natural language request
2. Creating embeddings to understand meaning
3. Searching for matching templates in the database
4. Finding the 'Employment Contract Template' we just created!"

**[Show template match card appearing on left side with confidence score]**

**NARRATION:**
"Perfect! It found our template with high confidence. Now it's asking me questions about the missing variables that can't be pre-filled from my request."

**[Show the question form on the left side with pre-filled and empty fields]**

**NARRATION:**
"See how some fields are already filled from my message:
- Job title: 'Senior Developer' (from my request)
- Salary: '120000' (extracted from my message)

But it's asking me for other details like specific employee name, exact start date, company address, etc."

**[Fill in the remaining fields with sample data]**

**NARRATION:**
"I'm filling in the remaining required fields. The form intelligently guides me through what's needed."

**[Click "Generate Draft" button]**

**[Show loading indicator]**

**NARRATION:**
"The system is now generating the final draft by substituting all the variables I provided into the template."

**[Show the generated markdown draft in the chat]**

**NARRATION:**
"Excellent! Here's the generated employment contract with all variables filled in perfectly. Everything is formatted correctly - headers, sections, all the legal language is preserved."

**[Scroll through the draft to show content]**

**NARRATION:**
"I can view this as formatted Markdown here in the chat. But let me show you the download options."

**[Show download buttons]**

**NARRATION:**
"I can download this as:
1. Markdown - for editing or documentation
2. DOCX - a fully formatted Word document ready for signing

Let me download the DOCX version so you can see the professional output."

**[Click "Download DOCX" button]**

**[Show file downloaded in browser]**

**NARRATION:**
"Perfect! The DOCX file is downloaded with proper formatting, proper fonts, and all variables correctly substituted. This is production-ready!"

**[Optionally show the downloaded file - open it briefly]**

**NARRATION:**
"Notice the DOCX has beautiful formatting with proper headers, bold text, and professional layout - not just plain text."

---

### **FEATURE 3: WEB BOOTSTRAP (4:20 - 5:50) - 90 seconds**

**[Back in chat - show alternative templates or request a new draft type]**

**NARRATION:**
"Feature 3 (Bonus): Web Bootstrap - when no local template exists, the system searches the web to create new templates automatically.

Let me request a document type we haven't created yet. I'll ask for: 'Draft a rental agreement for an apartment lease'"

**[Type new request]**

**[Send message]**

**[Show system searching]**

**NARRATION:**
"The system:
1. Checks local templates first
2. Finds no matching rental agreement template
3. Automatically searches the web using Exa API
4. Retrieves relevant rental agreement documents
5. Creates a new template automatically!"

**[Show web search results card on left side]**

**NARRATION:**
"Here are the web search results. The system found relevant rental agreements from across the internet. I can select one of these to bootstrap into a new template."

**[Click on a web result]**

**NARRATION:**
"I'm selecting this rental agreement document. The system will now:
1. Extract the content from the web
2. Identify variables automatically using Gemini
3. Convert blank lines to proper {{variable}} placeholders
4. Create a new template in our database
5. Continue with drafting!"

**[Show template being created/processed]**

**NARRATION:**
"And just like that, a new template has been created from web content! Now I can answer questions to generate my personalized rental agreement."

**[Show question form appearing]**

**NARRATION:**
"The system is asking for variable information - landlord name, tenant name, property address, rental amount, lease duration, etc."

**[Quickly fill in a few fields as examples]**

**NARRATION:**
"Once filled, I click generate and get a complete rental agreement - all created automatically from web content!"

**[Show final draft]**

**NARRATION:**
"The system successfully created a professional rental agreement from web-bootstrapped content. This is the powerful bonus feature in action!"

---

### **TECHNICAL SUMMARY (5:50 - 6:00) - 10 seconds**

**[Go back to desktop/show architecture]**

**NARRATION:**
"Behind the scenes:
- Frontend: Next.js + TypeScript with beautiful UI
- Backend: FastAPI + Python for AI/ML
- LLM: Gemini for intelligence
- Search: Exa API for web documents (bonus)
- Database: SQLite for templates and variables

All three features - upload, chat drafting, and web bootstrap - are fully functional and production-ready.

Thank you for watching! This system is ready for deployment. 🚀"

**[End screen - show GitHub repository URL]**

---

## 🎬 **FILMING TIPS**

### **Before You Start:**
1. ✅ Have backend running: `python main.py` (port 8000)
2. ✅ Have frontend running: `npm run dev` (port 3000)
3. ✅ Have sample files ready in `backend/sample_documents/`
4. ✅ Use a high-quality screen recorder (OBS, Camtasia, ScreenFlow)
5. ✅ Speak clearly and at a measured pace
6. ✅ Have a second browser tab open to show backend URL if needed

### **Recording Settings:**
- Resolution: 1080p or higher
- FPS: 30 fps
- Microphone: Clear audio, minimize background noise
- Screen: Zoom to 125-150% for better visibility

### **Timing Checklist:**
- [ ] Intro: 0:00-0:20
- [ ] Upload Feature: 0:20-2:00
- [ ] Chat Feature: 2:00-4:20
- [ ] Web Bootstrap: 4:20-5:50
- [ ] Summary: 5:50-6:00

### **Key Moments to Show:**
1. Upload page with two-column layout
2. Extracted variables table
3. Saved template success
4. Chat page layout (two columns)
5. Template matching with confidence score
6. Question form with pre-filled fields
7. Generated draft in Markdown
8. Download buttons and DOCX export
9. Web search results
10. New template creation from web
11. Final draft generation

---

## 📝 **SCRIPT NOTES**

**Do's:**
- ✅ Speak naturally and conversationally
- ✅ Pause to let information sink in
- ✅ Show the UI clearly - zoom in if needed
- ✅ Follow the exact timing for smooth pacing
- ✅ Highlight the key features and benefits
- ✅ Show the professional output quality

**Don'ts:**
- ❌ Don't read directly from script - use it as guide
- ❌ Don't rush - maintain steady pace
- ❌ Don't show error screens
- ❌ Don't include loading spinners for too long
- ❌ Don't show console errors
- ❌ Don't click outside the browser window

---

## 🎥 **POST-RECORDING CHECKLIST**

After recording, before uploading:

- [ ] Check audio is clear (no background noise)
- [ ] Check video is smooth (no stuttering)
- [ ] Check all features are demonstrated clearly
- [ ] Check timing is close to 6 minutes (±10 seconds acceptable)
- [ ] Check resolution is clear and readable
- [ ] Check no sensitive data is shown
- [ ] Convert to MP4 format
- [ ] Test playback on different devices

---

## 📤 **WHERE TO UPLOAD**

Common platforms:
- YouTube (private link)
- Google Drive (shareable link)
- Loom (screen recording platform)
- Vimeo
- GitHub Releases

Use a platform that allows 6+ minute videos and generates a shareable link.

---

## ✅ **SUBMISSION FORMAT**

When submitting:
1. Video link
2. GitHub repository link
3. Short description (what the video shows)

**Example:**
> "Demo Video: [YouTube Link]
> 
> This 6-minute video demonstrates:
> - Upload & template creation (with variable extraction)
> - Chat-based draft generation with intelligent Q&A
> - Web Bootstrap bonus feature (auto-template creation from web)
> 
> All three core features are working end-to-end with professional UI and output."

---

**Ready to film? Follow this script step-by-step and you'll have a perfect submission video! 🎬🚀**
