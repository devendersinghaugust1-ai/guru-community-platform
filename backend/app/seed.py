import json
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import (Guru, FeedPost, Reaction, Comment, Notification,
                        PipelineCandidate, KMDraft, RealityCheckRating,
                        StumpTheMaster, OrganicSpark, ExecutiveBroadcast)

GURUS = [
    {"name": "Priya Venkataraman", "title": "Master Guru — Finance Transformation", "grade": "SVP",
     "domain": "Finance Transformation", "experience_years": 18,
     "certifications": "CPA, CFA, Lean Six Sigma Black Belt",
     "avatar_initials": "PV", "avatar_color": "#0078d4", "is_master_guru": True,
     "use_cases_shared": 12, "learners_impacted": 434, "ai_guru_corrections": 8, "domain_rank": 1,
     "reviews_completed": 14, "review_turnaround_hrs": 4.2, "escalation_saves": 8,
     "contribution_index": 92,
     "narrative": "Governed Finance Ops corpus this month — reviewed 14 KM drafts and ensured accuracy for 2,000+ learners."},
    {"name": "Rahul Desai", "title": "Guru — Supply Chain Analytics", "grade": "VP",
     "domain": "Supply Chain", "experience_years": 14, "certifications": "APICS CSCP, PMP",
     "avatar_initials": "RD", "avatar_color": "#107c10", "is_master_guru": False,
     "use_cases_shared": 9, "learners_impacted": 210, "ai_guru_corrections": 5, "domain_rank": 2,
     "reviews_completed": 9, "review_turnaround_hrs": 6.1, "escalation_saves": 5,
     "contribution_index": 78,
     "narrative": "Reviewed 9 Supply Chain KM drafts this quarter — protected delivery quality for 800+ learners."},
    {"name": "Ananya Singh", "title": "Master Guru — HR Modernisation", "grade": "SVP",
     "domain": "HR Modernisation", "experience_years": 16, "certifications": "SHRM-SCP, ICF Coach",
     "avatar_initials": "AS", "avatar_color": "#8764b8", "is_master_guru": True,
     "use_cases_shared": 7, "learners_impacted": 185, "ai_guru_corrections": 11, "domain_rank": 1,
     "reviews_completed": 11, "review_turnaround_hrs": 3.8, "escalation_saves": 11,
     "contribution_index": 88,
     "narrative": "Fastest reviewer in the community — 3.8hr avg turnaround. Saved 11 AI escalations in HR domain."},
    {"name": "Karthik Iyer", "title": "Guru — Tax & Compliance", "grade": "VP",
     "domain": "Finance Transformation", "experience_years": 11,
     "certifications": "CMA, SAP FI Certified",
     "avatar_initials": "KI", "avatar_color": "#d83b01", "is_master_guru": False,
     "use_cases_shared": 5, "learners_impacted": 120, "ai_guru_corrections": 3, "domain_rank": 3,
     "reviews_completed": 5, "review_turnaround_hrs": 12.4, "escalation_saves": 3,
     "contribution_index": 61,
     "narrative": "5 KM reviews completed — 1 escalation save this month in Finance Transformation."},
    {"name": "Nisha Agarwal", "title": "Guru — Logistics & Distribution", "grade": "VP",
     "domain": "Supply Chain", "experience_years": 12, "certifications": "CSCMP, Lean Six Sigma",
     "avatar_initials": "NA", "avatar_color": "#038387", "is_master_guru": False,
     "use_cases_shared": 6, "learners_impacted": 145, "ai_guru_corrections": 2, "domain_rank": 3,
     "reviews_completed": 6, "review_turnaround_hrs": 8.9, "escalation_saves": 2,
     "contribution_index": 58,
     "narrative": "6 Supply Chain reviews this quarter — 2 AI escalation saves."},
    # Finance Transformation — additional gurus
    {"name": "Deepak Sharma", "title": "Master Guru — CFO Advisory", "grade": "MD",
     "domain": "Finance Transformation", "experience_years": 22,
     "certifications": "CPA, CGMA, Lean Six Sigma Master Black Belt",
     "avatar_initials": "DS", "avatar_color": "#1B2A4A", "is_master_guru": True,
     "use_cases_shared": 15, "learners_impacted": 610, "ai_guru_corrections": 12, "domain_rank": 1,
     "reviews_completed": 18, "review_turnaround_hrs": 3.5, "escalation_saves": 12,
     "contribution_index": 96,
     "narrative": "Most senior Finance MG. Governs CFO Advisory corpus — 18 reviews, 12 escalation saves this quarter."},
    {"name": "Meera Krishnan", "title": "Guru — FP&A & Budgeting", "grade": "VP",
     "domain": "Finance Transformation", "experience_years": 13,
     "certifications": "CFA Level 3, FP&A Certified",
     "avatar_initials": "MK", "avatar_color": "#c8960c", "is_master_guru": False,
     "use_cases_shared": 7, "learners_impacted": 170, "ai_guru_corrections": 4, "domain_rank": 4,
     "reviews_completed": 7, "review_turnaround_hrs": 9.2, "escalation_saves": 4,
     "contribution_index": 67,
     "narrative": "FP&A specialist — 7 KM reviews this quarter with focus on budgeting frameworks."},
    {"name": "Amit Patel", "title": "Guru — Treasury & Cash Management", "grade": "VP",
     "domain": "Finance Transformation", "experience_years": 10,
     "certifications": "CTP, ACT Qualified",
     "avatar_initials": "AP", "avatar_color": "#ca5010", "is_master_guru": False,
     "use_cases_shared": 4, "learners_impacted": 95, "ai_guru_corrections": 2, "domain_rank": 5,
     "reviews_completed": 4, "review_turnaround_hrs": 14.1, "escalation_saves": 2,
     "contribution_index": 48,
     "narrative": "Treasury specialist joining the review cycle — 4 KM reviews in Finance Transformation."},
    # Supply Chain — additional gurus
    {"name": "Sunita Rao", "title": "Master Guru — Procurement & Sourcing", "grade": "SVP",
     "domain": "Supply Chain", "experience_years": 19,
     "certifications": "CPSM, CIPS Level 6, PMP",
     "avatar_initials": "SR", "avatar_color": "#008272", "is_master_guru": True,
     "use_cases_shared": 11, "learners_impacted": 380, "ai_guru_corrections": 9, "domain_rank": 1,
     "reviews_completed": 13, "review_turnaround_hrs": 5.1, "escalation_saves": 9,
     "contribution_index": 89,
     "narrative": "Governs Supply Chain procurement corpus. 13 reviews, 9 escalation saves this quarter."},
    {"name": "Vikram Nair", "title": "Guru — Demand Planning", "grade": "VP",
     "domain": "Supply Chain", "experience_years": 11,
     "certifications": "APICS CPIM, SAP SCM",
     "avatar_initials": "VN", "avatar_color": "#4da636", "is_master_guru": False,
     "use_cases_shared": 5, "learners_impacted": 130, "ai_guru_corrections": 3, "domain_rank": 4,
     "reviews_completed": 5, "review_turnaround_hrs": 11.0, "escalation_saves": 3,
     "contribution_index": 55,
     "narrative": "Demand Planning specialist — 5 reviews with focus on forecasting methodology."},
    {"name": "Pooja Joshi", "title": "Guru — Inventory Optimisation", "grade": "VP",
     "domain": "Supply Chain", "experience_years": 9,
     "certifications": "CSCP, Lean Six Sigma Green Belt",
     "avatar_initials": "PJ", "avatar_color": "#00b294", "is_master_guru": False,
     "use_cases_shared": 3, "learners_impacted": 72, "ai_guru_corrections": 1, "domain_rank": 5,
     "reviews_completed": 3, "review_turnaround_hrs": 18.5, "escalation_saves": 1,
     "contribution_index": 38,
     "narrative": "Inventory Optimisation specialist — just getting active in the review cycle."},
    # HR Modernisation — additional gurus
    {"name": "Rajesh Gupta", "title": "Master Guru — Workforce Transformation", "grade": "SVP",
     "domain": "HR Modernisation", "experience_years": 20,
     "certifications": "SHRM-SCP, Prosci ADKAR, ICF PCC",
     "avatar_initials": "RG", "avatar_color": "#5c2d91", "is_master_guru": True,
     "use_cases_shared": 10, "learners_impacted": 290, "ai_guru_corrections": 14, "domain_rank": 1,
     "reviews_completed": 16, "review_turnaround_hrs": 4.8, "escalation_saves": 14,
     "contribution_index": 93,
     "narrative": "Workforce Transformation MG. 16 reviews, highest escalation saves in HR domain this quarter."},
    {"name": "Kavita Sharma", "title": "Guru — Talent Acquisition", "grade": "VP",
     "domain": "HR Modernisation", "experience_years": 12,
     "certifications": "SHRM-CP, LinkedIn Recruiter Certified",
     "avatar_initials": "KS", "avatar_color": "#b4009e", "is_master_guru": False,
     "use_cases_shared": 6, "learners_impacted": 155, "ai_guru_corrections": 4, "domain_rank": 3,
     "reviews_completed": 6, "review_turnaround_hrs": 10.2, "escalation_saves": 4,
     "contribution_index": 62,
     "narrative": "Talent Acquisition specialist — 6 KM reviews with focus on AI-assisted hiring frameworks."},
    {"name": "Arjun Kumar", "title": "Guru — Learning & Development", "grade": "VP",
     "domain": "HR Modernisation", "experience_years": 10,
     "certifications": "CPLP, ATD Master Trainer",
     "avatar_initials": "AK", "avatar_color": "#744da9", "is_master_guru": False,
     "use_cases_shared": 4, "learners_impacted": 110, "ai_guru_corrections": 3, "domain_rank": 4,
     "reviews_completed": 4, "review_turnaround_hrs": 13.7, "escalation_saves": 3,
     "contribution_index": 53,
     "narrative": "L&D specialist — 4 curriculum reviews with focus on competency framework design."},
    # Collections & Credit — new domain
    {"name": "Suresh Menon", "title": "Master Guru — Collections Strategy", "grade": "SVP",
     "domain": "Collections & Credit", "experience_years": 17,
     "certifications": "CCE, CFA, CRCM",
     "avatar_initials": "SM", "avatar_color": "#FF4E58", "is_master_guru": True,
     "use_cases_shared": 9, "learners_impacted": 260, "ai_guru_corrections": 10, "domain_rank": 1,
     "reviews_completed": 12, "review_turnaround_hrs": 5.6, "escalation_saves": 10,
     "contribution_index": 86,
     "narrative": "Collections & Credit domain lead. Governs corpus for AR and credit risk — 12 reviews this quarter."},
    {"name": "Divya Nair", "title": "Guru — Credit Risk Analytics", "grade": "VP",
     "domain": "Collections & Credit", "experience_years": 11,
     "certifications": "FRM, CPA",
     "avatar_initials": "DN", "avatar_color": "#e81123", "is_master_guru": False,
     "use_cases_shared": 5, "learners_impacted": 125, "ai_guru_corrections": 4, "domain_rank": 2,
     "reviews_completed": 6, "review_turnaround_hrs": 9.4, "escalation_saves": 4,
     "contribution_index": 65,
     "narrative": "Credit Risk specialist — 6 KM reviews with focus on credit scoring methodology."},
    {"name": "Arun Singh", "title": "Guru — AR Collections", "grade": "VP",
     "domain": "Collections & Credit", "experience_years": 9,
     "certifications": "CTP, NACM Certified",
     "avatar_initials": "AS2", "avatar_color": "#d13438", "is_master_guru": False,
     "use_cases_shared": 4, "learners_impacted": 88, "ai_guru_corrections": 2, "domain_rank": 3,
     "reviews_completed": 4, "review_turnaround_hrs": 15.2, "escalation_saves": 2,
     "contribution_index": 44,
     "narrative": "AR Collections specialist — building review habits, 4 KM reviews this quarter."},
    # Procurement — new domain
    {"name": "Lakshmi Bhat", "title": "Master Guru — Strategic Sourcing", "grade": "SVP",
     "domain": "Procurement", "experience_years": 18,
     "certifications": "CPSM, CPM, CIPS Level 6",
     "avatar_initials": "LB", "avatar_color": "#7e4e60", "is_master_guru": True,
     "use_cases_shared": 10, "learners_impacted": 300, "ai_guru_corrections": 8, "domain_rank": 1,
     "reviews_completed": 11, "review_turnaround_hrs": 6.0, "escalation_saves": 8,
     "contribution_index": 84,
     "narrative": "Procurement domain lead. Strategic Sourcing expert — 11 KM reviews, 8 escalation saves."},
    {"name": "Sanjay Verma", "title": "Guru — Supplier Management", "grade": "VP",
     "domain": "Procurement", "experience_years": 13,
     "certifications": "CPSM, PMP",
     "avatar_initials": "SV", "avatar_color": "#986f0b", "is_master_guru": False,
     "use_cases_shared": 6, "learners_impacted": 148, "ai_guru_corrections": 3, "domain_rank": 2,
     "reviews_completed": 6, "review_turnaround_hrs": 10.8, "escalation_saves": 3,
     "contribution_index": 59,
     "narrative": "Supplier Management specialist — 6 KM reviews with focus on vendor risk frameworks."},
    {"name": "Neha Gupta", "title": "Guru — Category Management", "grade": "VP",
     "domain": "Procurement", "experience_years": 8,
     "certifications": "CIPS Level 5, Lean Six Sigma Green Belt",
     "avatar_initials": "NG", "avatar_color": "#bf8b12", "is_master_guru": False,
     "use_cases_shared": 3, "learners_impacted": 66, "ai_guru_corrections": 1, "domain_rank": 3,
     "reviews_completed": 3, "review_turnaround_hrs": 20.1, "escalation_saves": 1,
     "contribution_index": 35,
     "narrative": "Category Management specialist — recently joined the review cycle."},
]

