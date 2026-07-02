# KnowledgeOS

KnowledgeOS is an AI-powered documents management platform that helps users organize their documents and quickly find information using natural language.

In many organizations and teams, important information is stored in PDF documents such as reports, documentation, meeting notes, policies, and technical guides. Finding a specific piece of information usually means opening multiple files and reading through them manually, which takes time.

KnowledgeOS solves this problem by allowing users to organize documents into organizations and workspaces, upload PDF files, and ask questions about their content. Instead of searching through entire documents, the system retrieves the most relevant information and generates an answer using AI.

The project is built using Node.js, Express.js, PostgreSQL, Prisma ORM, Google Gemini, and Qdrant.



## Features

- User Signup & Login
- JWT Authentication
- Create Organizations
- Create Workspaces
- Upload PDF Documents
- Extract Text from PDFs
- Generate Embeddings using Gemini
- Store Embeddings in Qdrant
- AI-powered Document Chat
- Chat History
- Dashboard API



## Tech Stack

### Backend

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Multer
- pdf-parse

### AI

- Google Gemini API
- Qdrant Vector Database



## How It Works


1. A user signs up and logs into the platform.
2. The user creates an organization and a workspace.
3. PDF documents are uploaded to the workspace.
4. Text is extracted from the uploaded PDF.
5. The extracted text is divided into smaller chunks.
6. Gemini generates embeddings for every chunk.
7. The embeddings are stored in Qdrant for semantic search.
8. When the user asks a question, the most relevant chunks are retrieved from Qdrant.
9. Gemini uses those chunks as context to generate an answer.
10. Every conversation is saved so users can access their chat history later.



## Future Improvements

- Support more file formats such as DOCX and TXT.
- Allow users to search across multiple documents in a workspace.
- Improve document chunking for better retrieval quality.
- Add role-based access control for organizations and workspaces.
- Deploy the application for public access.


