# Quickstart Guide

## Prerequisites
- Node.js 20+
- PostgreSQL database with `pgvector` extension installed
- Local Gemini Gemma 3 server URL and nomic-embed-text-v1.5 server URL

## Setup Environment

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables in `.env`:
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/rag_db
   LOCAL_LLM_BASE_URL=http://localhost:11434/v1
   LOCAL_EMBEDDING_BASE_URL=http://localhost:11434/v1
   PORT=3000
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY=lsv2_...
   LANGCHAIN_PROJECT=rag-mvp1
   ```

## Database Initialization

1. Run database migrations to create schema and pgvector index:
   ```bash
   npm run db:migrate
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```
2. The server will run at `http://localhost:3000`.

## Example Usage

**Ask a question:**
   ```bash
curl -X POST http://localhost:3000/api/v1/query \
        -H "Content-Type: application/json" \
  -d '{"question": "What is the product positioning for Enterprise?"}'
   ```
