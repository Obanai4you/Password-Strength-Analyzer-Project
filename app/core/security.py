import hashlib
from fastapi import Request, HTTPException


def hash_password_sha256(plain_password: str) -> str:
    """
    Hash a plain-text password using SHA-256.
    Returns the hex digest string.
    """
    return hashlib.sha256(plain_password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a stored SHA-256 hash.
    """
    return hash_password_sha256(plain_password) == hashed_password


# ─── Session dependency helpers ───────────────────────────────────────────────

def require_admin_session(request: Request):
    """
    Dependency: raises 401 if request does not carry a valid admin session.
    """
    if not request.session.get("admin_logged_in"):
        raise HTTPException(status_code=401, detail="Admin not authenticated")
    return request.session.get("admin_username")


def require_user_session(request: Request):
    """
    Dependency: raises 401 if request does not carry a valid user session.
    Returns the user_id stored in session.
    """
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return user_id