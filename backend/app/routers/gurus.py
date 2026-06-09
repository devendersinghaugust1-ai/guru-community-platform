from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.database import get_db
from app.models import Guru, FeedPost, Notification

router = APIRouter(prefix="/gurus", tags=["gurus"])


class GuruProfile(BaseModel):
    id: int; name: str; title: str; grade: str; domain: str
    experience_years: int; certifications: str; avatar_initials: str
    avatar_color: str; is_master_guru: bool; use_cases_shared: int
    learners_impacted: int; ai_guru_corrections: int; domain_rank: int
    class Config: from_attributes = True


@router.get("/", response_model=list[GuruProfile])
def list_gurus(db: Session = Depends(get_db)):
    return db.query(Guru).order_by(Guru.learners_impacted.desc()).all()


@router.get("/{guru_id}", response_model=GuruProfile)
def get_guru(guru_id: int, db: Session = Depends(get_db)):
    guru = db.query(Guru).filter(Guru.id == guru_id).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Guru not found")
    return guru


@router.get("/{guru_id}/stats")
def get_guru_stats(guru_id: int, db: Session = Depends(get_db)):
    guru = db.query(Guru).filter(Guru.id == guru_id).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Guru not found")
    return {
        "guru_id": guru_id,
        "total_posts": db.query(func.count(FeedPost.id)).filter(FeedPost.guru_id == guru_id).scalar(),
        "unread_notifications": db.query(func.count(Notification.id)).filter(Notification.guru_id == guru_id, Notification.is_read == False).scalar(),  # noqa
        "use_cases_shared": guru.use_cases_shared,
        "learners_impacted": guru.learners_impacted,
        "ai_guru_corrections": guru.ai_guru_corrections,
        "domain_rank": guru.domain_rank,
    }
