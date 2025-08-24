from datetime import datetime, timezone
from typing import List

from pydantic import BaseModel, Field, field_validator


class StoryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=10000)
    is_published: bool


class StoryCreate(StoryBase):
    pass


class StoryResponse(StoryBase):
    id: str
    slug: str = Field(default="")
    date: datetime | None = None
    createdDate: datetime
    updatedDate: datetime

    @field_validator("date", "createdDate", "updatedDate")
    def ensure_utc(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    class Config:
        from_attributes = True


class MediaDimensions(BaseModel):
    """Dimensions of a media file."""

    width: int
    height: int


class ProcessedMediaFile(BaseModel):
    """Result of processing an uploaded media file (image or video)."""

    primary_url: str
    srcset: str  # For images: responsive srcset, for videos: empty string
    width: int
    height: int

    class Config:
        # Add example for API documentation
        schema_extra = {
            "example": {
                "primary_url": "/uploads/20241201_123456_abc123.webp",
                "srcset": "/uploads/20241201_123456_abc123_500.webp 500w, /uploads/20241201_123456_abc123_750.webp 750w, /uploads/20241201_123456_abc123.webp 1200w",
                "width": 1200,
                "height": 800,
            }
        }


class UploadResponse(BaseModel):
    """Response from the upload endpoint."""

    urls: List[str]
    srcsets: List[str]
    dimensions: List[MediaDimensions]

    class Config:
        schema_extra = {
            "example": {
                "urls": ["/uploads/20241201_123456_abc123.webp"],
                "srcsets": [
                    "/uploads/20241201_123456_abc123_500.webp 500w, /uploads/20241201_123456_abc123_750.webp 750w, /uploads/20241201_123456_abc123.webp 1200w"
                ],
                "dimensions": [{"width": 1200, "height": 800}],
            }
        }
