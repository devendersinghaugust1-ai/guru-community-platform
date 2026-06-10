from sqlalchemy.orm import Session
from app.models import Guru, Notification

DOMAIN_GAPS = {
    "Finance Transformation": [{"topic": "Working Capital Optimisation with AI", "peer_count": 34, "query_volume": 89, "project_hint": "cash flow or working capital project"}],
    "Supply Chain": [{"topic": "Supplier risk tiering in volatile markets", "peer_count": 28, "query_volume": 67, "project_hint": "procurement or supplier management work"}],
    "HR Modernisation": [{"topic": "Competency frameworks for AI-native roles", "peer_count": 19, "query_volume": 43, "project_hint": "HR transformation or job redesign"}],
}


def run(db: Session) -> dict:
    count = 0
    log = []
    for guru in db.query(Guru).all():
        if guru.use_cases_shared >= 3: continue
        gaps = DOMAIN_GAPS.get(guru.domain, [])
        if not gaps: continue
        already_nudged = db.query(Notification).filter(Notification.guru_id == guru.id, Notification.type == "nudge").first()
        if already_nudged: continue
        gap = sorted(gaps, key=lambda g: g["query_volume"], reverse=True)[0]
        db.add(Notification(guru_id=guru.id, type="nudge",
                            title=f"{gap['peer_count']} peers asking about {gap['topic']}",
                            message=_message(guru, gap)))
        count += 1
        log.append({"guru": guru.name, "domain": guru.domain, "topic": gap["topic"]})
    db.commit()
    return {"status": "success", "nudges_sent": count, "log": log}


def _message(guru: Guru, gap: dict) -> str:
    return (f"As a {guru.grade} in {guru.domain}, your perspective is exactly what the community needs.\n\n"
            f"{gap['peer_count']} Genpact peers are struggling with '{gap['topic']}' "
            f"({gap['query_volume']} queries to AI Guru this week, many unanswered).\n\n"
            f"You've likely worked on a {gap['project_hint']}. Share even a brief use case — "
            f"we'll structure it into a post for you in under 2 minutes.\n\n"
            f"Your BU Head will see your contribution in the next quarterly Capability Report.")


def nudge_single(db: Session, guru_id: int, skill_topic: str) -> dict:
    """Send a targeted nudge to a specific guru about a specific skill topic."""
    guru = db.query(Guru).filter(Guru.id == guru_id).first()
    if not guru:
        return {"status": "error", "message": "Guru not found"}

    gaps = DOMAIN_GAPS.get(guru.domain, [])
    matched_gap = next((g for g in gaps if g["topic"] == skill_topic), None)
    if not matched_gap:
        matched_gap = {"topic": skill_topic, "peer_count": 20, "query_volume": 50, "project_hint": "relevant project"}

    db.add(Notification(
        guru_id=guru_id, type="nudge",
        title=f"Your expertise needed: {skill_topic}",
        message=_message(guru, matched_gap),
    ))
    db.commit()
    return {"status": "sent", "guru": guru.name, "topic": skill_topic}