FEED_POSTS = [
    {"guru_idx": 0, "post_type": "use_case",
     "title": "How we reduced DSO by 22% using AI-driven collections prioritisation",
     "content": "In a recent BFSI engagement, we deployed an AI model scoring receivables by payment probability. Collections team focused on the right 20% of invoices driving 80% of recovery. Key learning: the model needed domain rules, not just ML signals.",
     "domain": "Finance Transformation", "tags": "AR-automation,AI,collections", "views": 234, "days_ago": 42},
    {"guru_idx": 1, "post_type": "use_case",
     "title": "Supplier risk tiering in volatile markets: lessons from 3 engagements",
     "content": "Traditional supplier scorecards fail in volatility. We built a dynamic risk model combining financial health, geopolitical exposure, and delivery history. The insight that changed everything: tier by risk velocity, not just risk level.",
     "domain": "Supply Chain", "tags": "supplier-risk,procurement,analytics", "views": 189, "days_ago": 35},
    {"guru_idx": 2, "post_type": "domain_insight",
     "title": "Skills gap alert: AI-native HR skills are being underestimated",
     "content": "AI Guru is seeing a 41% failure rate on questions about skills taxonomy for AI-native roles. Most HR frameworks were built pre-GenAI. This is a genuine gap.",
     "domain": "HR Modernisation", "tags": "skills-gap,AI-native,taxonomy", "views": 201, "days_ago": 7},
    {"guru_idx": 0, "post_type": "milestone",
     "title": "Finance Ops corpus hit 2,000 learner accuracy milestone",
     "content": "The corpus we govern just crossed 2,000 learners with a 94% accuracy rating on Finance Transformation queries. This is what happens when the right experts review the right content at the right time.",
     "domain": "Finance Transformation", "tags": "milestone,corpus,quality", "views": 312, "days_ago": 5},
]

