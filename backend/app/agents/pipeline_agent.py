import json
from sqlalchemy.orm import Session
from app.models import Guru, PipelineCandidate

MOCK_HR_DATA = [
    {
        "name": "Vikram Nair", "title": "VP - Finance Transformation", "grade": "VP",
        "domain": "Finance Transformation", "business_unit": "Banking & Financial Services", "platform_activity": 0.3,
        "ideal_match_tags": ["Finance - Record to Report", "Working Capital AI", "AI-Augmented Finance Ops"],
        "exec_summary": "VP with 14 years in Finance Transformation across Banking & FS. Led 3 large-scale R2R automation programmes. Deep expertise in multi-entity reconciliation and close cycles.",
        "workday_completion": {"Skills": True, "Job History": True, "Education": True, "Travel Preference": True, "Certifications": False, "Talent Statements": False, "Work Experience": True, "Languages": True},
    },
    {
        "name": "Sunita Rao", "title": "SVP - Supply Chain Analytics", "grade": "SVP",
        "domain": "Supply Chain", "business_unit": "Consumer Goods", "platform_activity": 0.6,
        "ideal_match_tags": ["Digital Agentic Supply Chain", "AI-Driven Demand Planning", "Supplier Intelligence"],
        "exec_summary": "SVP driving AI-first supply chain transformation in Consumer Goods. Pioneered demand sensing models across 6 markets. 60% platform activity — already engaged with Genome learning content.",
        "workday_completion": {"Skills": True, "Job History": True, "Education": True, "Travel Preference": True, "Certifications": True, "Talent Statements": True, "Work Experience": True, "Languages": False},
    },
    {
        "name": "Arun Mehta", "title": "VP - HR Technology", "grade": "VP",
        "domain": "HR Modernisation", "business_unit": "Life Sciences", "platform_activity": 0.1,
        "ideal_match_tags": ["Digital Agentic", "AI-Augmented HR", "HR Technology Architecture"],
        "exec_summary": "VP in HR Technology with 11 years designing talent architecture across Life Sciences. Low platform activity — represents an untapped voice in the community.",
        "workday_completion": {"Skills": True, "Job History": True, "Education": True, "Travel Preference": False, "Certifications": False, "Talent Statements": False, "Work Experience": False, "Languages": True},
    },
    {
        "name": "Deepa Krishnan", "title": "SVP - Procurement", "grade": "SVP",
        "domain": "Supply Chain", "business_unit": "Manufacturing", "platform_activity": 0.8,
        "ideal_match_tags": ["Digital Agentic Supply Chain", "Procurement Analytics", "Supplier Risk Intelligence"],
        "exec_summary": "SVP - Procurement with the highest platform activity in the pipeline cohort (80%). Leads strategic sourcing for Manufacturing BU. Strong candidate for fast-track Guru onboarding.",
        "workday_completion": {"Skills": True, "Job History": True, "Education": True, "Travel Preference": True, "Certifications": True, "Talent Statements": True, "Work Experience": True, "Languages": True},
    },
    {
        "name": "Rohit Sharma", "title": "VP - Financial Planning", "grade": "VP",
        "domain": "Finance Transformation", "business_unit": "Insurance", "platform_activity": 0.4,
        "ideal_match_tags": ["Finance - Record to Report", "FP&A AI Analytics", "Finance - Controllership"],
        "exec_summary": "VP in Financial Planning & Analysis with deep Insurance domain background. Has led FP&A transformation using AI forecasting tools — directly relevant to corpus gaps flagged this week.",
        "workday_completion": {"Skills": True, "Job History": True, "Education": True, "Travel Preference": True, "Certifications": False, "Talent Statements": True, "Work Experience": True, "Languages": False},
    },
    {
        "name": "Meera Patel", "title": "MD - Digital HR", "grade": "MD",
        "domain": "HR Modernisation", "business_unit": "Hi-Tech", "platform_activity": 0.5,
        "ideal_match_tags": ["Digital Agentic", "Finance - Record to Report", "AI-Native HR Roles"],
        "exec_summary": "MD in Digital HR with a rare combination of HR transformation and technology commercialisation. Based in Hi-Tech BU. Ideal voice for AI-native role design — the community's most critical knowledge gap.",
        "workday_completion": {"Skills": True, "Job History": True, "Education": True, "Travel Preference": True, "Certifications": False, "Talent Statements": True, "Work Experience": True, "Languages": True},
    },
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
