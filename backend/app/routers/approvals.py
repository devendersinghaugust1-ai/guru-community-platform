"""MG Approval Queue API — HITL approval workflow for Guru use cases."""
import uuid, json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import ApprovalQueue, FeedPost, Guru, Notification, KMDraft, RealityCheckRating, StumpTheMaster
from app.agents import hitl_workflow

router = APIRouter(prefix="/approvals", tags=["approvals"])


class SubmitUseCaseRequest(BaseModel):
    guru_id: int; domain: str; raw_text: str; post_type: str = "use_case"

class MGDecision(BaseModel):
    action: str; mg_id: int
    edited_content: Optional[str] = None; edited_title: Optional[str] = None; notes: Optional[str] = ""


@router.post("/submit")
def submit_use_case(data: SubmitUseCaseRequest, db: Session = Depends(get_db)):
    guru = db.query(Guru).filter(Guru.id == data.guru_id).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Guru not found")

    thread_id = str(uuid.uuid4())
    result = hitl_workflow.start_workflow_sync(
        guru_id=data.guru_id, guru_name=guru.name,
        domain=data.domain, raw_text=data.raw_text,
    )
    routing = result.get("routing", "mg_review")

    entry = ApprovalQueue(
        thread_id=thread_id, guru_id=data.guru_id, domain=data.domain,
        draft_title=result.get("draft_title", ""),
        draft_content=result.get("draft_content", ""),
        draft_tags=",".join(result.get("draft_tags", [])),
        quality_score=result.get("quality_score", 0.0),
        quality_signals=json.dumps(result.get("quality_signals", {})),
        quality_flags=json.dumps(result.get("quality_flags", [])),
        estimated_reach=result.get("estimated_reach", 0),
        corpus_entry=result.get("corpus_entry", ""),
        status="auto_approved" if routing == "fast_lane" else ("rejected" if routing == "rejected" else "pending"),
    )
    db.add(entry)

    if routing == "fast_lane":
        post = FeedPost(guru_id=data.guru_id, post_type="use_case",
                        title=result["draft_title"], content=result["draft_content"],
                        domain=data.domain, tags=",".join(result.get("draft_tags", [])), agent_generated=True)
        db.add(post)
        guru.use_cases_shared += 1
        guru.learners_impacted += result.get("estimated_reach", 0)
        db.add(Notification(guru_id=data.guru_id, type="impact",
                            title="Your use case is live (fast-tracked)",
                            message=f"'{result['draft_title']}' scored {result['quality_score']:.0%} — auto-approved. Estimated reach: {result.get('estimated_reach', 0)} learners."))

    if routing == "mg_review":
        for mg in db.query(Guru).filter(Guru.domain == data.domain, Guru.is_master_guru == True).all():  # noqa
            db.add(Notification(guru_id=mg.id, type="approval_needed",
                                title="Use case awaiting your review",
                                message=f"{guru.name} submitted '{result.get('draft_title', '')}' (quality: {result.get('quality_score', 0):.0%}). Review in under 90 seconds."))

    if routing == "rejected":
        db.add(Notification(guru_id=data.guru_id, type="rejection",
                            title="Use case needs revision",
                            message=f"Draft scored {result.get('quality_score', 0):.0%}. Fix: {'; '.join(result.get('quality_flags', []))}. Revise and resubmit."))

    db.commit()
    return {"thread_id": thread_id, "routing": routing,
            "quality_score": result.get("quality_score"),
            "quality_flags": result.get("quality_flags", []),
            "draft_title": result.get("draft_title")}


@router.get("/queue")
def get_approval_queue(domain: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ApprovalQueue).filter(ApprovalQueue.status == "pending").order_by(ApprovalQueue.created_at)
    if domain:
        query = query.filter(ApprovalQueue.domain == domain)
    items = query.all()
    out = []
    for item in items:
        guru = db.query(Guru).filter(Guru.id == item.guru_id).first()
        out.append({"id": item.id, "thread_id": item.thread_id,
                    "guru_name": guru.name if guru else "Unknown",
                    "guru_grade": guru.grade if guru else "",
                    "guru_avatar": guru.avatar_initials if guru else "?",
                    "guru_color": guru.avatar_color if guru else "#666",
                    "domain": item.domain, "draft_title": item.draft_title,
                    "draft_content": item.draft_content,
                    "draft_tags": item.draft_tags.split(",") if item.draft_tags else [],
                    "quality_score": item.quality_score,
                    "quality_signals": json.loads(item.quality_signals) if item.quality_signals else {},
                    "quality_flags": json.loads(item.quality_flags) if item.quality_flags else [],
                    "estimated_reach": item.estimated_reach,
                    "corpus_entry": item.corpus_entry, "created_at": item.created_at})
    return out