KM_DRAFTS = [
    {"km_name": "Sneha Kapoor (KM)", "domain": "Agentic AI",
     "title": "Agentic AI Course 2.0 — Learning Curriculum Draft",
     "content": "Module 1: What is Agentic AI — difference between LLMs, copilots, and autonomous agents. Key concepts: planning, memory, tool use, multi-agent orchestration.\n\nModule 2: Agent Architecture Patterns — ReAct (Reasoning + Acting), Plan-and-Execute, HITL (Human-in-the-Loop). When to use each pattern on client engagements.\n\nModule 3: Building Your First Agent — hands-on lab using CrewAI or LangGraph. Task: build a 2-agent pipeline that researches a supply chain risk and drafts a client briefing.\n\nModule 4: Agentic AI in Genpact Delivery — real case studies from Finance Ops, Supply Chain, HR Modernisation. How agents are replacing 4-step manual processes.\n\nModule 5: Responsible Agentic AI — guardrails, audit trails, human oversight design. How to explain agent decisions to a client team that doesn't trust black boxes.",
     "tags": "agentic-AI,curriculum,learning,course-2.0",
     "agent_prompt": "KM has shared the Agentic AI Course 2.0 curriculum for expert review 📚\n\nGurus — this is the learning path we're building for the next cohort of Genpact practitioners. Before it goes live, we need your validation.\n\nOn a scale of 1–3:\n1 = Modules are missing the real practitioner gaps — learners won't be deployment-ready\n2 = Right direction, but one module needs a rethink\n3 = Solid — I'd stake my team's upskilling on this curriculum\n\nRate it. If below 3, tell us the one module or concept that needs fixing.",
     "status": "pending", "days_ago": 1},
    {"km_name": "Sneha Kapoor (KM)", "domain": "Finance Transformation",
     "title": "Finance Close Process Automation — 5 Key Patterns",
     "content": "Modern finance close automation follows five repeatable patterns: (1) Journal entry automation via RPA for high-volume, low-judgment entries. (2) Variance analysis triggers — auto-flag entries exceeding threshold. (3) Intercompany reconciliation via matching algorithms. (4) Accrual estimation using ML on historical data. (5) Consolidated reporting via real-time dashboards replacing manual consolidation.",
     "tags": "financial-close,RPA,automation,patterns",
     "agent_prompt": "KM just mapped 5 key patterns for Finance Close Automation. Gurus, give this a Reality Check 🎯 — on a scale of 1–3, how accurately does this reflect what you actually see on client engagements today?\n\n1 = Misses the real picture\n2 = Close, but something important is missing\n3 = Accurate, I'd stake my reputation on this\n\nDrop a rating — and if it's a 1 or 2, tell us the one thing that's wrong.",
     "status": "pending", "days_ago": 1},
    {"km_name": "Arjun Mehta (KM)", "domain": "Supply Chain",
     "title": "Supplier Risk Velocity Framework — Scoring Methodology",
     "content": "Supplier risk velocity measures the rate of change in a supplier's risk profile, not just the current risk level. The framework scores suppliers on: financial health trend (40%), geopolitical exposure delta (30%), delivery performance trend (20%), and ESG signal change (10%). A supplier stable at high risk is less dangerous than a supplier rapidly moving from low to medium.",
     "tags": "supplier-risk,velocity,procurement,methodology",
     "agent_prompt": "KM has drafted a Supplier Risk Velocity scoring methodology for Supply Chain. Gurus, Reality Check time 🔍 — does this scoring methodology actually hold up on real client engagements?\n\n1 = This would confuse a client team\n2 = Right direction, one key thing is off\n3 = Solid — I'd use this in a delivery\n\nRate it. If it's below a 3, drop the one thing that needs fixing.",
     "status": "needs_revision", "days_ago": 3, "avg_rating": 2.0, "rating_count": 1},
    {"km_name": "Sneha Kapoor (KM)", "domain": "HR Modernisation",
     "title": "Competency Framework Design for AI-Augmented HR Business Partners",
     "content": "As AI handles transactional HR tasks, the HR BP role splits into two profiles: (1) Human Judgment Specialist — handling complex employee relations, culture sensing, and strategic advisory that AI cannot replicate. (2) AI Orchestrator — managing AI tools, curating outputs, and ensuring quality of automated HR decisions. The competency framework should separate these profiles and not assume one person holds both.",
     "tags": "competency,AI-augmented,HR-BP,framework",
     "agent_prompt": "KM has drafted a competency framework design for AI-augmented HR Business Partners. Gurus in HR Modernisation — Reality Check 🧐\n\nOn a scale of 1–3, how well does this reflect what client HR teams actually need today?\n\n1 = Off the mark\n2 = Getting there, something is missing\n3 = This is exactly what I'd tell a client\n\nTap your rating. If it's under 3, what's the gap?",
     "status": "pending", "days_ago": 2},
    {"km_name": "Arjun Mehta (KM)", "domain": "Finance Transformation",
     "title": "AI Collections Implementation Playbook — 8-Week Sprint",
     "content": "Week 1-2: Data audit and model training data preparation. Week 3-4: Model build with domain rules overlay. Week 5-6: Parallel run with existing collections process. Week 7: Threshold tuning with collections team input. Week 8: Go-live with human-in-loop review for high-value accounts. Critical success factor: involving collections team leads from Week 1, not Week 7.",
     "tags": "collections,AI,implementation,playbook",
     "agent_prompt": "KM has drafted an 8-week AI Collections Implementation Playbook. Finance Transformation Gurus — Reality Check 📋\n\nHas anyone run this kind of sprint? Does this timeline and sequencing reflect real delivery?\n\n1 = Won't survive first contact with the client\n2 = Mostly right, one sequence is wrong\n3 = I'd hand this to a delivery team today\n\nRate it.",
     "status": "approved", "days_ago": 8, "avg_rating": 3.0, "rating_count": 2},
]

