from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.agents import knowledge_capture, pipeline_agent, alert_agent, ai_guru_quality, nudge_agent

router = APIRouter(prefix="/agents", tags=["agents"])


class UseCaseInput(BaseModel):
    guru_id: int; domain: str; raw_text: str


@router.post("/knowledge-capture")
def run_knowledge_capture(data: UseCaseInput, db: Session = Depends(get_db)):
    return knowledge_capture.run(data.raw_text, data.guru_id, data.domain, db)


@router.post("/pipeline-scan")
def run_pipeline_scan(db: Session = Depends(get_db)):
    return pipeline_agent.run(db)


@router.post("/alert-scan")
def run_alert_scan(db: Session = Depends(get_db)):
    return alert_agent.run(db)


@router.post("/ai-guru-quality")
def run_ai_guru_quality(db: Session = Depends(get_db)):
    return ai_guru_quality.run(db)


@router.post("/nudge-scan")
def run_nudge_scan(db: Session = Depends(get_db)):
    return nudge_agent.run(db)