@router.post("/{thread_id}/decide")
def mg_decide(thread_id: str, decision: MGDecision, db: Session = Depends(get_db)):
    item = db.query(ApprovalQueue).filter(ApprovalQueue.thread_id == thread_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if item.status != "pending":
        raise HTTPException(status_code=400, detail=f"Already decided: {item.status}")

    item.status = decision.action
    item.mg_id = decision.mg_id
    item.mg_notes = decision.notes or ""
    item.decided_at = datetime.utcnow()

    if decision.action in ("approve", "edit"):
        guru = db.query(Guru).filter(Guru.id == item.guru_id).first()
        post = FeedPost(guru_id=item.guru_id, post_type="use_case",
                        title=decision.edited_title or item.draft_title,
                        content=decision.edited_content or item.draft_content,
                        domain=item.domain, tags=item.draft_tags, agent_generated=True)
        db.add(post)
        if guru:
            guru.use_cases_shared += 1
            guru.learners_impacted += item.estimated_reach
        db.add(Notification(guru_id=item.guru_id, type="impact",
                            title="Your use case is now live",
                            message=f"'{decision.edited_title or item.draft_title}' was approved by a Master Guru. Estimated reach: {item.estimated_reach} learners."))
    else:
        db.add(Notification(guru_id=item.guru_id, type="rejection",
                            title="Use case needs revision",
                            message=f"Master Guru declined '{item.draft_title}'. {decision.notes or 'Please revise and resubmit.'}"))
    db.commit()
    return {"status": "ok", "action": decision.action}


@router.get("/full-queue")
def full_queue(db: Session = Depends(get_db)):
    """Combined queue: use cases + KM draft escalations + Stump pending MG review."""
    items = []

    # 1. Use cases pending MG approval
    for item in db.query(ApprovalQueue).filter(ApprovalQueue.status == "pending").order_by(ApprovalQueue.created_at):
        guru = db.query(Guru).filter(Guru.id == item.guru_id).first()
        items.append({
            "item_type": "use_case",
            "thread_id": item.thread_id,
            "id": item.id,
            "domain": item.domain,
            "title": item.draft_title,
            "content": item.draft_content,
            "tags": item.draft_tags.split(",") if item.draft_tags else [],
            "quality_score": item.quality_score,
            "quality_signals": json.loads(item.quality_signals) if item.quality_signals else {},
            "quality_flags": json.loads(item.quality_flags) if item.quality_flags else [],
            "estimated_reach": item.estimated_reach,
            "corpus_entry": item.corpus_entry,
            "submitter_name": guru.name if guru else "Unknown",
            "submitter_grade": guru.grade if guru else "",
            "submitter_avatar": guru.avatar_initials if guru else "?",
            "submitter_color": guru.avatar_color if guru else "#666",
            "created_at": item.created_at.isoformat(),
        })

    # 2. KM Drafts escalated to MG
    for draft in db.query(KMDraft).filter(KMDraft.status == "mg_escalated").order_by(KMDraft.created_at):
        ratings = db.query(RealityCheckRating).filter(
            RealityCheckRating.draft_id == draft.id,
            RealityCheckRating.rating == 2
        ).all()
        escalated_by = []
        for r in ratings:
            g = db.query(Guru).filter(Guru.id == r.guru_id).first()
            if g:
                escalated_by.append({
                    "name": g.name, "initials": g.avatar_initials,
                    "color": g.avatar_color, "feedback": r.missing_link
                })
        items.append({
            "item_type": "km_draft",
            "id": draft.id,
            "domain": draft.domain,
            "title": draft.title,
            "content": draft.content,
            "tags": draft.tags.split(",") if draft.tags else [],
            "km_name": draft.km_name,
            "avg_rating": draft.avg_rating,
            "agent_prompt": draft.agent_prompt,
            "escalated_by": escalated_by,
            "created_at": draft.created_at.isoformat(),
        })

    # 3. Open Stump items — MG can also provide expert sign-off
    for stump in db.query(StumpTheMaster).filter(StumpTheMaster.status == "open").order_by(StumpTheMaster.created_at):
        tagged = db.query(Guru).filter(Guru.id == stump.tagged_mg_id).first() if stump.tagged_mg_id else None
        items.append({
            "item_type": "stump",
            "id": stump.id,
            "domain": stump.domain,
            "query": stump.query,
            "ai_attempt": stump.ai_attempt,
            "km_draft": stump.km_draft,
            "confidence_score": stump.confidence_score,
            "failure_count": stump.failure_count,
            "agent_prompt": stump.agent_prompt,
            "tagged_mg": {
                "id": tagged.id, "name": tagged.name,
                "initials": tagged.avatar_initials, "color": tagged.avatar_color
            } if tagged else None,
            "created_at": stump.created_at.isoformat(),
        })

    return sorted(items, key=lambda x: x["created_at"])


@router.get("/stats")
def approval_stats(db: Session = Depends(get_db)):
    items = db.query(ApprovalQueue).all()
    return {"pending": len([i for i in items if i.status == "pending"]),
            "approved": len([i for i in items if i.status in ("approve", "auto_approved")]),
            "edited": len([i for i in items if i.status == "edit"]),
            "rejected": len([i for i in items if i.status in ("reject", "rejected")]),
            "avg_quality_score": round(sum(i.quality_score for i in items) / max(len(items), 1), 2)}
