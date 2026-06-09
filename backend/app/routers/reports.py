from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Guru, FeedPost, PipelineCandidate
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/bu-report")
def get_bu_report(db: Session = Depends(get_db)):
    all_gurus = db.query(Guru).order_by(Guru.learners_impacted.desc()).all()
    domains: dict = {}
    for g in all_gurus:
        if g.domain not in domains:
            domains[g.domain] = []
        if len(domains[g.domain]) < 5:
            domains[g.domain].append({"name": g.name, "grade": g.grade, "title": g.title,
                "is_master_guru": g.is_master_guru, "use_cases_shared": g.use_cases_shared,
                "learners_impacted": g.learners_impacted, "ai_guru_corrections": g.ai_guru_corrections})

    pipeline = db.query(PipelineCandidate).all()
    total_posts = db.query(func.count(FeedPost.id)).scalar()
    return {
        "generated_at": datetime.utcnow(), "quarter": "Q2 2026",
        "summary": {
            "total_active_gurus": len([g for g in all_gurus if g.use_cases_shared > 0]),
            "total_gurus": len(all_gurus),
            "total_learners_impacted": sum(g.learners_impacted for g in all_gurus),
            "total_use_cases_contributed": sum(g.use_cases_shared for g in all_gurus),
            "ai_guru_improvements": sum(g.ai_guru_corrections for g in all_gurus),
            "new_gurus_onboarded": len([p for p in pipeline if p.status == "joined"]),
            "pipeline_candidates_identified": len(pipeline),
            "total_feed_posts": total_posts,
        },
        "top_gurus_by_domain": domains,
        "pipeline": {"identified": len([p for p in pipeline if p.status == "identified"]),
                     "outreach_sent": len([p for p in pipeline if p.status == "outreach_sent"]),
                     "joined": len([p for p in pipeline if p.status == "joined"])},
        "domain_health": [{"domain": d, "guru_count": len(gs), "top_guru": gs[0]["name"] if gs else None} for d, gs in domains.items()],
    }
