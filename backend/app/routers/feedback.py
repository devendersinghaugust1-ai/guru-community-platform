from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import PlatformFeedback

router = APIRouter(prefix="/feedback", tags=["feedback"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class FeedbackIn(BaseModel):
    submitter_name: str
    submitter_role: str
    issue_type: str
    description: str


@router.post("/")
def submit_feedback(body: FeedbackIn, db: Session = Depends(get_db)):
    item = PlatformFeedback(
        submitter_name=body.submitter_name.strip(),
        submitter_role=body.submitter_role,
        issue_type=body.issue_type,
        description=body.description.strip(),
        status="open",
        created_at=datetime.utcnow(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "status": "submitted"}


@router.get("/")
def list_feedback(db: Session = Depends(get_db)):
    items = db.query(PlatformFeedback).order_by(PlatformFeedback.created_at.desc()).all()
    return [
        {
            "id": i.id,
            "submitter_name": i.submitter_name,
            "submitter_role": i.submitter_role,
            "issue_type": i.issue_type,
            "description": i.description,
            "status": i.status,
            "created_at": i.created_at.isoformat(),
        }
        for i in items
    ]


@router.patch("/{feedback_id}/acknowledge")
def acknowledge(feedback_id: int, db: Session = Depends(get_db)):
    item = db.query(PlatformFeedback).filter(PlatformFeedback.id == feedback_id).first()
    if item:
        item.status = "acknowledged"
        db.commit()
    return {"status": "acknowledged"}
