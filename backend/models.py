from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_validator


class StoryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=10000)
    is_published: bool


class StoryCreate(StoryBase):
    pass


class StoryResponse(StoryBase):
    id: str
    date: datetime

    @field_validator("date")
    def ensure_utc(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    class Config:
        from_attributes = True
