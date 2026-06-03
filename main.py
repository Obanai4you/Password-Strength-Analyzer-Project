"""
main.py — Password Analyzer Backend
FastAPI + MySQL + Session Auth + SHA-256 + Random Forest
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import engine
from app.core.session import setup_session_middleware
from app.models.schemas import Base
from app.routes import admin, user
from app.ml.password_classifier import load_model


# ─── Create all tables in MySQL automatically ─────────────────────────────────
Base.metadata.create_all(bind=engine)


# ─── Lifespan (replaces deprecated @app.on_event) ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_model()
    print("🚀 Password Analyzer Backend is ready!")
    yield
    # Shutdown (nothing needed)


# ─── App instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Password Analyzer API",
    description="Backend for Password Strength Analyzer using SHA-256 + Random Forest",
    version="1.0.0",
    lifespan=lifespan,
)


# ─── Session Middleware ───────────────────────────────────────────────────────
setup_session_middleware(app)


# ─── CORS — allow Next.js frontend ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(admin.router)
app.include_router(user.router)


# ─── Root ─────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "running",
        "message": "Password Analyzer API is live",
        "docs": "/docs"
    }


# ─── Health Check with DB + Model status ─────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    from sqlalchemy import text

    # Check database connection
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected ✅"
    except Exception as e:
        db_status = f"disconnected ❌ ({str(e)})"

    # Check ML model
    try:
        from app.ml.password_classifier import _model
        model_status = "loaded ✅" if _model is not None else "not loaded ❌"
    except:
        model_status = "not loaded ❌"

    # Check tables exist
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT COUNT(*) FROM users"))
            conn.execute(text("SELECT COUNT(*) FROM password_analysis"))
        tables_status = "users + password_analysis ✅"
    except Exception as e:
        tables_status = f"error ❌ ({str(e)})"

    return {
        "status": "ok",
        "database": db_status,
        "tables": tables_status,
        "ml_model": model_status,
        "version": "1.0.0"
    }