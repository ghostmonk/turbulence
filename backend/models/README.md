    # Models Package Organization

This package contains all Pydantic models organized by domain for better maintainability.

## Structure

```
models/
├── __init__.py          # Re-exports all models for easy importing
├── story.py             # Story-related models
├── upload.py            # Upload and media models  
├── video.py             # Video processing models
└── README.md           # This file
```

## Models by Domain

### Story Models (`story.py`)
- `StoryBase` - Base story data model
- `StoryCreate` - For creating new stories
- `StoryResponse` - API response format

### Upload Models (`upload.py`)
- `MediaDimensions` - Width/height for media files
- `ProcessedMediaFile` - Result of media processing
- `UploadResponse` - Upload endpoint response

### Video Models (`video.py`)
- `VideoMetadata` - Video file metadata
- `ThumbnailOption` - Thumbnail choice with timestamp
- `VideoProcessingJob` - Job status and tracking
- `VideoProcessingJobCreate` - Create new processing job
- `VideoProcessingJobUpdate` - Update job status

## Usage

Import models directly from their specific domain modules:

```python
# Import from specific model files
from models.story import StoryCreate, StoryResponse
from models.upload import MediaDimensions, ProcessedMediaFile, UploadResponse
from models.video import VideoMetadata, VideoProcessingJob, ThumbnailOption

# This promotes better dependency management and clarity
```

## Benefits

1. **Organization** - Related models grouped together
2. **Maintainability** - Easier to find and update specific models
3. **Scalability** - Easy to add new domains without cluttering
4. **Clarity** - Clear separation of concerns and explicit imports
5. **Dependency Management** - Only import what you need from specific modules

## Adding New Models

1. **Create new domain file** (e.g., `models/user.py`)
2. **Add models to the new file**
3. **Import directly from the new module in your handlers**

Example for new user models:

```python
# models/user.py
from pydantic import BaseModel

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

# handlers/users.py  
from models.user import UserCreate, UserBase
```

No need to update `__init__.py` - just import what you need directly!
