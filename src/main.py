from fastapi import FastAPI, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import logging
import os
from .worker import Worker
from .api_routes import router as api_router

app = FastAPI(title="InBoxIQ API", version="1.0")
app.include_router(api_router)

# Mount frontend static files
frontend_path = os.path.join(os.getcwd(), "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve the index.html for all non-API routes (SPA support)
        if full_path.startswith("api"):
            return None # Should be handled by router
        return FileResponse(os.path.join(frontend_path, "index.html"))
else:
    logger.warning(f"Frontend dist folder not found at {frontend_path}. Dashboard will not be available.")
logger = logging.getLogger("InBoxIQ.API")

# Initialize worker but don't run the loop here
worker = Worker()

@app.get("/")
async def root():
    return {"status": "InBoxIQ API is running", "manual_trigger": "/process-now"}

@app.post("/process-now")
async def trigger_manual_poll(background_tasks: BackgroundTasks):
    """
    Manually trigger one email processing cycle.
    """
    logger.info("Manual trigger received.")
    background_tasks.add_task(worker.process_cycle)
    return {"message": "Processing cycle triggered in background"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
