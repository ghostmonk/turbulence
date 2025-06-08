"""
Unit tests for Pydantic models
"""
import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from models import StoryBase, StoryCreate, StoryResponse


class TestStoryBase:
    """Test StoryBase model"""
    
    @pytest.mark.unit
    def test_valid_story_base(self):
        """Test creating a valid StoryBase"""
        story_data = {
            "title": "Test Story",
            "content": "This is test content",
            "is_published": True
        }
        story = StoryBase(**story_data)
        
        assert story.title == "Test Story"
        assert story.content == "This is test content"
        assert story.is_published is True

    @pytest.mark.unit
    def test_story_base_empty_title(self):
        """Test that empty title raises validation error"""
        story_data = {
            "title": "",
            "content": "This is test content",
            "is_published": True
        }
        
        with pytest.raises(ValidationError) as exc_info:
            StoryBase(**story_data)
        
        errors = exc_info.value.errors()
        assert any(error["type"] == "string_too_short" for error in errors)

    @pytest.mark.unit
    def test_story_base_title_too_long(self):
        """Test that title longer than 200 chars raises validation error"""
        story_data = {
            "title": "x" * 201,  # 201 characters
            "content": "This is test content",
            "is_published": True
        }
        
        with pytest.raises(ValidationError) as exc_info:
            StoryBase(**story_data)
        
        errors = exc_info.value.errors()
        assert any(error["type"] == "string_too_long" for error in errors)

    @pytest.mark.unit
    def test_story_base_empty_content(self):
        """Test that empty content raises validation error"""
        story_data = {
            "title": "Test Story",
            "content": "",
            "is_published": True
        }
        
        with pytest.raises(ValidationError) as exc_info:
            StoryBase(**story_data)
        
        errors = exc_info.value.errors()
        assert any(error["type"] == "string_too_short" for error in errors)

    @pytest.mark.unit
    def test_story_base_content_too_long(self):
        """Test that content longer than 10000 chars raises validation error"""
        story_data = {
            "title": "Test Story",
            "content": "x" * 10001,  # 10001 characters
            "is_published": True
        }
        
        with pytest.raises(ValidationError) as exc_info:
            StoryBase(**story_data)
        
        errors = exc_info.value.errors()
        assert any(error["type"] == "string_too_long" for error in errors)

    @pytest.mark.unit
    def test_story_base_missing_required_fields(self):
        """Test that missing required fields raise validation error"""
        incomplete_data = {"title": "Test Story"}
        
        with pytest.raises(ValidationError) as exc_info:
            StoryBase(**incomplete_data)
        
        errors = exc_info.value.errors()
        error_fields = [error["loc"][0] for error in errors]
        assert "content" in error_fields
        assert "is_published" in error_fields


class TestStoryCreate:
    """Test StoryCreate model"""

    @pytest.mark.unit
    def test_story_create_inherits_from_story_base(self):
        """Test that StoryCreate has same validation as StoryBase"""
        story_data = {
            "title": "Test Story",
            "content": "This is test content",
            "is_published": False
        }
        story = StoryCreate(**story_data)
        
        assert story.title == "Test Story"
        assert story.content == "This is test content"
        assert story.is_published is False


class TestStoryResponse:
    """Test StoryResponse model"""

    @pytest.mark.unit
    def test_valid_story_response(self):
        """Test creating a valid StoryResponse"""
        now = datetime.now(timezone.utc)
        story_data = {
            "title": "Test Story",
            "content": "This is test content",
            "is_published": True,
            "id": "507f1f77bcf86cd799439011",
            "slug": "test-story",
            "date": now,
            "createdDate": now,
            "updatedDate": now
        }
        story = StoryResponse(**story_data)
        
        assert story.title == "Test Story"
        assert story.id == "507f1f77bcf86cd799439011"
        assert story.slug == "test-story"
        assert story.date == now
        assert story.createdDate == now
        assert story.updatedDate == now

    @pytest.mark.unit  
    def test_story_response_default_slug(self):
        """Test that slug defaults to empty string"""
        now = datetime.now(timezone.utc)
        story_data = {
            "title": "Test Story",
            "content": "This is test content",
            "is_published": True,
            "id": "507f1f77bcf86cd799439011",
            "date": now,
            "createdDate": now,
            "updatedDate": now
        }
        story = StoryResponse(**story_data)
        
        assert story.slug == ""

    @pytest.mark.unit
    def test_story_response_timezone_validation_naive_datetime(self):
        """Test that naive datetime gets converted to UTC"""
        naive_datetime = datetime(2024, 1, 1, 12, 0, 0)  # No timezone
        story_data = {
            "title": "Test Story",
            "content": "This is test content",
            "is_published": True,
            "id": "507f1f77bcf86cd799439011",
            "slug": "test-story",
            "date": naive_datetime,
            "createdDate": naive_datetime,
            "updatedDate": naive_datetime
        }
        story = StoryResponse(**story_data)
        
        # Should add UTC timezone
        expected_datetime = naive_datetime.replace(tzinfo=timezone.utc)
        assert story.date == expected_datetime
        assert story.createdDate == expected_datetime
        assert story.updatedDate == expected_datetime

    @pytest.mark.unit
    def test_story_response_timezone_validation_aware_datetime(self):
        """Test that timezone-aware datetime gets converted to UTC"""
        # Create a datetime with a different timezone (EST = UTC-5)
        from datetime import timezone, timedelta
        est = timezone(timedelta(hours=-5))
        est_datetime = datetime(2024, 1, 1, 12, 0, 0, tzinfo=est)
        
        story_data = {
            "title": "Test Story",
            "content": "This is test content",
            "is_published": True,
            "id": "507f1f77bcf86cd799439011",
            "slug": "test-story",
            "date": est_datetime,
            "createdDate": est_datetime,
            "updatedDate": est_datetime
        }
        story = StoryResponse(**story_data)
        
        # Should convert to UTC (EST 12:00 = UTC 17:00)
        expected_utc = est_datetime.astimezone(timezone.utc)
        assert story.date == expected_utc
        assert story.createdDate == expected_utc
        assert story.updatedDate == expected_utc
        assert story.date.hour == 17  # Converted from EST 12:00 to UTC 17:00 