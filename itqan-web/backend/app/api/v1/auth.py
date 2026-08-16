import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_current_user,
)
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserUpdateRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegisterRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if email or username already exists
        cursor.execute("SELECT id FROM users WHERE email = ? OR username = ?", (req.email.lower(), req.username.lower()))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email or username already exists."
            )
        
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        hashed_pwd = hash_password(req.password)
        now = datetime.utcnow().isoformat()
        
        cursor.execute("""
            INSERT INTO users (id, email, username, full_name, hashed_password, reference_qari_name, target_daily_minutes, streak_days, last_active_date, total_xp, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 15, 1, ?, 50, ?, ?)
        """, (user_id, req.email.lower(), req.username.lower(), req.full_name, hashed_pwd, req.reference_qari_name or "Mahmoud Khalil Al-Husary", now[:10], now, now))
        
        # Add signup bonus daily activity
        cursor.execute("""
            INSERT INTO daily_activity (id, user_id, activity_date, minutes_practiced, ayahs_recited, xp_earned)
            VALUES (?, ?, ?, 5, 1, 50)
        """, (f"act_{uuid.uuid4().hex[:12]}", user_id, now[:10]))
        
        token = create_access_token({"sub": user_id, "username": req.username.lower()})
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user_id,
            "username": req.username.lower(),
            "full_name": req.full_name,
            "email": req.email.lower(),
            "reference_qari_name": req.reference_qari_name or "Mahmoud Khalil Al-Husary",
            "streak_days": 1,
            "total_xp": 50,
        }

@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest):
    identifier = req.username_or_email.lower().strip()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ? OR username = ?", (identifier, identifier))
        row = cursor.fetchone()
        
        if not row or not verify_password(req.password, row["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password."
            )
        
        user = dict(row)
        now = datetime.utcnow().isoformat()
        today = now[:10]
        
        # Calculate streak update
        streak = user["streak_days"]
        last_active = user.get("last_active_date")
        if last_active != today:
            # If active yesterday, streak+1; otherwise reset to 1
            cursor.execute("UPDATE users SET last_active_date = ?, updated_at = ? WHERE id = ?", (today, now, user["id"]))
        
        token = create_access_token({"sub": user["id"], "username": user["username"]})
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "email": user["email"],
            "reference_qari_name": user["reference_qari_name"],
            "streak_days": streak,
            "total_xp": user["total_xp"],
        }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: dict = Depends(require_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "full_name": user["full_name"],
        "reference_qari_name": user["reference_qari_name"],
        "target_daily_minutes": user["target_daily_minutes"],
        "streak_days": user["streak_days"],
        "total_xp": user["total_xp"],
        "created_at": user["created_at"],
    }

@router.put("/me", response_model=UserResponse)
def update_current_user_profile(req: UserUpdateRequest, user: dict = Depends(require_current_user)):
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()
        
        full_name = req.full_name if req.full_name is not None else user["full_name"]
        ref_qari = req.reference_qari_name if req.reference_qari_name is not None else user["reference_qari_name"]
        target_mins = req.target_daily_minutes if req.target_daily_minutes is not None else user["target_daily_minutes"]
        
        cursor.execute("""
            UPDATE users
            SET full_name = ?, reference_qari_name = ?, target_daily_minutes = ?, updated_at = ?
            WHERE id = ?
        """, (full_name, ref_qari, target_mins, now, user["id"]))
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (user["id"],))
        updated_row = dict(cursor.fetchone())
        
        return {
            "id": updated_row["id"],
            "email": updated_row["email"],
            "username": updated_row["username"],
            "full_name": updated_row["full_name"],
            "reference_qari_name": updated_row["reference_qari_name"],
            "target_daily_minutes": updated_row["target_daily_minutes"],
            "streak_days": updated_row["streak_days"],
            "total_xp": updated_row["total_xp"],
            "created_at": updated_row["created_at"],
        }
