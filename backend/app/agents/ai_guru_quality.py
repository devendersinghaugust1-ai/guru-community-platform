from sqlalchemy.orm import Session
from app.models import Guru, Notification, FeedPost

FAILED_RESPONSES = [
    {"query": "How do I calculate DSO for a multi-currency portfolio?", "domain": "Finance Transformation", "confidence": 0.31, "negative_feedback": 12},
    {"query": "Best approach for supplier risk tiering in emerging markets?", "domain": "Supply Chain", "confidence": 0.28, "negative_feedback": 9},
    {"query": "How to design a competency framework for digital HR roles?", "domain": "HR Modernisation", "confidence": 0.45, "negative_feedback": 6},
    {"query": "Key KPIs for AI-driven demand planning?", "domain": "Supply Chain", "confidence": 0.22, "negative_feedback": 18},
]


def run(db: Session) -> dict:
    domain_gurus = {}
    for g in db.query(Guru).all():
        if g.domain not in domain_gurus or g.is_master_guru:
            domain_gurus[g.domain] = g
    flagged = []
    for f in FAILED_RESPONSES:
        guru = domain_gurus.get(f["domain"])
        if not guru: continue
        db.add(Notification(guru_id=guru.id, type="ai_guru_fail",
                            title="AI Guru needs your correction",
                            message=f"Query: \"{f['query']}\" — confidence: {int(f['confidence']*100)}%, {f['negative_feedback']} negative learner feedback. Your correction will prevent this recurring."))
        flagged.append(f["query"])
        if guru.is_master_guru and f["negative_feedback"] > 10:
            guru.ai_guru_corrections += 1
            db.add(FeedPost(guru_id=guru.id, post_type="ai_correction",
                            title=f"AI Guru correction: {f['query'][:60]}",
                            content=f"I reviewed an AI Guru failure on this query and updated the knowledge base. If you're working in {f['domain']}, here's the correct answer...",
                            domain=f["domain"], tags="ai-guru,correction,knowledge-base", agent_generated=True))
    db.commit()
    return {"status": "success", "failures_flagged": len(flagged), "queries": flagged}
