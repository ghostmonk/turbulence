"""
Test configuration and fixtures
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import mongomock_motor
import pytest
import pytest_asyncio
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

from database import get_collection

# Create a test app without lifespan to avoid DB connections during startup
# Import routers directly to avoid the lifespan event
from handlers.stories import router as stories_router
from handlers.uploads import router as uploads_router
from handlers.video_processing import router as video_processing_router

test_app = FastAPI()
test_app.include_router(stories_router)
test_app.include_router(uploads_router)
test_app.include_router(video_processing_router)


@pytest.fixture
def mock_database():
    """Mock database for testing"""
    mock_client = mongomock_motor.AsyncMongoMockClient()
    mock_db = mock_client.test_db
    return mock_db


@pytest.fixture
def mock_collection():
    """Mock collection for testing

    Uses MagicMock as base because MongoDB's find() returns a cursor synchronously.
    Individual methods that should be async (like find_one, count_documents) are set up as AsyncMock.
    """
    mock = MagicMock()
    # These methods need to be async
    mock.find_one = AsyncMock()
    mock.count_documents = AsyncMock()
    mock.insert_one = AsyncMock()
    mock.update_one = AsyncMock()
    mock.delete_one = AsyncMock()
    # find() returns a cursor synchronously, so it stays as MagicMock
    return mock


@pytest.fixture
def override_database(mock_collection):
    """Override the database functions to use mocks via FastAPI dependency overrides"""

    async def get_mock_collection():
        return mock_collection

    # Use FastAPI's dependency override system
    test_app.dependency_overrides[get_collection] = get_mock_collection
    yield mock_collection
    # Clear the overrides after the test
    test_app.dependency_overrides.clear()


@pytest.fixture
def client(override_database):
    """Test client for synchronous tests"""
    return TestClient(test_app)


@pytest_asyncio.fixture
async def async_client(override_database):
    """Async test client for async tests - requires override_database to mock DB"""
    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_story_data():
    """Sample story data for testing"""
    # Use fixed datetime for consistent testing
    fixed_datetime = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    return {
        "title": "Test Story",
        "content": "<p>This is a test story content.</p>",
        "is_published": True,
        "slug": "test-story",
        "createdDate": fixed_datetime,
        "updatedDate": fixed_datetime,
    }


@pytest.fixture
def sample_unpublished_story_data():
    """Sample unpublished story data for testing"""
    # Use fixed datetime for consistent testing
    fixed_datetime = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    return {
        "title": "Draft Story",
        "content": "<p>This is a draft story content.</p>",
        "is_published": False,
        "slug": "draft-story",
        "createdDate": fixed_datetime,
        "updatedDate": fixed_datetime,
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