STUMP_DATA = [
    {"domain": "Finance Transformation",
     "query": "How do you optimise working capital for a business with highly seasonal cash flows without disrupting supplier relationships?",
     "ai_attempt": "Working capital optimisation typically involves managing receivables, payables, and inventory cycles. For seasonal businesses, dynamic payment terms can help manage cash flow peaks...",
     "km_draft": "Seasonal working capital requires a tiered approach: (1) Build a cash flow seasonality map across 24 months. (2) Negotiate dynamic payment terms with top-20 suppliers that flex with your seasonal cycle. (3) Use supply chain financing programs during peak demand periods...",
     "confidence_score": 0.34, "failure_count": 47, "tagged_mg_idx": 0,
     "agent_prompt": "AI Guru hit a wall 🧱 — couldn't resolve this live Finance delivery question about seasonal working capital optimisation (34% confidence, 47 queries unanswered).\n\nKM has staged a draft response, but it needs your expert sign-off, @Priya.\n\nApprove the draft, or drop the missing link that makes this actually work on a real client.",
     "days_ago": 2},
    {"domain": "Supply Chain",
     "query": "What is the right approach to demand sensing in post-COVID supply chains where historical data is fundamentally unreliable?",
     "ai_attempt": "Demand sensing uses short-term data signals to improve forecast accuracy. Traditional approaches rely on point-of-sale data and leading indicators...",
     "km_draft": "Post-COVID demand sensing requires abandoning pre-2020 historical baselines. Instead: (1) Use 90-day rolling windows only. (2) Weight external signals (search trends, logistics data, social signals) more heavily than internal history. (3) Build scenario bands, not point forecasts...",
     "confidence_score": 0.28, "failure_count": 63, "tagged_mg_idx": 1,
     "agent_prompt": "AI Guru stumped again 🤔 — 63 Supply Chain learners couldn't get a reliable answer on post-COVID demand sensing (28% confidence).\n\nKM has a draft, but the core methodology needs a real practitioner's stamp, @Rahul.\n\nIs the draft right? Or what's the one thing that changes everything here?",
     "days_ago": 1},
    {"domain": "HR Modernisation",
     "query": "How do you build skills taxonomy for roles that don't fully exist yet — like AI-native HR Business Partners?",
     "ai_attempt": "Skills taxonomy development typically starts with job analysis and competency mapping. For emerging roles, you can use adjacent role analysis...",
     "km_draft": "For AI-native roles with no clear precedent: (1) Start from outcomes, not activities — what decisions will this role make that AI cannot? (2) Map the human judgment moments in the current process. (3) Build the taxonomy backwards from those moments...",
     "confidence_score": 0.41, "failure_count": 89, "tagged_mg_idx": 2,
     "agent_prompt": "AI Guru has a 41% failure rate on skills taxonomy for AI-native HR roles — 89 unanswered queries this week 📊.\n\nKM has staged a draft response. This is your domain, @Ananya.\n\nIs the draft approach correct? Or what's the framework you'd actually use with a client on this?",
     "days_ago": 3},
]

