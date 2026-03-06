from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any

class VaultKdfParams(BaseModel):
    timeCost: int = Field(ge=1, le=10)
    memoryCost: int = Field(ge=8192, le=1048576)  
    parallelism: int = Field(ge=1, le=8)
    hashLen: int = Field(ge=16, le=64)

class VaultSetupRequest(BaseModel):
    kdf: Literal["argon2id"]
    kdfParams: VaultKdfParams
    salt: str  # base64
    encryptedVaultKey: str  # base64 (AES-GCM wrapped vault key)
    vaultKeyIv: str  # base64
    vaultKeyAlg: Optional[str] = "A256GCM"
    version: int = 1

class VaultMetaOut(BaseModel):
    kdf: Literal["argon2id"]
    kdfParams: VaultKdfParams
    salt: str
    encryptedVaultKey: str
    vaultKeyIv: str
    vaultKeyAlg: Optional[str] = "A256GCM"
    version: int
    createdAt: str
    updatedAt: str
    
class VaultMetaPatch(BaseModel):
    kdf: Literal["argon2id"] = "argon2id"
    kdfParams: VaultKdfParams
    salt: str
    encryptedVaultKey: str
    vaultKeyIv: str
    vaultKeyAlg: Literal["A256GCM"] = "A256GCM"
    expectedVersion: Optional[int] = Field(default=None, ge=1)
