"""
Unit tests for utils module
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone
from bson import ObjectId

from utils import (
    slugify, 
    generate_unique_slug, 
    mongo_to_pydantic, 
    find_one_and_convert,
    find_many_and_convert
)
from models import StoryResponse


class TestSlugify:
    """Test slugify function"""

    @pytest.mark.unit
    def test_slugify_basic(self):
        """Test basic slugification"""
        result = slugify("Hello World")
        assert result == "hello-world"

    @pytest.mark.unit
    def test_slugify_with_special_characters(self):
        """Test slugify removes special characters"""
        result = slugify("Hello, World! How are you?")
        assert result == "hello-world-how-are-you"

    @pytest.mark.unit
    def test_slugify_with_numbers(self):
        """Test slugify preserves numbers"""
        result = slugify("Test Story 123")
        assert result == "test-story-123"

    @pytest.mark.unit
    def test_slugify_multiple_spaces(self):
        """Test slugify handles multiple spaces"""
        result = slugify("Hello    World")
        assert result == "hello-world"

    @pytest.mark.unit
    def test_slugify_consecutive_hyphens(self):
        """Test slugify handles consecutive special characters"""
        result = slugify("Hello---World!!!")
        assert result == "hello-world"

    @pytest.mark.unit
    def test_slugify_leading_trailing_spaces(self):
        """Test slugify removes leading/trailing hyphens"""
        result = slugify("  Hello World  ")
        assert result == "hello-world"

    @pytest.mark.unit
    def test_slugify_empty_string(self):
        """Test slugify handles empty string"""
        result = slugify("")
        assert result == ""

    @pytest.mark.unit
    def test_slugify_only_special_characters(self):
        """Test slugify handles only special characters"""
        result = slugify("!@#$%^&*()")
        assert result == ""

    @pytest.mark.unit
    def test_slugify_unicode_characters(self):
        """Test slugify handles unicode characters"""
        result = slugify("Café München")
        assert result == "caf-mnchen"


class TestGenerateUniqueSlug:
    """Test generate_unique_slug function"""

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_generate_unique_slug_no_collision(self):
        """Test generate unique slug when no collision exists"""
        mock_collection = AsyncMock()
        mock_collection.find_one.return_value = None  # No existing slug
        
        result = await generate_unique_slug(mock_collection, "Test Story")
        
        assert result == "test-story"
        mock_collection.find_one.assert_called_once_with({
            "slug": "test-story", 
            "deleted": {"$ne": True}
        })

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_generate_unique_slug_with_collision(self):
        """Test generate unique slug when collision exists"""
        mock_collection = AsyncMock()
        # First call returns existing document, second call returns None
        mock_collection.find_one.side_effect = [
            {"_id": ObjectId(), "slug": "test-story"},  # Collision
            None  # No collision for test-story-2
        ]
        
        result = await generate_unique_slug(mock_collection, "Test Story")
        
        assert result == "test-story-2"
        assert mock_collection.find_one.call_count == 2

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_generate_unique_slug_multiple_collisions(self):
        """Test generate unique slug with multiple collisions"""
        mock_collection = AsyncMock()
        # Multiple collisions before finding unique slug
        mock_collection.find_one.side_effect = [
            {"_id": ObjectId(), "slug": "test-story"},    # Collision 1
            {"_id": ObjectId(), "slug": "test-story-2"},  # Collision 2
            {"_id": ObjectId(), "slug": "test-story-3"},  # Collision 3
            None  # No collision for test-story-4
        ]
        
        result = await generate_unique_slug(mock_collection, "Test Story")
        
        assert result == "test-story-4"
        assert mock_collection.find_one.call_count == 4

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_generate_unique_slug_existing_id(self):
        """Test generate unique slug when updating existing story"""
        mock_collection = AsyncMock()
        existing_id = ObjectId()
        mock_collection.find_one.return_value = None
        
        result = await generate_unique_slug(
            mock_collection, 
            "Test Story", 
            existing_id=existing_id
        )
        
        assert result == "test-story"
        mock_collection.find_one.assert_called_once_with({
            "slug": "test-story", 
            "deleted": {"$ne": True},
            "_id": {"$ne": existing_id}
        })


class TestMongoToPydantic:
    """Test mongo_to_pydantic function"""

    @pytest.mark.unit
    def test_mongo_to_pydantic_success(self):
        """Test successful conversion of MongoDB document to Pydantic model"""
        now = datetime.now(timezone.utc)
        mongo_doc = {
            "_id": ObjectId(),
            "title": "Test Story",
            "content": "Test content",
            "is_published": True,
            "slug": "test-story",
            "date": now,
            "createdDate": now,
            "updatedDate": now
        }
        
        result = mongo_to_pydantic(mongo_doc, StoryResponse)
        
        assert isinstance(result, StoryResponse)
        assert result.id == str(mongo_doc["_id"])
        assert result.title == "Test Story"
        assert result.content == "Test content"
        assert result.is_published is True
        assert result.slug == "test-story"

    @pytest.mark.unit
    def test_mongo_to_pydantic_none_document(self):
        """Test mongo_to_pydantic with None document"""
        result = mongo_to_pydantic(None, StoryResponse)
        assert result is None

    @pytest.mark.unit
    def test_mongo_to_pydantic_no_id_field(self):
        """Test mongo_to_pydantic with document missing _id field"""
        now = datetime.now(timezone.utc)
        mongo_doc = {
            "title": "Test Story",
            "content": "Test content",
            "is_published": True,
            "slug": "test-story",
            "date": now,
            "createdDate": now,
            "updatedDate": now
        }
        
        # This should fail since id is required in StoryResponse
        with pytest.raises(Exception):  # Pydantic validation error
            mongo_to_pydantic(mongo_doc, StoryResponse)


class TestFindOneAndConvert:
    """Test find_one_and_convert function"""

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_find_one_and_convert_success(self):
        """Test successful find and convert"""
        now = datetime.now(timezone.utc)
        mock_doc = {
            "_id": ObjectId(),
            "title": "Test Story",
            "content": "Test content",
            "is_published": True,
            "slug": "test-story",
            "date": now,
            "createdDate": now,
            "updatedDate": now
        }
        
        mock_collection = AsyncMock()
        mock_collection.find_one.return_value = mock_doc
        
        result = await find_one_and_convert(
            mock_collection, 
            {"_id": mock_doc["_id"]}, 
            StoryResponse
        )
        
        assert isinstance(result, StoryResponse)
        assert result.title == "Test Story"
        mock_collection.find_one.assert_called_once_with({"_id": mock_doc["_id"]})

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_find_one_and_convert_not_found(self):
        """Test find and convert when document not found"""
        mock_collection = AsyncMock()
        mock_collection.find_one.return_value = None
        
        result = await find_one_and_convert(
            mock_collection, 
            {"_id": ObjectId()}, 
            StoryResponse
        )
        
        assert result is None


class TestFindManyAndConvert:
    """Test find_many_and_convert function"""

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_find_many_and_convert_success(self):
        """Test successful find many and convert"""
        now = datetime.now(timezone.utc)
        mock_docs = [
            {
                "_id": ObjectId(),
                "title": "Story 1",
                "content": "Content 1",
                "is_published": True,
                "slug": "story-1",
                "date": now,
                "createdDate": now,
                "updatedDate": now
            },
            {
                "_id": ObjectId(),
                "title": "Story 2",
                "content": "Content 2",
                "is_published": False,
                "slug": "story-2",
                "date": now,
                "createdDate": now,
                "updatedDate": now
            }
        ]
        
        # Create async iterator mock
        mock_cursor = MagicMock()
        mock_cursor.__aiter__.return_value = iter(mock_docs)
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.skip.return_value = mock_cursor
        mock_cursor.limit.return_value = mock_cursor
        
        mock_collection = AsyncMock()
        mock_collection.find.return_value = mock_cursor
        
        result = await find_many_and_convert(
            mock_collection,
            {"is_published": True},
            StoryResponse,
            sort={"createdDate": -1},
            limit=10,
            skip=0
        )
        
        assert len(result) == 2
        assert all(isinstance(story, StoryResponse) for story in result)
        assert result[0].title == "Story 1"
        assert result[1].title == "Story 2"
        
        mock_collection.find.assert_called_once_with({"is_published": True})
        mock_cursor.sort.assert_called_once_with({"createdDate": -1})
        mock_cursor.skip.assert_called_once_with(0)
        mock_cursor.limit.assert_called_once_with(10)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_find_many_and_convert_empty_result(self):
        """Test find many and convert with empty result"""
        mock_cursor = MagicMock()
        mock_cursor.__aiter__.return_value = iter([])
        
        mock_collection = AsyncMock()
        mock_collection.find.return_value = mock_cursor
        
        result = await find_many_and_convert(
            mock_collection,
            {"is_published": True},
            StoryResponse
        )
        
        assert result == [] 