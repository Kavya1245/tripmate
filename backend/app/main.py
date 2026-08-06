from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.api.v1.endpoints import auth, trips, chat, rag, itineraries, destinations, reviews, cv, ml, analytics

app = FastAPI(title="TripMate API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(trips.router, prefix="/api/v1/trips", tags=["Trips"])
app.include_router(itineraries.router, prefix="/api/v1/itineraries", tags=["Itineraries"])
app.include_router(destinations.router, prefix="/api/v1/destinations", tags=["Destinations"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["Reviews"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["AI Chat"])
app.include_router(rag.router, prefix="/api/v1/rag", tags=["RAG"])
app.include_router(cv.router, prefix="/api/v1/cv", tags=["Computer Vision"])
app.include_router(ml.router, prefix="/api/v1/ml", tags=["Machine Learning"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

@app.get("/")
async def root():
    return {"message": "Welcome to TripMate API. Visit /docs for documentation."}
