from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import KMDraft, RealityCheckRating, StumpTheMaster, OrganicSpark, OrganicSparkResponse, ExecutiveBroadcast, Guru, Notification, FeedPost

router = APIRouter(prefix="/km", tags=["km"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── KM Drafts ────────────────────────────────────────────────

@router.get("/drafts")
def list_drafts(db: Session = Depends(get_db)):
    drafts = db.query(KMDraft).order_by(KMDraft.created_at.desc()).all()
    result = []
    for d in drafts:
        ratings = db.query(RealityCheckRating).filter(RealityCheckRating.draft_id == d.id).all()
        guru_ratings = []
        for r in ratings:
            guru = db.query(Guru).filter(Guru.id == r.guru_id).first()
            guru_ratings.append({
                "guru_id": r.guru_id,
                "guru_name": guru.name if guru else "Unknown",
                "guru_initials": guru.avatar_initials if guru else "?",
                "guru_color": guru.avatar_color if guru else "#999",
                "rating": r.rating,
                "missing_link": r.missing_link,
                "created_at": r.created_at.isoformat(),
            })
        result.append({
            "id": d.id, "km_name": d.km_name, "domain": d.domain,
            "title": d.title, "content": d.content, "tags": d.tags,
            "agent_prompt": d.agent_prompt, "status": d.status,
            "avg_rating": d.avg_rating, "rating_count": d.rating_count,
            "created_at": d.created_at.isoformat(),
            "ratings": guru_ratings,
        })
    return result


class RatingIn(BaseModel):
    guru_id: int
    rating: int
    missing_link: str = ""


@router.post("/drafts/{draft_id}/rate")
def rate_draft(draft_id: int, body: RatingIn, db: Session = Depends(get_db)):
    draft = db.query(KMDraft).filter(KMDraft.id == draft_id).first()
    if not draft:
        return {"error": "Draft not found"}

    # Upsert rating
    existing = db.query(RealityCheckRating).filter(
        RealityCheckRating.draft_id == draft_id,
        RealityCheckRating.guru_id == body.guru_id).first()
    if existing:
        existing.rating = body.rating
        existing.missing_link = body.missing_link
    else:
        db.add(RealityCheckRating(draft_id=draft_id, guru_id=body.guru_id,
                                  rating=body.rating, missing_link=body.missing_link))
    db.flush()

    # Recalculate avg
    all_ratings = db.query(RealityCheckRating).filter(RealityCheckRating.draft_id == draft_id).all()
    draft.avg_rating = sum(r.rating for r in all_ratings) / len(all_ratings)
    draft.rating_count = len(all_ratings)

    # Update status
    has_correction = any(r.missing_link for r in all_ratings)
    if draft.avg_rating >= 2.5 and not has_correction:
        draft.status = "approved"
    elif has_correction or draft.avg_rating < 2.0:
        draft.status = "needs_revision"
    else:
        draft.status = "pending"

    # Update Guru contribution index
    guru = db.query(Guru).filter(Guru.id == body.guru_id).first()
    if guru:
        guru.reviews_completed = (guru.reviews_completed or 0) + (0 if existing else 1)
        guru.contribution_index = min(100, (guru.reviews_completed * 5) + (guru.escalation_saves * 8))

    # If escalated to MG (rating=2), set draft to mg_escalated and notify domain MGs
    notified_mgs = []
    if body.rating == 2:
        draft.status = "mg_escalated"
        domain_mgs = db.query(Guru).filter(
            Guru.domain == draft.domain, Guru.is_master_guru == True  # noqa
        ).all()
        for mg in domain_mgs:
            db.add(Notification(
                guru_id=mg.id, type="approval_needed",
                title=f"KM draft escalated to you for sign-off — {draft.domain}",
                message=f"'{draft.title}' was flagged by {guru.name if guru else 'a Guru'} and needs your expert review in MG Approvals. "
                        f"Feedback: {body.missing_link or 'Needs your sign-off before publishing.'}",
            ))
            notified_mgs.append({"id": mg.id, "name": mg.name,
                                  "initials": mg.avatar_initials, "color": mg.avatar_color})

    db.commit()
    return {
        "status": "rated",
        "new_avg": draft.avg_rating,
        "draft_status": draft.status,
        "notified_mgs": notified_mgs,
    }


class MGDraftDecision(BaseModel):
    mg_id: int
    action: str   # "approve" or "reject"
    notes: str = ""


@router.post("/drafts/{draft_id}/mg-decide")
def mg_decide_draft(draft_id: int, body: MGDraftDecision, db: Session = Depends(get_db)):
    draft = db.query(KMDraft).filter(KMDraft.id == draft_id).first()
    if not draft:
        return {"error": "Draft not found"}
    draft.status = "approved" if body.action == "approve" else "needs_revision"
    # Notify all gurus who rated this draft
    ratings = db.query(RealityCheckRating).filter(RealityCheckRating.draft_id == draft_id).all()
    mg = db.query(Guru).filter(Guru.id == body.mg_id).first()
    mg_name = mg.name if mg else "Master Guru"
    for r in ratings:
        db.add(Notification(
            guru_id=r.guru_id, type="impact",
            title=f"MG {'approved' if body.action == 'approve' else 'revised'} the draft you escalated",
            message=f"'{draft.title}' was {'approved and is now live' if body.action == 'approve' else 'sent back for revision'} by {mg_name}."
                    + (f" Notes: {body.notes}" if body.notes else ""),
        ))
    db.commit()
    return {"status": "decided", "draft_status": draft.status}


# ── Stump the Master ─────────────────────────────────────────

@router.get("/stump")
def list_stump(db: Session = Depends(get_db)):
    items = db.query(StumpTheMaster).order_by(StumpTheMaster.created_at.desc()).all()
    result = []
    for s in items:
        mg = db.query(Guru).filter(Guru.id == s.tagged_mg_id).first() if s.tagged_mg_id else None
        result.append({
            "id": s.id, "domain": s.domain, "query": s.query,
            "ai_attempt": s.ai_attempt, "km_draft": s.km_draft,
            "confidence_score": s.confidence_score, "failure_count": s.failure_count,
            "agent_prompt": s.agent_prompt, "status": s.status,
            "mg_correction": s.mg_correction,
            "tagged_mg": {"id": mg.id, "name": mg.name, "initials": mg.avatar_initials,
                          "color": mg.avatar_color} if mg else None,
            "resolved_at": s.resolved_at.isoformat() if s.resolved_at else None,
            "created_at": s.created_at.isoformat(),
        })
    return result


class CorrectionIn(BaseModel):
    mg_id: int
    correction: str


@router.post("/stump/{stump_id}/resolve")
def resolve_stump(stump_id: int, body: CorrectionIn, db: Session = Depends(get_db)):
    """Any Guru's sign-off goes directly to AI Guru corpus — no MG gate."""
    item = db.query(StumpTheMaster).filter(StumpTheMaster.id == stump_id).first()
    if not item:
        return {"error": "Not found"}
    item.status = "resolved"
    item.mg_correction = body.correction
    item.resolved_at = datetime.utcnow()

    guru = db.query(Guru).filter(Guru.id == body.mg_id).first()
    if guru:
        guru.escalation_saves = (guru.escalation_saves or 0) + 1
        guru.ai_guru_corrections = (guru.ai_guru_corrections or 0) + 1
        guru.contribution_index = min(100, (guru.reviews_completed * 5) + (guru.escalation_saves * 8))

    db.commit()
    return {"status": "resolved"}


# ── Organic Spark ────────────────────────────────────────────

@router.get("/spark")
def list_sparks(db: Session = Depends(get_db)):
    items = db.query(OrganicSpark).order_by(OrganicSpark.created_at.desc()).all()
    result = []
    for s in items:
        responses = []
        for r in db.query(OrganicSparkResponse).filter(
            OrganicSparkResponse.spark_id == s.id
        ).order_by(OrganicSparkResponse.created_at).all():
            g = db.query(Guru).filter(Guru.id == r.guru_id).first()
            responses.append({
                "id": r.id,
                "guru_id": r.guru_id,
                "guru_name": g.name if g else "Unknown",
                "guru_initials": g.avatar_initials if g else "?",
                "guru_color": g.avatar_color if g else "#999",
                "guru_title": g.title if g else "",
                "content": r.content,
                "created_at": r.created_at.isoformat(),
            })
        result.append({
            "id": s.id, "domain": s.domain, "signal": s.signal, "prompt": s.prompt,
            "source": s.source, "response_count": s.response_count,
            "created_at": s.created_at.isoformat(),
            "responses": responses,
        })
    return result


class SparkResponseIn(BaseModel):
    guru_id: int
    content: str = ""


@router.post("/spark/{spark_id}/respond")
def respond_to_spark(spark_id: int, body: SparkResponseIn, db: Session = Depends(get_db)):
    item = db.query(OrganicSpark).filter(OrganicSpark.id == spark_id).first()
    if not item:
        return {"status": "not_found"}

    if not body.content.strip():
        return {"status": "empty"}

    guru = db.query(Guru).filter(Guru.id == body.guru_id).first()

    # Store the response
    db.add(OrganicSparkResponse(
        spark_id=spark_id,
        guru_id=body.guru_id,
        content=body.content.strip(),
    ))
    item.response_count += 1

    # Update Guru contribution metrics
    if guru:
        guru.ai_guru_corrections = (guru.ai_guru_corrections or 0) + 1
        guru.contribution_index = min(100, (guru.reviews_completed * 5) + (guru.escalation_saves * 8) + (guru.ai_guru_corrections * 3))

    # Notify domain MGs so they can relay to KM for corpus update
    domain_mgs = db.query(Guru).filter(
        Guru.domain == item.domain, Guru.is_master_guru == True  # noqa
    ).all()
    guru_name = guru.name if guru else "A Guru"
    for mg in domain_mgs:
        db.add(Notification(
            guru_id=mg.id, type="corpus_response",
            title=f"Corpus Discussion response — {item.domain}",
            message=f"{guru_name} responded to a corpus gap in your domain:\n\n\"{body.content.strip()[:200]}\"\n\nReview and pass to your KM to improve the AI Guru corpus.",
        ))

    db.commit()
    return {"status": "recorded", "response_count": item.response_count}


# ── Executive Broadcasts ─────────────────────────────────────

class BroadcastSendIn(BaseModel):
    guru_id: int
    bu_head_name: str = "BU Head"


@router.post("/broadcasts/send")
def send_broadcast(body: BroadcastSendIn, db: Session = Depends(get_db)):
    guru = db.query(Guru).filter(Guru.id == body.guru_id).first()
    if not guru:
        return {"error": "Guru not found"}

    message = (
        f"{guru.name} ({guru.grade}, {guru.domain}) completed {guru.reviews_completed} KM reviews "
        f"this quarter, intercepted {guru.escalation_saves} AI Guru failures, and protected "
        f"{guru.learners_impacted:,} learners from incorrect information. "
        f"Contribution Index: {guru.contribution_index}/100 — top tier contributor."
    )

    broadcast = ExecutiveBroadcast(
        guru_id=guru.id,
        bu_head_name=body.bu_head_name,
        reviews_this_month=guru.reviews_completed,
        escalation_saves=guru.escalation_saves,
        learners_protected=guru.learners_impacted,
        message_preview=message[:400],
        status="sent",
        sent_at=datetime.utcnow(),
    )
    db.add(broadcast)

    db.add(Notification(
        guru_id=guru.id, type="broadcast_sent",
        title="Executive Broadcast sent to your BU Head",
        message=f"Your Q3 contributions have been reported to {body.bu_head_name}: "
                f"{guru.reviews_completed} reviews, {guru.escalation_saves} AI saves, "
                f"{guru.learners_impacted:,} learners protected.",
    ))

    db.commit()
    return {"status": "sent", "message_preview": message[:400]}


@router.get("/broadcasts")
def list_broadcasts(db: Session = Depends(get_db)):
    items = db.query(ExecutiveBroadcast).order_by(ExecutiveBroadcast.created_at.desc()).all()
    result = []
    for b in items:
        guru = db.query(Guru).filter(Guru.id == b.guru_id).first()
        result.append({
            "id": b.id, "bu_head_name": b.bu_head_name,
            "reviews_this_month": b.reviews_this_month,
            "escalation_saves": b.escalation_saves,
            "learners_protected": b.learners_protected,
            "message_preview": b.message_preview, "status": b.status,
            "sent_at": b.sent_at.isoformat() if b.sent_at else None,
            "created_at": b.created_at.isoformat(),
            "guru": {"id": guru.id, "name": guru.name, "initials": guru.avatar_initials,
                     "color": guru.avatar_color, "title": guru.title,
                     "contribution_index": guru.contribution_index,
                     "reviews_completed": guru.reviews_completed} if guru else None,
        })
    return result


@router.get("/guru-stats")
def guru_stats(db: Session = Depends(get_db)):
    gurus = db.query(Guru).all()
    BROADCAST_THRESHOLD = 3
    result = []
    for g in gurus:
        reviews = g.reviews_completed or 0
        saves = g.escalation_saves or 0
        broadcast_sent = db.query(ExecutiveBroadcast).filter(
            ExecutiveBroadcast.guru_id == g.id,
            ExecutiveBroadcast.status == "sent").count()
        result.append({
            "id": g.id, "name": g.name, "title": g.title, "grade": g.grade,
            "domain": g.domain, "is_master_guru": g.is_master_guru,
            "initials": g.avatar_initials, "color": g.avatar_color,
            "reviews_completed": reviews,
            "review_turnaround_hrs": g.review_turnaround_hrs or 0,
            "escalation_saves": saves,
            "contribution_index": g.contribution_index or 0,
            "narrative": g.narrative or "",
            "reviews_to_broadcast": max(0, BROADCAST_THRESHOLD - (reviews % BROADCAST_THRESHOLD)),
            "broadcast_count": broadcast_sent,
            "learners_impacted": g.learners_impacted or 0,
        })
    return sorted(result, key=lambda x: x["contribution_index"], reverse=True)