ORGANIC_SPARKS = [
    {"domain": "Finance Transformation",
     "signal": "3 separate BFSI clients flagging AI-driven accrual estimation as a priority this quarter — pattern emerging across Finance Ops.",
     "prompt": "📡 Organic Spark — Finance Transformation\n\nWe're detecting a signal across 3 client accounts: AI-driven accrual estimation is becoming a boardroom priority, not just a back-office experiment.\n\nHas anyone encountered this on current engagements? What's driving it — regulatory pressure, cost targets, or something else?\n\nNo pressure to respond — but if you've seen this, the community would love your read on it. 👇",
     "source": "Client signal aggregation", "response_count": 2, "days_ago": 4},
    {"domain": "Supply Chain",
     "signal": "Procurement teams in manufacturing sector underestimating supplier risk velocity — flagged by 4 Genpact delivery teams this month.",
     "prompt": "📡 Organic Spark — Supply Chain\n\nFour Genpact delivery teams flagged the same thing this month: procurement clients are measuring supplier risk as a point-in-time score, completely missing velocity.\n\n@Gurus in Supply Chain — has anyone cracked how to get a client team to actually change how they score risk? What was the trigger that shifted their thinking?\n\nShare if it's on your mind. Zero obligation. 👇",
     "source": "Delivery team signals", "response_count": 1, "days_ago": 6},
]

