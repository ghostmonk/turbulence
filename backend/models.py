from datetime import datetime

from pydantic import BaseModel, Field


class StoryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=10000)
    is_published: bool


class StoryCreate(StoryBase):
    pass


class StoryResponse(StoryBase):
    id: str
    date: datetime

    class Config:
        from_attributes = True
