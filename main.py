"""
main.py :Password Analyzer Backend
FastAPI + MySQL + Session Auth + SHA-256 + Random Forest
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine
from app.core.session import setup_session_middleware
from app.models.schemas import Base
from app.routes import admin, user
from app.ml.password_classifier import load_model


# ─── Create all tables in MySQL automatically ─────────────────────────────────
Base.metadata.create_all(bind=engine)


# ─── App instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Password Analyzer API",
    description="Backend for Password Strength Analyzer using SHA-256 + Random Forest",
    version="1.0.0",
)


#  Session Middleware 
setup_session_middleware(app)


#  CORS — allow Next.js frontend 
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


# Routers
app.include_router(admin.router)
app.include_router(user.router)


# Startup event — load ML model 
@app.on_event("startup")
async def startup_event():
    load_model()
    print("🚀 Password Analyzer Backend is ready!")


#Health check 
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "running",
        "message": "Password Analyzer API is live",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}