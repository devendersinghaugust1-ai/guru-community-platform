import os
import smtplib
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import PlatformFeedback

router = APIRouter(prefix="/feedback", tags=["feedback"])
logger = logging.getLogger(__name__)

NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", "devender.singh@genpact.com")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")


def _send_feedback_email(item: dict):
    """Send email alert when new feedback is submitted. Requires SMTP env vars to be set."""
    if not SMTP_USER or not SMTP_PASS:
        logger.info("Email not configured (SMTP_USER/SMTP_PASS not set) — skipping notification")
        return
    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = NOTIFY_EMAIL
        msg["Subject"] = f"[Guru Platform] New {item['issue_type']} from {item['submitter_name']} ({item['submitter_role']})"
        body = (
            f"New platform feedback received on the Guru Community Platform.\n\n"
            f"From: {item['submitter_name']} ({item['submitter_role']})\n"
            f"Type: {item['issue_type']}\n"
            f"Status: Open\n\n"
            f"Description:\n{item['description']}\n\n"
            f"---\nGuru Community Platform"
        )
        msg.attach(MIMEText(body, "plain"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        logger.info(f"Feedback email sent to {NOTIFY_EMAIL}")
    except Exception as e:
        logger.warning(f"Failed to send feedback email: {e}")


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
    _send_feedback_email({
        "submitter_name": item.submitter_name,
        "submitter_role": item.submitter_role,
        "issue_type": item.issue_type,
        "description": item.description,
    })
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
