from fastapi import FastAPI, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from .worker import Worker
from .api_routes import router as api_router

app = FastAPI(title="InBoxIQ API", version="1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/process-now")
async def trigger_manual_poll(background_tasks: BackgroundTasks):
    """
    Manually trigger one email processing cycle.
    """
    logger.info("Manual trigger received.")
    background_tasks.add_task(worker.process_cycle)
    return {"message": "Processing cycle triggered in background"}

@app.get("/automation/status")
async def automation_status():
    """Get autonomous worker runtime status."""
    return worker.get_status()

@app.post("/automation/start")
async def automation_start():
    """Start autonomous worker loop if it is stopped."""
    started = worker.start_auto()
    return {
        "status": "running",
        "started_now": started,
        "details": worker.get_status(),
    }

@app.post("/automation/stop")
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
        file_path = os.path.join(frontend_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    print(f"⚠️ Warning: Frontend dist folder not found at {frontend_path}. Dashboard will not be available.")
    print("Run `cd frontend && npm install && npm run build` to generate it.")