BROADCASTS = [
    {"guru_idx": 0, "bu_head_name": "Rajesh Kumar (BU Head, Finance)", "reviews_this_month": 14,
     "escalation_saves": 8, "learners_protected": 2000,
     "message_preview": "Hi Rajesh, just wanted to share that Priya Venkataraman acted as our core capability shield this month — reviewing 14 Finance Transformation knowledge assets and resolving 8 AI escalations, directly protecting the accuracy of content reaching 2,000+ learners in your business unit. Her turnaround time averaged 4.2 hours. This is the kind of governance that keeps our AI Guru performing at the standard your teams expect.",
     "status": "sent", "days_ago": 5},
]

NOTIFICATIONS_DATA = [
    (0, "stump_the_master", "AI Guru needs your sign-off — Working Capital",
     "AI Guru has a 34% confidence rate on seasonal working capital queries (47 unanswered). KM has staged a draft. Your expert sign-off needed."),
    (1, "reality_check", "New KM draft ready for your Reality Check",
     "KM just posted a Supplier Risk Velocity methodology draft. Rate it 1–3 — takes 30 seconds."),
    (0, "broadcast_sent", "Executive Broadcast sent to your BU Head",
     "Your monthly contribution summary was automatically shared with Rajesh Kumar (BU Head, Finance). 14 reviews, 8 escalation saves highlighted."),
    (2, "stump_the_master", "AI Guru stumped on AI-native HR skills taxonomy",
     "89 unanswered queries in your domain this week. KM has a draft waiting for your expert stamp."),
    (1, "organic_spark", "New Organic Spark in Supply Chain",
     "4 delivery teams flagging the same supplier risk pattern. Your read on this would be valuable. Zero pressure."),
]


