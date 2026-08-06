# TripMate - AI Travel Companion

Full-stack capstone project: Next.js + FastAPI + PostgreSQL, with an AI concierge (chat + RAG), live weather/currency agent tools, and background PDF generation.

## Tech Stack
- Frontend: Next.js (App Router), Tailwind CSS, React Query
- Backend: FastAPI, JWT auth, Pydantic, SQLAlchemy, Alembic
- Database: PostgreSQL (+ pgvector for RAG embeddings)
- AI: OpenAI/Anthropic chat + embeddings

## Project Structure
backend/   FastAPI app (see backend/README.md)
frontend/  Next.js app (see frontend/README.md)
docs/      Architecture diagram + write-up

## Running locally - backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload

## Running locally - frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev

## Status
In progress - see commit history for milestone-by-milestone progress.
