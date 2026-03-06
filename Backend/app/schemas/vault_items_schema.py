from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VaultItemBase(BaseModel):
    name: str = Field(..., min_length=1)
    username: Optional[str] = None
    url: Optional[str] = None
    folder: Optional[str] = None
    favorite: Optional[bool] = False


class VaultItemCreate(VaultItemBase):
    ciphertext: str
    iv: str


class VaultItemUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    url: Optional[str] = None
    folder: Optional[str] = None
    favorite: Optional[bool] = None
    ciphertext: Optional[str] = None
    iv: Optional[str] = None


class VaultItemOut(VaultItemBase):
    id: str
    ciphertext: str
    iv: str
    createdAt: datetime
    updatedAt: datetime