"""TripMate FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="TripMate API",
    description="AI-powered travel companion — backend API",
    version="0.1.0",
)

# CORS: allow the Next.js frontend to call this API during dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Liveness check used by deploy platforms and local verification."""
    return {"status": "ok"}
