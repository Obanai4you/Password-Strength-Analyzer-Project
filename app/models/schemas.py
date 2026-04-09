from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


# ─── Users Table ─────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    sn = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    contact = Column(String(20), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to password_analysis
    analyses = relationship("PasswordAnalysis", back_populates="user", cascade="all, delete")


# ─── Password Analysis Table ──────────────────────────────────────────────────
class PasswordAnalysis(Base):
    __tablename__ = "password_analysis"

    sn = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(10), ForeignKey("users.user_id"), nullable=False)
    hash_password = Column(String(64), nullable=False)
    strength = Column(String(10), nullable=False)
    suggestion = Column(Text, nullable=False)
    analysed_at = Column(DateTime, default=datetime.utcnow)

    # Relationship back to user
    user = relationship("User", back_populates="analyses")