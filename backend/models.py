from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator

class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=10000)
    is_published: bool

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: str
    date: datetime

    class Config:
        from_attributes = True 