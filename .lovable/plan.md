

# OpsMind AI — Corporate Knowledge Assistant (Full UI Prototype)

A complete, polished frontend prototype of the OpsMind AI platform with mock data and simulated AI interactions. Designed for internal employee use with role-based access (admin vs. regular user).

---

## 1. Landing & Authentication
- **Login page** with email/password form (simulated auth, no real backend)
- Branded with "OpsMind AI" identity and Infotact Solutions branding
- Role selector to switch between Admin and Employee views for demo purposes

## 2. Chat Interface (Core Experience)
- **Full-screen conversational UI** where employees ask questions about company documents
- Streaming-style animated AI responses (simulated with mock answers)
- **Reference Cards / Citations** displayed alongside each AI response showing:
  - Source document filename
  - Page number
  - Relevant text snippet highlighted
- **Hallucination Guardrail indicator** — when a question is outside the knowledge base, the AI displays: *"I don't have enough information in the indexed documents to answer this question."*
- Chat history sidebar to revisit past conversations
- Suggested follow-up questions after each response

## 3. Document Management (Admin)
- **PDF Upload interface** with drag-and-drop support
- Document list showing all uploaded files with metadata (name, upload date, page count, processing status)
- Processing status indicators: Uploading → Parsing → Chunking → Embedding → Indexed
- Ability to delete or re-index documents
- Mock progress animations for document processing pipeline

## 4. Admin Knowledge Graph Dashboard
- **Visual dashboard** showing:
  - Most queried topics (bar chart)
  - Most referenced documents (ranked list)
  - Query volume over time (line chart)
  - Recent queries feed
- Summary statistics: total documents, total chunks, total queries, avg. response time

## 5. Chat History & Persistence
- Sidebar listing past conversations grouped by date
- Ability to continue previous conversations
- Search through chat history
- Mock data pre-populated with sample conversations

## 6. Design & UX
- Clean, professional enterprise design with light/dark mode
- Responsive layout (desktop-focused, tablet-friendly)
- Infotact Solutions branding with the colorful logo motif
- Smooth animations for message streaming, document processing, and page transitions

