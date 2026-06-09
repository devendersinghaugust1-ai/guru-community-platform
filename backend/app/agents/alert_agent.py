from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Guru, FeedPost, Notification

AI_FAILURES = [
    {"domain": "Finance Transformation", "topic": "Working Capital Optimisation", "failure_rate": 0.34, "queries": 89},
    {"domain": "Supply Chain", "topic": "Supplier Risk Scoring", "failure_rate": 0.41, "queries": 67},
    {"domain": "HR Modernisation", "topic": "Skills Taxonomy Design", "failure_rate": 0.28, "queries": 52},
]
LEARNER_STRUGGLES = [
    {"domain": "Finance Transformation", "skill": "Cash Flow Forecasting with AI", "learners": 34, "avg_score": 42},
    {"domain": "Supply Chain", "skill": "Demand Sensing Models", "learners": 28, "avg_score": 38},
]


def run(db: Session) -> dict:
    domain_gurus = {g.domain: g for g in db.query(Guru).all()}
    count = 0
    for s in AI_FAILURES:
        guru = domain_gurus.get(s["domain"])
        if guru:
            db.add(Notification(guru_id=guru.id, type="ai_guru_fail",
                                title="AI Guru struggling on your topic",
                                message=f"AI Guru has a {int(s['failure_rate']*100)}% failure rate on '{s['topic']}' ({s['queries']} queries this week). Your expertise is needed to correct the knowledge base."))
            count += 1
    for s in LEARNER_STRUGGLES:
        guru = domain_gurus.get(s["domain"])
        if guru:
            db.add(Notification(guru_id=guru.id, type="learner_struggle",
                                title="Learner cluster struggling in your domain",
                                message=f"{s['learners']} learners scoring below 50% on '{s['skill']}' (avg: {s['avg_score']}%). A use case or short session from you could unblock them."))
            count += 1
    cutoff = datetime.utcnow() - timedelta(days=90)
    for post in db.query(FeedPost).filter(FeedPost.created_at < cutoff, FeedPost.views > 50).limit(3).all():
        guru = domain_gurus.get(post.domain) if post.domain in domain_gurus else None
        if guru and guru.id == post.guru_id:
            db.add(Notification(guru_id=guru.id, type="content_stale",
                                title="High-traffic content may need refreshing",
                                message=f"'{post.title[:60]}' has {post.views} views but was last updated 90+ days ago."))
            count += 1
    db.commit()
    return {"status": "success", "notifications_created": count}