def _patch_new_gurus(db: Session):
    """Add new gurus introduced after initial seed without wiping existing data."""
    existing_names = {g.name for g in db.query(Guru).all()}
    base = datetime.utcnow() - timedelta(days=200)
    for g in GURUS:
        if g["name"] not in existing_names:
            obj = Guru(**{k: v for k, v in g.items()},
                       joined_at=base - timedelta(days=random.randint(50, 300)))
            db.add(obj)
    db.commit()


def _patch_new_drafts(db: Session):
    """Add new KM drafts introduced after initial seed without wiping existing data."""
    new_titles = ["Agentic AI Course 2.0 — Learning Curriculum Draft"]
    for title in new_titles:
        exists = db.query(KMDraft).filter(KMDraft.title == title).first()
        if not exists:
            draft_data = next((d for d in KM_DRAFTS if d["title"] == title), None)
            if draft_data:
                db.add(KMDraft(
                    km_name=draft_data["km_name"], domain=draft_data["domain"],
                    title=draft_data["title"], content=draft_data["content"],
                    tags=draft_data["tags"], agent_prompt=draft_data["agent_prompt"],
                    status=draft_data["status"], avg_rating=0.0, rating_count=0,
                    created_at=datetime.utcnow() - timedelta(days=draft_data["days_ago"])))
                db.commit()


def _patch_mg_escalated_demo(db: Session):
    """Ensure at least one mg_escalated draft exists so MG Approvals shows live demo data."""
    exists = db.query(KMDraft).filter(KMDraft.status == "mg_escalated").first()
    if exists:
        return
    # Escalate an existing needs_revision or pending draft to mg_escalated as a demo
    demo_title = "Working Capital Optimisation — AI-Assisted Treasury Playbook"
    already = db.query(KMDraft).filter(KMDraft.title == demo_title).first()
    if not already:
        demo_draft = KMDraft(
            km_name="Arjun Mehta (KM)", domain="Finance Transformation",
            title=demo_title,
            content="AI-assisted treasury management combines cash flow forecasting models with dynamic liquidity buffers. Key components: (1) Rolling 13-week cash flow forecast using ML on historical patterns. (2) Automated variance alerts when actuals deviate >5% from forecast. (3) Recommended liquidity buffer sizing based on cash flow volatility. (4) Supplier payment optimisation — dynamic terms aligned to working capital targets. This playbook reduces manual treasury cycles from weekly to near-real-time.",
            tags="treasury,working-capital,AI,cash-flow,playbook",
            agent_prompt="KM has drafted an AI-assisted Working Capital Optimisation playbook. Finance Transformation Gurus — Reality Check 💰\n\nDoes this treasury approach actually hold up in a complex, multi-entity corporate treasury environment?\n\n1 = Won't survive a CFO review\n2 = Right direction, missing one key element\n3 = This is exactly what we'd propose to a treasury client\n\nIf it's not a 3, what's the gap?",
            status="mg_escalated", avg_rating=2.0, rating_count=1,
            created_at=datetime.utcnow() - timedelta(days=1),
        )
        db.add(demo_draft)
        db.commit()
        # Add a demo rating showing a Guru flagged this for MG review
        demo_draft_obj = db.query(KMDraft).filter(KMDraft.title == demo_title).first()
        if demo_draft_obj:
            guru = db.query(Guru).filter(Guru.is_master_guru == False).first()  # noqa
            if guru:
                from app.models import RealityCheckRating
                db.add(RealityCheckRating(
                    draft_id=demo_draft_obj.id, guru_id=guru.id,
                    rating=2,
                    missing_link="The multi-entity consolidation scenario is missing — most large treasury clients run across 20+ entities and the liquidity buffer sizing doesn't account for intercompany netting.",
                    created_at=datetime.utcnow() - timedelta(hours=3),
                ))
                db.commit()


def _patch_corpus_discussions(db: Session):
    """Run AI Guru quality agent to seed Corpus Discussion items if none exist from the agent."""
    from app.models import OrganicSpark
    agent_sparks = db.query(OrganicSpark).filter(OrganicSpark.source == "AI Guru Quality Agent").first()
    if not agent_sparks:
        from app.agents import ai_guru_quality
        ai_guru_quality.run(db)


