from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Guru(Base):
    __tablename__ = "gurus"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(100))
    grade: Mapped[str] = mapped_column(String(20))  # VP, SVP, MD
    domain: Mapped[str] = mapped_column(String(100))
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    certifications: Mapped[str] = mapped_column(Text, default="")
    avatar_initials: Mapped[str] = mapped_column(String(4))
    avatar_color: Mapped[str] = mapped_column(String(10), default="#0078d4")
    is_master_guru: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Legacy metrics (kept for compat)
    use_cases_shared: Mapped[int] = mapped_column(Integer, default=0)
    learners_impacted: Mapped[int] = mapped_column(Integer, default=0)
    ai_guru_corrections: Mapped[int] = mapped_column(Integer, default=0)
    domain_rank: Mapped[int] = mapped_column(Integer, default=0)

    # New Review & React metrics
    reviews_completed: Mapped[int] = mapped_column(Integer, default=0)
    review_turnaround_hrs: Mapped[float] = mapped_column(Float, default=0.0)
    escalation_saves: Mapped[int] = mapped_column(Integer, default=0)
    contribution_index: Mapped[int] = mapped_column(Integer, default=0)  # 0-100
    narrative: Mapped[str] = mapped_column(Text, default="")

    posts: Mapped[list["FeedPost"]] = relationship("FeedPost", back_populates="guru")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="guru")


class FeedPost(Base):
    __tablename__ = "feed_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    guru_id: Mapped[int] = mapped_column(ForeignKey("gurus.id"))
    post_type: Mapped[str] = mapped_column(String(50))  # use_case, ai_correction, welcome, milestone, domain_insight
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    domain: Mapped[str] = mapped_column(String(100))
    tags: Mapped[str] = mapped_column(String(300), default="")
    views: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    agent_generated: Mapped[bool] = mapped_column(Boolean, default=False)

    guru: Mapped["Guru"] = relationship("Guru", back_populates="posts")
    reactions: Mapped[list["Reaction"]] = relationship("Reaction", back_populates="post")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="post")


class Reaction(Base):
    __tablename__ = "reactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("feed_posts.id"))
    guru_id: Mapped[int] = mapped_column(ForeignKey("gurus.id"))
    reaction_type: Mapped[str] = mapped_column(String(20))  # insightful, agree, useful
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    post: Mapped["FeedPost"] = relationship("FeedPost", back_populates="reactions")


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("feed_posts.id"))
    guru_id: Mapped[int] = mapped_column(ForeignKey("gurus.id"))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    post: Mapped["FeedPost"] = relationship("FeedPost", back_populates="comments")
    commenter: Mapped["Guru"] = relationship("Guru")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    guru_id: Mapped[int] = mapped_column(ForeignKey("gurus.id"))
    type: Mapped[str] = mapped_column(String(50))  # ai_guru_fail, content_stale, peer_post, learner_struggle, pipeline
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    guru: Mapped["Guru"] = relationship("Guru", back_populates="notifications")


class ApprovalQueue(Base):
    __tablename__ = "approval_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    thread_id: Mapped[str] = mapped_column(String(100), unique=True)
    guru_id: Mapped[int] = mapped_column(ForeignKey("gurus.id"))
    domain: Mapped[str] = mapped_column(String(100))
    draft_title: Mapped[str] = mapped_column(String(200))
    draft_content: Mapped[str] = mapped_column(Text)
    draft_tags: Mapped[str] = mapped_column(String(300))
    quality_score: Mapped[float] = mapped_column(Float)
    quality_signals: Mapped[str] = mapped_column(Text)  # JSON
    quality_flags: Mapped[str] = mapped_column(Text)    # JSON
    estimated_reach: Mapped[int] = mapped_column(Integer, default=0)
    corpus_entry: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="pending")  # pending, approved, edited, rejected, auto_approved
    mg_id: Mapped[int] = mapped_column(Integer, nullable=True)
    mg_notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    decided_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)


class KMDraft(Base):
    __tablename__ = "km_drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    km_name: Mapped[str] = mapped_column(String(100))
    domain: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    tags: Mapped[str] = mapped_column(String(300), default="")
    agent_prompt: Mapped[str] = mapped_column(Text, default="")   # gamified prompt shown to Gurus
    status: Mapped[str] = mapped_column(String(30), default="pending")  # pending, approved, needs_revision
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ratings: Mapped[list["RealityCheckRating"]] = relationship("RealityCheckRating", back_populates="draft")


class RealityCheckRating(Base):
    __tablename__ = "reality_check_ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    draft_id: Mapped[int] = mapped_column(ForeignKey("km_drafts.id"))
    guru_id: Mapped[int] = mapped_column(ForeignKey("gurus.id"))
    rating: Mapped[int] = mapped_column(Integer)           # 1, 2, or 3
    missing_link: Mapped[str] = mapped_column(Text, default="")  # one-line correction
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    draft: Mapped["KMDraft"] = relationship("KMDraft", back_populates="ratings")
    guru: Mapped["Guru"] = relationship("Guru")


class StumpTheMaster(Base):
    __tablename__ = "stump_the_master"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    domain: Mapped[str] = mapped_column(String(100))
    query: Mapped[str] = mapped_column(Text)               # the learner question AI Guru failed on
    ai_attempt: Mapped[str] = mapped_column(Text, default="")  # what AI Guru tried to answer
    km_draft: Mapped[str] = mapped_column(Text, default="")    # KM staged response
    confidence_score: Mapped[float] = mapped_column(Float)  # AI Guru confidence (low)
    failure_count: Mapped[int] = mapped_column(Integer, default=1)
    tagged_mg_id: Mapped[int] = mapped_column(ForeignKey("gurus.id"), nullable=True)
    agent_prompt: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="open")  # open, resolved
    mg_correction: Mapped[str] = mapped_column(Text, default="")
    resolved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tagged_mg: Mapped["Guru"] = relationship("Guru")


class OrganicSpark(Base):
    __tablename__ = "organic_spark"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    domain: Mapped[str] = mapped_column(String(100))
    signal: Mapped[str] = mapped_column(Text)              # trend/shift detected
    prompt: Mapped[str] = mapped_column(Text)              # open prompt posted to community
    source: Mapped[str] = mapped_column(String(200), default="")
    response_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ExecutiveBroadcast(Base):
    __tablename__ = "executive_broadcasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    guru_id: Mapped[int] = mapped_column(ForeignKey("gurus.id"))
    bu_head_name: Mapped[str] = mapped_column(String(100))
    reviews_this_month: Mapped[int] = mapped_column(Integer, default=0)
    escalation_saves: Mapped[int] = mapped_column(Integer, default=0)
    learners_protected: Mapped[int] = mapped_column(Integer, default=0)
    message_preview: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="pending")  # pending, sent
    sent_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    guru: Mapped["Guru"] = relationship("Guru")


class PipelineCandidate(Base):
    __tablename__ = "pipeline_candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(100))
    grade: Mapped[str] = mapped_column(String(20))
    domain: Mapped[str] = mapped_column(String(100))
    business_unit: Mapped[str] = mapped_column(String(100))
    signal_score: Mapped[float] = mapped_column(Float, default=0.0)
    signals: Mapped[str] = mapped_column(Text, default="")  # JSON string of signals
    outreach_draft: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="identified")  # identified, outreach_sent, joined
    identified_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
