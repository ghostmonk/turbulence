from datetime import datetime
from typing import List
from pydantic import BaseModel


class VideoMetadata(BaseModel):
    """Video file metadata."""
    duration_seconds: float
    width: int
    height: int
    file_size: int
    content_type: str
    upload_time: datetime


class ThumbnailOption(BaseModel):
    """A thumbnail option for video."""
    id: str
    url: str
    timestamp_seconds: float
    is_custom: bool = False


class VideoProcessingJob(BaseModel):
    """Video processing job status."""
    job_id: str
    original_file: str
    status: str  # 'started', 'processing', 'completed', 'failed'
    created_at: datetime
    updated_at: datetime
    metadata: VideoMetadata
    thumbnail_options: List[ThumbnailOption] = []
    selected_thumbnail_id: str = ""
    processed_formats: List[str] = []
    error_message: str = ""
    
    class Config:
        schema_extra = {
            "example": {
                "job_id": "job_123456",
                "original_file": "uploads/video_20241201.mp4",
                "status": "processing",
                "metadata": {
                    "duration_seconds": 120.5,
                    "width": 1920,
                    "height": 1080,
                    "file_size": 15728640,
                    "content_type": "video/mp4"
                }
            }
        }


class VideoProcessingJobCreate(BaseModel):
    """Create a new video processing job."""
    original_file: str
    metadata: VideoMetadata


class VideoProcessingJobUpdate(BaseModel):
    """Update a video processing job."""
    status: str = None
    thumbnail_options: List[ThumbnailOption] = None
    selected_thumbnail_id: str = None
    processed_formats: List[str] = None
    error_message: str = None
