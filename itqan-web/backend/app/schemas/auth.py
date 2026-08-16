from typing import Optional
from pydantic import BaseModel, Field

class UserRegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6)
    reference_qari_name: Optional[str] = "Mahmoud Khalil Al-Husary"

class UserLoginRequest(BaseModel):
    username_or_email: str
    password: str

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    reference_qari_name: Optional[str] = None
    target_daily_minutes: Optional[int] = Field(None, ge=1, le=120)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    full_name: str
    email: str
    reference_qari_name: str
    streak_days: int
    total_xp: int

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    reference_qari_name: str
    target_daily_minutes: int
    streak_days: int
    total_xp: int
    created_at: str
