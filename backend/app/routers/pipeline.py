from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import PipelineCandidate

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


class OutreachApproval(BaseModel):
    approved: bool; modified_draft: str = ""


@router.get("/candidates")
def get_candidates(db: Session = Depends(get_db)):
    candidates = db.query(PipelineCandidate).order_by(PipelineCandidate.signal_score.desc()).all()
    return [{"id": c.id, "name": c.name, "title": c.title, "grade": c.grade, "domain": c.domain,
             "business_unit": c.business_unit, "signal_score": c.signal_score, "signals": c.signals,
             "outreach_draft": c.outreach_draft, "status": c.status, "identified_at": c.identified_at} for c in candidates]


@router.post("/candidates/{candidate_id}/send-outreach")
def send_outreach(candidate_id: int, data: OutreachApproval, db: Session = Depends(get_db)):
    if data.approved:
        c = db.query(PipelineCandidate).filter(PipelineCandidate.id == candidate_id).first()
        if c:
            c.status = "outreach_sent"; db.commit()
        return {"status": "outreach_sent", "message": "Outreach email sent via MGG team"}
    return {"status": "skipped"}


@router.get("/stats")
def pipeline_stats(db: Session = Depends(get_db)):
    all_c = db.query(PipelineCandidate).all()
    return {"total_identified": len(all_c), "outreach_sent": len([c for c in all_c if c.status == "outreach_sent"]),
            "joined": len([c for c in all_c if c.status == "joined"]), "pending": len([c for c in all_c if c.status == "identified"])}
