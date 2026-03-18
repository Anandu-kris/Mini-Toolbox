from pydantic import BaseModel, EmailStr, Field


class UserSignup(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class MobileOtpRequest(BaseModel):
    mobileNumber: str = Field(min_length=8, max_length=20)


class MobileOtpVerify(BaseModel):
    mobileNumber: str = Field(min_length=8, max_length=20)
    otpCode: str = Field(min_length=4, max_length=10)


class TotpSetupResponse(BaseModel):
    secret: str
    otpauthUrl: str
    qrCodeDataUrl: str | None = None


class TotpVerifySetup(BaseModel):
    code: str = Field(min_length=6, max_length=6)


class TotpLoginVerify(BaseModel):
    code: str = Field(min_length=6, max_length=6)


class AuthActionResponse(BaseModel):
    message: str
    requiresMfa: bool = False
    email: str | None = None