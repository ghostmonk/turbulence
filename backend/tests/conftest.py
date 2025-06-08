"""
Test configuration and fixtures
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import mongomock_motor
import pytest
import pytest_asyncio

# Import the main app
from app import app
from database import db, get_database
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def mock_database():
    """Mock database for testing"""
    # Create a mock MongoDB client using mongomock-motor
    mock_client = mongomock_motor.AsyncMongoMockClient()
    mock_db = mock_client.test_db
    return mock_db


@pytest.fixture
def override_database(mock_database):
    """Override the database dependency"""

    def get_mock_database():
        return mock_database

    app.dependency_overrides[get_database] = get_mock_database
    yield mock_database
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """Test client for synchronous tests"""
    return TestClient(app)


@pytest_asyncio.fixture
async def async_client():
    """Async test client for async tests"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_story_data():
    """Sample story data for testing"""
    return {
        "title": "Test Story",
        "content": "<p>This is a test story content.</p>",
        "is_published": True,
        "slug": "test-story",
        "createdDate": datetime.now(timezone.utc),
        "updatedDate": datetime.now(timezone.utc),
    }


@pytest.fixture
def sample_unpublished_story_data():
    """Sample unpublished story data for testing"""
    return {
        "title": "Draft Story",
        "content": "<p>This is a draft story content.</p>",
        "is_published": False,
        "slug": "draft-story",
        "createdDate": datetime.now(timezone.utc),
        "updatedDate": datetime.now(timezone.utc),
    }


@pytest.fixture
def mock_google_storage():
    """Mock Google Cloud Storage for testing"""
    mock_storage = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()

    mock_storage.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.upload_from_file.return_value = None
    mock_blob.public_url = "https://storage.googleapis.com/test-bucket/test-file.jpg"

    return mock_storage


@pytest.fixture
def mock_logger():
    """Mock logger for testing"""
    return MagicMock()


@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Set up test environment variables"""
    monkeypatch.setenv("DATABASE_URL", "mongodb://localhost:27017/test")
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-project")
    monkeypatch.setenv("STORAGE_BUCKET", "test-bucket")
