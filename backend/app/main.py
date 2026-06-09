from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from app.database import init_db, SessionLocal
from app.seed import seed
from app.routers import feed, gurus, notifications, pipeline, reports, agents, approvals, km
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Guru Community Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes (prefixed with /api in production) ──────────
app.include_router(feed.router, prefix="/api")
app.include_router(gurus.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(pipeline.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(approvals.router, prefix="/api")
app.include_router(km.router, prefix="/api")

# Keep old routes working for local dev (no /api prefix)
app.include_router(feed.router)
app.include_router(gurus.router)
app.include_router(notifications.router)
app.include_router(pipeline.router)
app.include_router(reports.router)
app.include_router(agents.router)
app.include_router(approvals.router)
app.include_router(km.router)

# ── Serve React frontend static files ─────────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Let API routes pass through
        if full_path.startswith("api/"):
            return {"error": "not found"}
        index = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index):
            return FileResponse(index)
        return {"status": "Guru Community Platform API running", "docs": "/docs"}
else:
    @app.get("/")
    async def root():
        return {"status": "Guru Community Platform running", "docs": "/docs"}
