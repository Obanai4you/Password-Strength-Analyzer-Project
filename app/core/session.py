from starlette.middleware.sessions import SessionMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "password-analyzer-secret-key-2024")
SESSION_MAX_AGE = int(os.getenv("SESSION_MAX_AGE", 3600))


def setup_session_middleware(app):
    """
    Attaches session middleware to the FastAPI app.
    Sessions are cookie-based and signed with SECRET_KEY.
    """
    app.add_middleware(
        SessionMiddleware,
        secret_key=SECRET_KEY,
        max_age=SESSION_MAX_AGE,
        same_site="lax",
        https_only=False,   # Set True in production with HTTPS
    )