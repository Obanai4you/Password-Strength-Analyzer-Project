from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.core.security import verify_password, require_user_session, hash_password_sha256
from app.ml.password_classifier import classify_password

router = APIRouter(prefix="/user", tags=["User"])

# ─── Nepal Time Zone ──────────────────────────────────────────────────────────
NPT = timezone(timedelta(hours=5, minutes=45))

def now_npt():
    return datetime.now(NPT).replace(tzinfo=None)


# ─── Pydantic Models ──────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class AnalyseRequest(BaseModel):
    password: str


# ─── POST /user/login ─────────────────────────────────────────────────────────
@router.post("/login")
async def user_login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    from app.models.schemas import User

    user = db.query(User).filter(User.username == body.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    request.session["user_id"] = user.user_id
    request.session["username"] = user.username

    return {
        "message": "Login successful",
        "role": "user",
        "user_id": user.user_id,
        "username": user.username
    }


# ─── POST /user/logout ────────────────────────────────────────────────────────
@router.post("/logout")
async def user_logout(request: Request):
    request.session.clear()
    return {"message": "Logged out successfully"}


# ─── GET /user/me ─────────────────────────────────────────────────────────────
@router.get("/me")
async def get_current_user(
    request: Request,
    user_id: str = Depends(require_user_session),
    db: Session = Depends(get_db),
):
    from app.models.schemas import User

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "sn": user.sn,
        "user_id": user.user_id,
        "name": user.name,
        "username": user.username,
        "contact": user.contact,
    }


# ─── POST /user/analyse ───────────────────────────────────────────────────────
@router.post("/analyse")
async def analyse_password(
    request: Request,
    body: AnalyseRequest,
    user_id: str = Depends(require_user_session),
    db: Session = Depends(get_db),
):
    from app.models.schemas import PasswordAnalysis

    # Step 1: SHA-256 hash
    hashed = hash_password_sha256(body.password)

    # Step 2: ML classification
    result = classify_password(body.password)

    # Step 3: Save to DB with Nepal Time
    analysis = PasswordAnalysis(
        user_id=user_id,
        hash_password=hashed,
        strength=result["strength"],
        suggestion=result["suggestion"],
        analysed_at=now_npt()      # ← Nepal Time ✅
    )
    db.add(analysis)
    db.commit()

    return {
        "hash_password": hashed,
        "strength": result["strength"],
        "suggestion": result["suggestion"],
    }


# ─── GET /user/history ────────────────────────────────────────────────────────
@router.get("/history")
async def get_user_history(
    request: Request,
    user_id: str = Depends(require_user_session),
    db: Session = Depends(get_db),
):
    from app.models.schemas import PasswordAnalysis

    analyses = db.query(PasswordAnalysis).filter(
        PasswordAnalysis.user_id == user_id
    ).order_by(PasswordAnalysis.analysed_at.desc()).all()

    return [
        {
            "sn": a.sn,
            "hash_password": a.hash_password,
            "strength": a.strength,
            "suggestion": a.suggestion,
            "analysed_at": a.analysed_at.isoformat() if a.analysed_at else None,
        }
        for a in analyses
    ]