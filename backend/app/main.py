from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.api.v1.endpoints import auth, trips, chat, rag, itineraries, destinations, reviews

app = FastAPI(
    title="TripMate API",
    description="AI-powered travel companion backend",
    version="1.0.0"
)

# Add Rate Limiter state to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(trips.router, prefix="/api/v1/trips", tags=["Trips"])
app.include_router(itineraries.router, prefix="/api/v1/itineraries", tags=["Itineraries"])
app.include_router(destinations.router, prefix="/api/v1/destinations", tags=["Destinations"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["Reviews"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["AI Chat"])
app.include_router(rag.router, prefix="/api/v1/rag", tags=["RAG"])

@app.get("/")
async def root():
    return {"message": "Welcome to TripMate API. Visit /docs for documentation."}
