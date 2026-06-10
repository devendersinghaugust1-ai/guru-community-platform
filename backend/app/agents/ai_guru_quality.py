from sqlalchemy.orm import Session
from app.models import Guru, Notification, FeedPost, OrganicSpark

FAILED_RESPONSES = [
    {
        "query": "How do I calculate DSO for a multi-currency portfolio?",
        "domain": "Finance Transformation", "confidence": 0.31, "negative_feedback": 12,
        "spark_prompt": "🧠 Corpus Discussion — Finance Transformation\n\nAI Guru is struggling with multi-currency DSO calculations (31% confidence, 12 learners gave negative feedback this week).\n\nIf you've handled this on a client engagement — what's the approach that actually works across currencies?\n\nYour response directly improves how AI Guru answers this for 2,000+ learners in your domain.",
    },
    {
        "query": "Best approach for supplier risk tiering in emerging markets?",
        "domain": "Supply Chain", "confidence": 0.28, "negative_feedback": 9,
        "spark_prompt": "🧠 Corpus Discussion — Supply Chain\n\nAI Guru is failing on supplier risk tiering in emerging markets (28% confidence, 9 negative signals).\n\nHas anyone built a tiering model that held up in markets with limited data? What factors actually drive the score?\n\nYour read gets fed back into the corpus — takes 2 minutes, helps hundreds of learners.",
    },
    {
        "query": "How to design a competency framework for digital HR roles?",
        "domain": "HR Modernisation", "confidence": 0.45, "negative_feedback": 6,
        "spark_prompt": "🧠 Corpus Discussion — HR Modernisation\n\nAI Guru has a 45% confidence gap on competency frameworks for digital HR roles — learners aren't finding the answers useful.\n\nIf you've designed one of these frameworks on a real engagement, what were the 3–5 competencies that clients actually valued?\n\nShare your read — it goes straight into the corpus improvement queue.",
    },
    {
        "query": "Key KPIs for AI-driven demand planning?",
        "domain": "Supply Chain", "confidence": 0.22, "negative_feedback": 18,
        "spark_prompt": "🧠 Corpus Discussion — Supply Chain\n\nAI Guru is consistently failing on KPIs for AI-driven demand planning (22% confidence — worst in the corpus this week, 18 negative learner signals).\n\nWhat KPIs have you actually tracked on demand planning implementations? Forecast accuracy? Inventory turns? Something else?\n\nYour answer will prevent 18+ learners from hitting the same wall.",
    },
]


def run(db: Session) -> dict:
    domain_gurus = {}
    for g in db.query(Guru).all():
        if g.domain not in domain_gurus or g.is_master_guru:
            domain_gurus[g.domain] = g

    flagged = []
    sparks_created = []

    for f in FAILED_RESPONSES:
        guru = domain_gurus.get(f["domain"])
        if not guru:
            continue

        # Notify domain MG/Guru
        db.add(Notification(
            guru_id=guru.id, type="ai_guru_fail",
            title="AI Guru needs your correction",
            message=f"Query: \"{f['query']}\" — confidence: {int(f['confidence']*100)}%, {f['negative_feedback']} negative learner feedback. Your correction will prevent this recurring.",
        ))
        flagged.append(f["query"])

        # Create/refresh Corpus Discussion (OrganicSpark) entry for community
        existing = db.query(OrganicSpark).filter(
            OrganicSpark.domain == f["domain"],
            OrganicSpark.signal.like(f"%{f['query'][:40]}%"),
        ).first()
        if not existing:
            db.add(OrganicSpark(
                domain=f["domain"],
                signal=f"Low-confidence corpus gap: '{f['query']}' — {int(f['confidence']*100)}% confidence, {f['negative_feedback']} negative learner signals",
                prompt=f["spark_prompt"],
                source="AI Guru Quality Agent",
                response_count=0,
            ))
            sparks_created.append(f["domain"])

        # Auto-post correction feed card for senior MGs with high failure signal
        if guru.is_master_guru and f["negative_feedback"] > 10:
            guru.ai_guru_corrections += 1
            db.add(FeedPost(
                guru_id=guru.id, post_type="ai_correction",
                title=f"AI Guru correction: {f['query'][:60]}",
                content=f"I reviewed an AI Guru failure on this query and updated the knowledge base. If you're working in {f['domain']}, here's the correct answer...",
                domain=f["domain"], tags="ai-guru,correction,knowledge-base", agent_generated=True,
            ))

    db.commit()
    return {
        "status": "success",
        "failures_flagged": len(flagged),
        "corpus_discussions_created": len(sparks_created),
        "queries": flagged,
    }
