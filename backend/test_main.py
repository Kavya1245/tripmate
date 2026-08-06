from fastapi.testclient import TestClient
from app.main import app

# Create a test client
client = TestClient(app)

def test_read_root():
    """Test the root endpoint returns 200 and the correct welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to TripMate API. Visit /docs for documentation."}

def test_protected_route_rejects_missing_token():
    """Test that the /trips endpoint rejects requests without a token."""
    response = client.get("/api/v1/trips/")
    assert response.status_code == 401  # Unauthorized
    assert response.json()["detail"] == "Not authenticated"
