from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional,List

class NoteCreate(BaseModel):
  title: Optional[str] = Field(min_length=1, max_length=120)
  contentHtml: Optional[str] = Field(default="", max_length=20000)
  tags: Optional[List[str]] = Field(default_factory=list)
  pinned: Optional[bool] = False
  
class NoteUpdate(BaseModel):
  title: Optional[str] = Field(default=None, min_length=1, max_length=120)
  contentHtml: Optional[str] = Field(default=None, max_length=20000)
  tags: Optional[List[str]] = None
  pinned: Optional[bool] = None
  isTrashed: Optional[bool] = None

class NoteOut(BaseModel):
  id: str
  title: str
  contentHtml: str
  contentText: str
  tags: List[str]
  pinned: bool
  isTrashed: bool
  createdAt: datetime
  updatedAt: datetime