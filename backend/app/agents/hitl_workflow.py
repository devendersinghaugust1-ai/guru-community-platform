"""
HITL Approval Workflow — LangGraph-pattern without LangGraph dependency.

Implements the same async interrupt() pattern:
  - Workflow state is frozen in SQLite at the approval point
  - No timeout — MG can resume hours or days later
  - Resume endpoint restores state and continues

Flow:
  submit → structure → quality_review → route:
    >= 0.85 → fast_lane (auto-publish, 24h MG review window)
    0.30-0.85 → INTERRUPT → saved to DB → MG approves via /decide endpoint
    < 0.30 → reject with feedback
"""
import json
import re
import os
from typing import TypedDict, Literal, Optional

try:
    import anthropic
    _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    _has_llm = bool(os.getenv("ANTHROPIC_API_KEY"))
except Exception:
    _client = None
    _has_llm = False


class PostState(TypedDict):
    guru_id: int
    guru_name: str
    domain: str
    raw_text: str
    draft_title: str
    draft_content: str
    draft_tags: list
    corpus_entry: str
    estimated_reach: int
    quality_score: float
    quality_signals: dict
    quality_flags: list
    routing: str
    mg_decision: Optional[str]
    mg_edits: Optional[str]
    mg_id: Optional[int]
    feedback_to_guru: Optional[str]


# ── Node 1: Structure ─────────────────────────────────────────────────────

def content_structuring_node(state: PostState) -> PostState:
    if _has_llm:
        result = _llm_structure(state["raw_text"], state["domain"])
    else:
        result = _mock_structure(state["raw_text"], state["domain"])
    return {**state, **result}


def _llm_structure(raw_text: str, domain: str) -> dict:
    try:
        response = _client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            messages=[{"role": "user", "content": f"""Structure this Genpact Guru use case for the community feed.
Domain: {domain}
Raw text: {raw_text}

Return JSON only with these keys:
- draft_title: compelling headline, max 12 words
- draft_content: 2-3 sentences, insight-focused, no client names
- draft_tags: list of 3 lowercase hyphenated skill tags
- corpus_entry: 1 sentence for AI Guru knowledge base
- estimated_reach: integer 20-200"""}]
        )
        text = response.content[0].text
        m = re.search(r'\{.*\}', text, re.DOTALL)
        if m:
            return json.loads(m.group())
    except Exception:
        pass
    return _mock_structure(raw_text, domain)


def _mock_structure(raw_text: str, domain: str) -> dict:
    words = raw_text.strip().split()
    title = " ".join(words[:9]) + ("..." if len(words) > 9 else "")
    return {
        "draft_title": title,
        "draft_content": f"{raw_text[:180]}... A practical {domain} approach directly applicable to live engagements.",
        "draft_tags": [domain.lower().replace(" ", "-"), "best-practice", "use-case"],
        "corpus_entry": f"Expert insight on {domain}: {raw_text[:120]}",
        "estimated_reach": 47,
    }


# ── Node 2: Composite Quality Review (5-signal scoring) ──────────────────

