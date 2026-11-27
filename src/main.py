from fastapi import FastAPI, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from pathlib import Path
from .worker import Worker
from .api_routes import router as api_router

# API docs list every endpoint; only expose them when INBOXIQ_DEBUG=1.
_DEBUG = os.getenv("INBOXIQ_DEBUG") == "1"
app = FastAPI(
    title="InBoxIQ API", version="1.0",
    docs_url="/docs" if _DEBUG else None,
    redoc_url="/redoc" if _DEBUG else None,
    openapi_url="/openapi.json" if _DEBUG else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    # Only the app's own origins. Extra origins can be added via CORS_ORIGINS.
    allow_origins=[
        "http://localhost:8001", "http://127.0.0.1:8001",
        "http://localhost:5173", "http://127.0.0.1:5173",
    ] + [o for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-InBoxIQ-Token"],
)

from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

ALLOWED_HOSTS = ["localhost", "127.0.0.1"] + \
    [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]
ALLOWED_ORIGINS = {"http://localhost:8001", "http://127.0.0.1:8001",
                   "http://localhost:5173", "http://127.0.0.1:5173"} | \
    {o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()}


class OriginGuard(BaseHTTPMiddleware):
    """Block cross-site writes (CSRF). Not a login: it only stops other web pages
    from driving the API through your browser. A real login is still on the roadmap."""
    async def dispatch(self, request, call_next):
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            origin = request.headers.get("origin")
            if origin and origin not in ALLOWED_ORIGINS:
                return JSONResponse({"detail": "Cross-origin request blocked"}, status_code=403)
        return await call_next(request)


from .security import RateLimit, SecurityHeaders

# Starlette runs middleware in REVERSE order of add_middleware. Effective order:
# TrustedHost -> SecurityHeaders -> OriginGuard -> RateLimit -> CORS -> app.
# OriginGuard runs before RateLimit, so cross-site requests cannot use up the limit.
app.add_middleware(RateLimit)
app.add_middleware(OriginGuard)
app.add_middleware(SecurityHeaders)
# Rejects DNS-rebinding: requests must use a known Host header.
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

from fastapi import Depends
from .api_routes import public_router
from .auth import require_token

app.include_router(public_router)
app.include_router(api_router)

# Frontend dist folder (mounted later so API routes win)
frontend_path = os.path.join(os.getcwd(), "frontend", "dist")

logger = logging.getLogger("InBoxIQ.API")

# Initialize worker but don't run the loop here
worker = Worker()

@app.on_event("startup")
async def startup_event():
    logger.info("Starting autonomous worker loop...")
    worker.start_auto()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Stopping autonomous worker loop...")
    worker.stop_auto()

@app.get("/")
async def root():
    # If frontend exists, serve it. Otherwise return status.
    frontend_index = os.path.join(frontend_path, "index.html")
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    return {"status": "InBoxIQ API is running (Frontend not built)", "manual_trigger": "/process-now"}

@app.post("/process-now", dependencies=[Depends(require_token)])
async def trigger_manual_poll(background_tasks: BackgroundTasks):
    """
    Manually trigger one email processing cycle.
    """
    logger.info("Manual trigger received.")
    background_tasks.add_task(worker.process_cycle)
    return {"message": "Processing cycle triggered in background"}

@app.get("/automation/status", dependencies=[Depends(require_token)])
async def automation_status():
    """Get autonomous worker runtime status."""
    return worker.get_status()

@app.post("/automation/start", dependencies=[Depends(require_token)])
async def automation_start():
    """Start autonomous worker loop if it is stopped."""
    started = worker.start_auto()
    return {
        "status": "running",
        "started_now": started,
        "details": worker.get_status(),
    }

@app.post("/automation/stop", dependencies=[Depends(require_token)])
async def automation_stop():
    """Stop autonomous worker loop."""
    worker.stop_auto()
    return {
        "status": "stopped",
        "details": worker.get_status(),
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "worker": worker.get_status(),
    }

# Mount frontend static files LAST (so it can't swallow API/health routes)
if os.path.exists(frontend_path):
    # Serve built assets
    assets_dir = os.path.join(frontend_path, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve static file if it exists, otherwise fall back to SPA index.html.
        root = Path(frontend_path).resolve()
        file_path = (root / full_path).resolve()
        # Only serve files that stay inside the dist folder (blocks ../ traversal).
        if file_path.is_relative_to(root) and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    print(f"⚠️ Warning: Frontend dist folder not found at {frontend_path}. Dashboard will not be available.")
    print("Run `cd frontend && npm install && npm run build` to generate it.")
