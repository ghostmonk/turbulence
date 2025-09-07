"""
Story-related Pydantic models.
"""

from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator


class StoryBase(BaseModel):
    """Base model for story data."""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=10000)
    is_published: bool


class StoryCreate(StoryBase):
    """Model for creating a new story."""
    pass


class StoryResponse(StoryBase):
    """Model for story API responses."""
    id: str
    slug: str = Field(default="")
    date: datetime | None = None
    createdDate: datetime
    updatedDate: datetime

    @field_validator("date", "createdDate", "updatedDate")
    def ensure_utc(cls, value: datetime | None) -> datetime | None:
        """Ensure datetime values are in UTC timezone."""
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    class Config:
        from_attributes = True
