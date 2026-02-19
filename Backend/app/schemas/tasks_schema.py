from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

TaskStatus = Literal["todo", "in_progress", "completed"]


class TaskCreate(BaseModel):
    title: str = Field(default="Untitled task", max_length=200)
    note: Optional[str] = Field(default="")
    dueAt: Optional[datetime] = None
    status: TaskStatus = "todo"


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    note: Optional[str] = None
    dueAt: Optional[datetime] = None
    status: Optional[TaskStatus] = None


class TaskOut(BaseModel):
    id: str
    title: str
    note: Optional[str] = ""
    dueAt: Optional[datetime] = None
    status: TaskStatus
    createdAt: datetime
    updatedAt: datetime