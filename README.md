# ✈️ TripMate - Your AI Travel Companion

TripMate is a full-stack, AI-powered travel application designed to help users plan trips end-to-end. From discovering destinations and building day-by-day itineraries to chatting with an AI travel concierge that uses RAG and live weather tools, TripMate is a comprehensive travel-tech product.

## 📋 What It Does

A user signs up, then can:
* **Search & Browse:** Discover famous world landmarks fetched dynamically, complete with photos, descriptions, and a 5-star review system.
* **Trip Management:** Create, view, edit, and delete trips with a visual, day-by-day itinerary timeline (add, edit, remove activities).
* **AI Concierge Chatbot:** Chat with an AI travel concierge (Groq Llama 3.3) that remembers multi-turn conversations and gives friendly advice.
* **RAG (Retrieval-Augmented Generation):** Ask deep questions about a destination and get answers grounded in real travel guide documents (ChromaDB).
* **Smart AI Agent:** Get live info on demand — current weather (Open-Meteo) and currency conversion (open.er-api.com) — pulled automatically by the AI agent.
* **ML Recommendations:** Receive AI destination recommendations based on budget and interests using a scikit-learn K-Nearest Neighbors model.
* **Computer Vision:** Upload a travel photo and have the app recognise the landmark/objects using a Hugging Face Vision Transformer.
* **Background Jobs:** Generate and download a nicely formatted itinerary PDF (created in the background via FastAPI `BackgroundTasks`).
* **Analytics Dashboard:** Admins can view a premium BI dashboard with KPI cards and interactive charts (Recharts) fed by an ETL aggregation job.

## 🛠️ Tech Stack

**Frontend:**
* Next.js (App Router) & React
* Tailwind CSS
* TanStack React Query (Data fetching & caching)
* Axios

**Backend:**
* FastAPI (Python)
* SQLAlchemy 2.0 (Async) & Alembic (Migrations)
* Pydantic (Validation) & SlowAPI (Rate limiting)
* Repository-Service-Controller (RSC) Enterprise Architecture

**Data & AI:**
* SQLite / PostgreSQL (Database)
* ChromaDB (Vector Database for RAG)
* Groq API (LLM)
* Hugging Face Transformers (Computer Vision)
* scikit-learn (Machine Learning)

**DevOps & Testing:**
* Git & GitHub (Visible Commit History)
* Docker (Backend containerization)
* GitHub Actions (CI/CD)
* Pytest (Backend), Jest & Playwright (Frontend)
* Vercel (Frontend Hosting) & Render (Backend Hosting)

## 🏗️ System Architecture

\`\`\`text
[ Frontend (Next.js + Tailwind) ]
       | (React Query / Axios)
       v
[ Backend API (FastAPI) ] ---> [ Auth (JWT + Rate Limit) ]
       |
       +---> [ Database (SQLAlchemy) ] (Users, Trips, Itinerary, Reviews, Docs)
       |
       +---> [ AI Services ]
       |       - LLM (Groq)
       |       - RAG (ChromaDB)
       |       - Agent Tools (Open-Meteo & Exchange Rate APIs)
       |
       +---> [ Intelligence Services ]
       |       - CV (Hugging Face)
       |       - ML (scikit-learn)
       |
       +---> [ Background Ops ] (ReportLab PDF Generation)
\`\`\`

## 🚀 How to Run

### Prerequisites
* Python 3.10+
* Node.js 18+
* A Groq API Key (for AI features)

### Backend Setup
1. Navigate to the backend folder: \`cd backend\`
2. Create a virtual environment: \`python3 -m venv .venv\`
3. Activate it: \`source .venv/bin/activate\`
4. Install dependencies: \`pip install -r requirements.txt\`
5. Create a \`.env\` file in the \`backend\` folder with the following variables:
   \`\`\`env
   DATABASE_URL=sqlite+aiosqlite:///./tripmate.db
   SECRET_KEY=your_super_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   GROQ_API_KEY=your_groq_api_key
   \`\`\`
6. Run database migrations: \`alembic upgrade head\`
7. Start the server: \`uvicorn app.main:app --reload\`
8. API Docs available at: \`http://localhost:8000/docs\`

### Frontend Setup
1. Navigate to the frontend folder: \`cd frontend\`
2. Install dependencies: \`npm install\`
3. Create a \`.env.local\` file in the \`frontend\` folder:
   \`\`\`env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   \`\`\`
4. Start the development server: \`npm run dev\`
5. Open the app at: \`http://localhost:3000\`

## 🧪 Testing
* **Backend Tests:** \`cd backend && pytest\`
* **Frontend Unit Tests:** \`cd frontend && npm run test\`
* **Frontend E2E Tests:** \`cd frontend && npx playwright test\`

## 📂 Visible Commit History
This project was built iteratively, following enterprise agile methodologies. The GitHub repository contains a visible commit history detailing the step-by-step implementation of features, from MVP setup to AI integration and final deployment.
