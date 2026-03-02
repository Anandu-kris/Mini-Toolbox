from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    name: str | None = None
    email: EmailStr
    avatarUrl: str | None = None 
    
class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    email: Optional[EmailStr] = None


class UserPasswordUpdate(BaseModel):
    currentPassword: str = Field(min_length=6, max_length=128)
    newPassword: str = Field(min_length=8, max_length=128)