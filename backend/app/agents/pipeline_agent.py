import json
from sqlalchemy.orm import Session
from app.models import Guru, PipelineCandidate

MOCK_HR_DATA = [
    {"name": "Vikram Nair", "title": "VP - Finance Transformation", "grade": "VP", "domain": "Finance Transformation", "business_unit": "Banking & Financial Services", "platform_activity": 0.3},
    {"name": "Sunita Rao", "title": "SVP - Supply Chain Analytics", "grade": "SVP", "domain": "Supply Chain", "business_unit": "Consumer Goods", "platform_activity": 0.6},
    {"name": "Arun Mehta", "title": "VP - HR Technology", "grade": "VP", "domain": "HR Modernisation", "business_unit": "Life Sciences", "platform_activity": 0.1},
    {"name": "Deepa Krishnan", "title": "SVP - Procurement", "grade": "SVP", "domain": "Supply Chain", "business_unit": "Manufacturing", "platform_activity": 0.8},
    {"name": "Rohit Sharma", "title": "VP - Financial Planning", "grade": "VP", "domain": "Finance Transformation", "business_unit": "Insurance", "platform_activity": 0.4},
    {"name": "Meera Patel", "title": "MD - Digital HR", "grade": "MD", "domain": "HR Modernisation", "business_unit": "Hi-Tech", "platform_activity": 0.5},
]


def run(db: Session) -> dict:
    existing_names = {g.name for g in db.query(Guru).all()} | {c.name for c in db.query(PipelineCandidate).all()}
    new_candidates = []
    for person in MOCK_HR_DATA:
        if person["name"] in existing_names or person["grade"] not in ("VP", "SVP", "MD"):
            continue
        db.add(PipelineCandidate(name=person["name"], title=person["title"], grade=person["grade"],
                                  domain=person["domain"], business_unit=person["business_unit"],
                                  signal_score=_score(person), signals=json.dumps(_signals(person)),
                                  outreach_draft=_draft(person), status="identified"))
        new_candidates.append(person["name"])
    db.commit()
    return {"status": "success", "new_candidates_identified": len(new_candidates), "names": new_candidates}


def _score(p: dict) -> float:
    base = {"MD": 40, "SVP": 35, "VP": 30}.get(p["grade"], 20)
    return round(base + p["platform_activity"] * 30, 1)


def _signals(p: dict) -> list:
    s = [f"Seniority: {p['grade']} level — meets threshold"]
    if p["platform_activity"] > 0.5:
        s.append(f"Platform activity: {int(p['platform_activity']*100)}% — above average")
    s.append(f"Domain: {p['domain']} — active skill area with AI Guru knowledge gaps")
    return s


def _draft(p: dict) -> str:
    first = p['name'].split()[0]
    return f"""Subject: An invitation from the Genpact Guru Community

Dear {first},

I hope you're settling in well at Genpact.

I'm reaching out on behalf of the Master Guru Group — a senior peer community where VPs, SVPs, and MDs across Genpact share expertise, mentor the next generation of leaders, and build meaningful visibility with business leadership.

Your profile puts you in the right room for this community.

Members of the Guru Community are recognised in our quarterly BU Head Capability Report — your name, your business unit, your domain. Several of your peers in {p['business_unit']} are already active members.

The community is growing, and we are specifically looking to bring in senior voices from {p['domain']}.

Would you be open to a brief 20-minute conversation with our team this week? There is no obligation — we'd simply like to show you what it looks like from the inside.

Warm regards,

Master Guru Group (MGG)
Genome.ai · Genpact"""
