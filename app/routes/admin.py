from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.core.security import hash_password_sha256, require_admin_session, verify_password
import os
from dotenv import load_dotenv

load_dotenv()

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

# ─── Nepal Time Zone ──────────────────────────────────────────────────────────
NPT = timezone(timedelta(hours=5, minutes=45))

def now_npt():
    return datetime.now(NPT).replace(tzinfo=None)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Pydantic Models ──────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class CreateUserRequest(BaseModel):
    name: str
    contact: str
    username: str
    password: str


# ─── Helper: Auto generate USR001, USR002 format ─────────────────────────────
def generate_user_id(db) -> str:
    from app.models.schemas import User
    last_user = db.query(User).order_by(User.sn.desc()).first()
    if not last_user:
        return "USR001"
    last_number = int(last_user.user_id.replace("USR", ""))
    new_number = last_number + 1
    return f"USR{new_number:03d}"


# ─── POST /admin/login ────────────────────────────────────────────────────────
@router.post("/login")
async def admin_login(request: Request, body: LoginRequest):
    if body.username != ADMIN_USERNAME or body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    request.session["admin_logged_in"] = True
    request.session["admin_username"] = body.username

    return {
        "message": "Admin login successful",
        "role": "admin",
        "username": body.username
    }


# ─── POST /admin/logout ───────────────────────────────────────────────────────
@router.post("/logout")
async def admin_logout(request: Request):
    request.session.clear()
    return {"message": "Logged out successfully"}


# ─── POST /admin/create-user ──────────────────────────────────────────────────
@router.post("/create-user")
async def create_user(
    request: Request,
    body: CreateUserRequest,
    admin: str = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    from app.models.schemas import User

    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    user_id = generate_user_id(db)
    hashed_pw = hash_password_sha256(body.password)

    new_user = User(
        user_id=user_id,
        name=body.name,
        contact=body.contact,
        username=body.username,
        password=hashed_pw,
        created_at=now_npt()       # ← Nepal Time ✅
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "sn": new_user.sn,
        "user_id": new_user.user_id,
        "name": new_user.name,
        "contact": new_user.contact,
        "username": new_user.username,
    }


# ─── GET /admin/users ─────────────────────────────────────────────────────────
@router.get("/users")
async def get_all_users(
    request: Request,
    admin: str = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    from app.models.schemas import User, PasswordAnalysis

    users = db.query(User).all()
    result = []

    for user in users:
        analyses = db.query(PasswordAnalysis).filter(
            PasswordAnalysis.user_id == user.user_id
        ).order_by(PasswordAnalysis.analysed_at.desc()).all()

        latest = analyses[0] if analyses else None

        result.append({
            "sn": user.sn,
            "user_id": user.user_id,
            "name": user.name,
            "username": user.username,
            "contact": user.contact,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "latest_hash": latest.hash_password if latest else None,
            "latest_strength": latest.strength if latest else None,
            "latest_suggestion": latest.suggestion if latest else None,
            "latest_analysed_at": latest.analysed_at.isoformat() if latest and latest.analysed_at else None,
        })

    return result


# ─── GET /admin/analytics ─────────────────────────────────────────────────────
@router.get("/analytics")
async def get_analytics(
    request: Request,
    admin: str = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    from app.models.schemas import PasswordAnalysis, User
    from sqlalchemy import func

    strength_counts = db.query(
        PasswordAnalysis.strength,
        func.count(PasswordAnalysis.strength)
    ).group_by(PasswordAnalysis.strength).all()

    distribution = {"weak": 0, "medium": 0, "strong": 0}
    for strength, count in strength_counts:
        if strength in distribution:
            distribution[strength] = count

    total = sum(distribution.values())

    top_users_query = db.query(
        PasswordAnalysis.user_id,
        func.count(PasswordAnalysis.user_id).label("count")
    ).group_by(PasswordAnalysis.user_id).order_by(
        func.count(PasswordAnalysis.user_id).desc()
    ).limit(5).all()

    top_users = []
    for user_id, count in top_users_query:
        user = db.query(User).filter(User.user_id == user_id).first()
        top_users.append({
            "username": user.username if user else f"user_{user_id}",
            "user_id": user_id,
            "count": count
        })

    return {
        "strength_distribution": {
            "weak": distribution["weak"],
            "medium": distribution["medium"],
            "strong": distribution["strong"],
            "total": total
        },
        "top_users": top_users
    }


# ─── DELETE /admin/users/{user_id} ───────────────────────────────────────────
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    request: Request,
    admin: str = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    from app.models.schemas import User

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": f"User {user_id} deleted successfully"}


# ─── POST /admin/auth/login (Combined login for both admin and user) ──────────
@router.post("/auth/login")
async def combined_login(
    request: Request,
    body: LoginRequest,
    db: Session = Depends(get_db)
):
    from app.models.schemas import User

    # Check if admin
    if body.username == ADMIN_USERNAME and body.password == ADMIN_PASSWORD:
        request.session["admin_logged_in"] = True
        request.session["admin_username"] = body.username
        return {
            "message": "Login successful",
            "role": "admin",
            "username": body.username
        }

    # Check if user exists in database
    user = db.query(User).filter(User.username == body.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Verify password
    if not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Store user session
    request.session["user_id"] = user.user_id
    request.session["username"] = user.username

    return {
        "message": "Login successful",
        "role": "user",
        "user_id": user.user_id,
        "username": user.username
    }