def seed(db: Session):
    if db.query(Guru).count() > 0:
        _patch_new_gurus(db)
        _patch_new_drafts(db)
        _patch_mg_escalated_demo(db)
        _patch_corpus_discussions(db)
        return

    base = datetime.utcnow() - timedelta(days=45)
    guru_objs = []
    for g in GURUS:
        obj = Guru(**{k: v for k, v in g.items()},
                   joined_at=base - timedelta(days=random.randint(100, 500)))
        db.add(obj)
        guru_objs.append(obj)
    db.flush()

    # Feed posts
    post_objs = []
    for p in FEED_POSTS:
        obj = FeedPost(guru_id=guru_objs[p["guru_idx"]].id, post_type=p["post_type"],
                       title=p["title"], content=p["content"], domain=p["domain"],
                       tags=p["tags"], views=p["views"], agent_generated=False,
                       created_at=datetime.utcnow() - timedelta(days=p["days_ago"]))
        db.add(obj)
        post_objs.append(obj)
    db.flush()

    for post in post_objs:
        for guru in random.sample(guru_objs, min(random.randint(2, 4), len(guru_objs))):
            if guru.id != post.guru_id:
                db.add(Reaction(post_id=post.id, guru_id=guru.id,
                                reaction_type=random.choice(["insightful", "agree", "useful"])))

    # KM Drafts
    km_draft_objs = []
    for d in KM_DRAFTS:
        obj = KMDraft(
            km_name=d["km_name"], domain=d["domain"], title=d["title"],
            content=d["content"], tags=d["tags"], agent_prompt=d["agent_prompt"],
            status=d["status"],
            avg_rating=d.get("avg_rating", 0.0),
            rating_count=d.get("rating_count", 0),
            created_at=datetime.utcnow() - timedelta(days=d["days_ago"]))
        db.add(obj)
        km_draft_objs.append(obj)
    db.flush()

    # One existing rating on the Supply Chain draft (rated 2 by Rahul)
    if len(km_draft_objs) > 1 and len(guru_objs) > 1:
        db.add(RealityCheckRating(
            draft_id=km_draft_objs[1].id, guru_id=guru_objs[1].id,
            rating=2, missing_link="The ESG weighting (10%) is too low for FMCG clients — regulatory pressure is making ESG a top-3 risk factor, not a rounding error.",
            created_at=datetime.utcnow() - timedelta(days=2)))

    # Stump the Master
    for s in STUMP_DATA:
        tagged_id = guru_objs[s["tagged_mg_idx"]].id if s["tagged_mg_idx"] < len(guru_objs) else None
        obj = StumpTheMaster(
            domain=s["domain"], query=s["query"], ai_attempt=s["ai_attempt"],
            km_draft=s["km_draft"], confidence_score=s["confidence_score"],
            failure_count=s["failure_count"], tagged_mg_id=tagged_id,
            agent_prompt=s["agent_prompt"], status="open",
            created_at=datetime.utcnow() - timedelta(days=s["days_ago"]))
        db.add(obj)

    # Organic Spark
    for o in ORGANIC_SPARKS:
        db.add(OrganicSpark(
            domain=o["domain"], signal=o["signal"], prompt=o["prompt"],
            source=o["source"], response_count=o["response_count"],
            created_at=datetime.utcnow() - timedelta(days=o["days_ago"])))

    # Executive Broadcasts
    for b in BROADCASTS:
        obj = ExecutiveBroadcast(
            guru_id=guru_objs[b["guru_idx"]].id,
            bu_head_name=b["bu_head_name"],
            reviews_this_month=b["reviews_this_month"],
            escalation_saves=b["escalation_saves"],
            learners_protected=b["learners_protected"],
            message_preview=b["message_preview"],
            status=b["status"],
            sent_at=datetime.utcnow() - timedelta(days=b["days_ago"]),
            created_at=datetime.utcnow() - timedelta(days=b["days_ago"] + 1))
        db.add(obj)

    # Notifications
    for guru_idx, ntype, title, msg in NOTIFICATIONS_DATA:
        db.add(Notification(guru_id=guru_objs[guru_idx].id, type=ntype,
                            title=title, message=msg))

    # Pipeline candidates
    from app.agents.pipeline_agent import MOCK_HR_DATA, _score, _signals, _draft
    existing_names = {g.name for g in guru_objs}
    for person in MOCK_HR_DATA:
        if person["name"] not in existing_names:
            db.add(PipelineCandidate(
                name=person["name"], title=person["title"], grade=person["grade"],
                domain=person["domain"], business_unit=person["business_unit"],
                signal_score=_score(person), signals=json.dumps(_signals(person)),
                outreach_draft=_draft(person), status="identified"))

    db.commit()
