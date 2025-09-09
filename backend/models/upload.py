from typing import List

from pydantic import BaseModel


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