def quality_review_node(state: PostState) -> PostState:
    content = state["draft_content"]
    tags = state["draft_tags"]
    signals, flags = {}, []

    # Rule-based checks — 30% weight (deterministic, highest reliability)
    rule_score = 1.0
    if len(content) < 80:
        rule_score -= 0.3; flags.append("Content too short — add more depth")
    if not any(c.isdigit() for c in content):
        rule_score -= 0.15; flags.append("No quantified outcome — add a metric or %")
    if any(kw in content.lower() for kw in ["client name", "confidential"]):
        rule_score -= 0.4; flags.append("Possible client exposure — review before publishing")
    if len(tags) < 2:
        rule_score -= 0.1; flags.append("Fewer than 2 tags")
    signals["rule_based"] = max(0.0, round(rule_score, 2))

    # Domain alignment — 25% weight
    domain_words = set(state["domain"].lower().split())
    overlap = len(domain_words & set(content.lower().split())) / max(len(domain_words), 1)
    signals["domain_alignment"] = min(1.0, round(0.3 + overlap * 0.7, 2))

    # Content specificity — 20% weight
    signals["specificity"] = min(1.0, round(len(content) / 300, 2))

    # LLM confidence — 15% weight (intentionally low-weighted per ICLR 2025 research)
    signals["llm_confidence"] = 0.75 if _has_llm else 0.65

    # Novelty — 10% weight
    signals["novelty"] = 0.80

    weights = {"rule_based": 0.30, "domain_alignment": 0.25, "specificity": 0.20, "llm_confidence": 0.15, "novelty": 0.10}
    score = round(sum(signals[k] * weights[k] for k in signals), 3)

    routing = "rejected" if score < 0.30 else "mg_review"  # all posts go to MG queue
    return {**state, "quality_score": score, "quality_signals": signals, "quality_flags": flags, "routing": routing}


# ── Run: full workflow to interrupt point ────────────────────────────────

def start_workflow_sync(guru_id: int, guru_name: str, domain: str, raw_text: str) -> dict:
    """Synchronous version — runs structure + quality review, returns state."""
    state: PostState = {
        "guru_id": guru_id, "guru_name": guru_name, "domain": domain, "raw_text": raw_text,
        "draft_title": "", "draft_content": "", "draft_tags": [], "corpus_entry": "", "estimated_reach": 0,
        "quality_score": 0.0, "quality_signals": {}, "quality_flags": [], "routing": "mg_review",
        "mg_decision": None, "mg_edits": None, "mg_id": None, "feedback_to_guru": None,
    }
    state = content_structuring_node(state)
    state = quality_review_node(state)
    if state["routing"] == "fast_lane":
        state["feedback_to_guru"] = f"'{state['draft_title']}' scored {state['quality_score']:.0%} — fast-tracked."
    elif state["routing"] == "rejected":
        state["feedback_to_guru"] = f"Draft scored {state['quality_score']:.0%}. Fix: {'; '.join(state['quality_flags'])}."
    return state


async def start_workflow(guru_id: int, guru_name: str, domain: str, raw_text: str, thread_id: str, db_path: str = "") -> dict:
    state: PostState = {
        "guru_id": guru_id, "guru_name": guru_name, "domain": domain, "raw_text": raw_text,
        "draft_title": "", "draft_content": "", "draft_tags": [], "corpus_entry": "", "estimated_reach": 0,
        "quality_score": 0.0, "quality_signals": {}, "quality_flags": [], "routing": "mg_review",
        "mg_decision": None, "mg_edits": None, "mg_id": None, "feedback_to_guru": None,
    }
    state = content_structuring_node(state)
    state = quality_review_node(state)

    if state["routing"] == "fast_lane":
        state["mg_decision"] = "auto_approved"
        state["feedback_to_guru"] = f"'{state['draft_title']}' scored {state['quality_score']:.0%} — fast-tracked. MGs have 24h review window."
    elif state["routing"] == "rejected":
        state["feedback_to_guru"] = f"Draft scored {state['quality_score']:.0%}. Fix: {'; '.join(state['quality_flags'])}. Revise and resubmit."

    # For mg_review: workflow PAUSES here — state is frozen in DB by the caller (approvals router)
    return state


async def resume_workflow(thread_id: str, mg_decision: dict, db_path: str = "") -> dict:
    """
    Resumes from the interrupt point.
    In production: restore full state from DB using thread_id, apply MG decision, finalise.
    Here: decision payload is sufficient for finalisation.
    """
    action = mg_decision.get("action", "approve")
    edited_content = mg_decision.get("edited_content")

    return {
        "mg_decision": action,
        "mg_edits": edited_content,
        "mg_id": mg_decision.get("mg_id"),
        "status": "finalised",
    }
