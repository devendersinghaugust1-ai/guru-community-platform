import json, os, re
from sqlalchemy.orm import Session
from app.models import FeedPost, Guru, Notification

try:
    import anthropic
    _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    _has_llm = bool(os.getenv("ANTHROPIC_API_KEY"))
except Exception:
    _client = None; _has_llm = False


def run(raw_text: str, guru_id: int, domain: str, db: Session) -> dict:
    guru = db.query(Guru).filter(Guru.id == guru_id).first()
    if not guru:
        return {"error": "Guru not found"}
    structured = _llm_structure(raw_text, domain) if _has_llm else _mock_structure(raw_text, domain)
    post = FeedPost(guru_id=guru_id, post_type="use_case", title=structured["title"],
                    content=structured["content"], domain=domain,
                    tags=",".join(structured["tags"]), agent_generated=True)
    db.add(post)
    guru.use_cases_shared += 1
    guru.learners_impacted += structured["estimated_reach"]
    db.add(Notification(guru_id=guru_id, type="impact", title="Your use case is now live",
                        message=f"'{structured['title']}' is live in the feed. Estimated reach: {structured['estimated_reach']} learners in {domain}."))
    db.commit(); db.refresh(post)
    return {"status": "success", "post_id": post.id, "title": structured["title"],
            "tags": structured["tags"], "estimated_reach": structured["estimated_reach"],
            "corpus_draft": structured["corpus_entry"]}


def _llm_structure(raw_text: str, domain: str) -> dict:
    try:
        r = _client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=600,
            messages=[{"role": "user", "content": f"Structure this Genpact Guru use case.\nDomain: {domain}\nText: {raw_text}\nReturn JSON: title, content (2-3 sentences), tags (list 3), corpus_entry (1 sentence), estimated_reach (int 20-150). JSON only."}])
        m = re.search(r'\{.*\}', r.content[0].text, re.DOTALL)
        if m: return json.loads(m.group())
    except Exception: pass
    return _mock_structure(raw_text, domain)


def _mock_structure(raw_text: str, domain: str) -> dict:
    words = raw_text.strip().split()
    return {"title": " ".join(words[:9]) + ("..." if len(words) > 9 else ""),
            "content": f"{raw_text[:200]}... A practical {domain} approach directly applicable to live engagements.",
            "tags": [domain.lower().replace(" ", "-"), "best-practice", "use-case"],
            "corpus_entry": f"Expert insight on {domain}: {raw_text[:100]}", "estimated_reach": 47}
