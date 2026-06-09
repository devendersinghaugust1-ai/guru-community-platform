from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models import FeedPost, Reaction, Comment, Guru

router = APIRouter(prefix="/feed", tags=["feed"])


class PostCreate(BaseModel):
    guru_id: int; title: str; content: str; domain: str
    tags: Optional[str] = ""; post_type: str = "use_case"

class CommentCreate(BaseModel):
    guru_id: int; content: str

class ReactionCreate(BaseModel):
    guru_id: int; reaction_type: str


class PostOut(BaseModel):
    id: int; guru_id: int; post_type: str; title: str; content: str
    domain: str; tags: str; views: int; created_at: datetime; agent_generated: bool
    guru_name: Optional[str] = None; guru_avatar: Optional[str] = None
    guru_avatar_color: Optional[str] = None; guru_title: Optional[str] = None
    is_master_guru: Optional[bool] = None; reaction_count: int = 0; comment_count: int = 0
    class Config: from_attributes = True


@router.get("/", response_model=list[PostOut])
def get_feed(domain: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(FeedPost).order_by(FeedPost.created_at.desc())
    if domain:
        query = query.filter(FeedPost.domain == domain)
    posts = query.all()
    result = []
    for post in posts:
        guru = db.query(Guru).filter(Guru.id == post.guru_id).first()
        result.append(PostOut(
            id=post.id, guru_id=post.guru_id, post_type=post.post_type,
            title=post.title, content=post.content, domain=post.domain,
            tags=post.tags or "", views=post.views, created_at=post.created_at,
            agent_generated=post.agent_generated,
            guru_name=guru.name if guru else "Unknown",
            guru_avatar=guru.avatar_initials if guru else "?",
            guru_avatar_color=guru.avatar_color if guru else "#666",
            guru_title=guru.title if guru else "",
            is_master_guru=guru.is_master_guru if guru else False,
            reaction_count=db.query(Reaction).filter(Reaction.post_id == post.id).count(),
            comment_count=db.query(Comment).filter(Comment.post_id == post.id).count(),
        ))
    return result


@router.post("/posts", response_model=PostOut)
def create_post(data: PostCreate, db: Session = Depends(get_db)):
    guru = db.query(Guru).filter(Guru.id == data.guru_id).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Guru not found")
    post = FeedPost(guru_id=data.guru_id, post_type=data.post_type, title=data.title,
                    content=data.content, domain=data.domain, tags=data.tags, agent_generated=False)
    db.add(post); guru.use_cases_shared += 1; db.commit(); db.refresh(post)
    return PostOut(**{c.name: getattr(post, c.name) for c in post.__table__.columns},
                   guru_name=guru.name, guru_avatar=guru.avatar_initials,
                   guru_avatar_color=guru.avatar_color, guru_title=guru.title,
                   is_master_guru=guru.is_master_guru, reaction_count=0, comment_count=0)


@router.post("/posts/{post_id}/react")
def react_to_post(post_id: int, data: ReactionCreate, db: Session = Depends(get_db)):
    if not db.query(FeedPost).filter(FeedPost.id == post_id).first():
        raise HTTPException(status_code=404, detail="Post not found")
    db.add(Reaction(post_id=post_id, guru_id=data.guru_id, reaction_type=data.reaction_type))
    db.commit()
    return {"status": "ok", "reaction": data.reaction_type}


@router.post("/posts/{post_id}/comments")
def add_comment(post_id: int, data: CommentCreate, db: Session = Depends(get_db)):
    if not db.query(FeedPost).filter(FeedPost.id == post_id).first():
        raise HTTPException(status_code=404, detail="Post not found")
    comment = Comment(post_id=post_id, guru_id=data.guru_id, content=data.content)
    db.add(comment); db.commit(); db.refresh(comment)
    guru = db.query(Guru).filter(Guru.id == data.guru_id).first()
    return {"id": comment.id, "content": comment.content, "created_at": comment.created_at,
            "commenter_name": guru.name if guru else "Unknown",
            "commenter_avatar": guru.avatar_initials if guru else "?",
            "commenter_color": guru.avatar_color if guru else "#666"}


@router.get("/posts/{post_id}/comments")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at).all()
    out = []
    for c in comments:
        guru = db.query(Guru).filter(Guru.id == c.guru_id).first()
        out.append({"id": c.id, "content": c.content, "created_at": c.created_at,
                    "commenter_name": guru.name if guru else "Unknown",
                    "commenter_avatar": guru.avatar_initials if guru else "?",
                    "commenter_color": guru.avatar_color if guru else "#666"})
    return out
