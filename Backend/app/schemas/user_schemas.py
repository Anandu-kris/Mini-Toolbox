from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    id: str
    name: str | None = None
    email: EmailStr | None = None
    mobileNumber: str | None = None
    isEmailVerified: bool = False
    isMobileVerified: bool = False
    mfaEnabled: bool = False
    avatarUrl: str | None = None


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    email: Optional[EmailStr] = None


class UserPasswordUpdate(BaseModel):
    currentPassword: str = Field(min_length=6, max_length=128)
    newPassword: str = Field(min_length=8, max_length=128)