from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/{guru_id}")
def get_notifications(guru_id: int, db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.guru_id == guru_id).order_by(Notification.created_at.desc()).limit(20).all()
    return [{"id": n.id, "type": n.type, "title": n.title, "message": n.message, "is_read": n.is_read, "created_at": n.created_at} for n in notifs]


@router.post("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if n:
        n.is_read = True; db.commit()
    return {"status": "ok"}


@router.post("/guru/{guru_id}/read-all")
def mark_all_read(guru_id: int, db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.guru_id == guru_id).update({"is_read": True})
    db.commit()
    return {"status": "ok"}
