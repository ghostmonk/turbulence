import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from handlers.backfill import backfill_published_flag
from handlers.stories import router as stories_router
from handlers.uploads import router as uploads_router
from logger import logger

load_dotenv()


# Define lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: run before the application starts
    logger.info("Starting application turbulent")
    # Run backfill to ensure all stories have is_published flag
    updated_count = await backfill_published_flag()
    logger.info(f"Startup complete. Backfilled {updated_count} stories.")

    yield  # This is where the app runs

    # Shutdown: run when the application is shutting down
    logger.info("Shutting down application")


# Pass the lifespan context manager to FastAPI
app = FastAPI(lifespan=lifespan)

origins = [
    "https://api.ghostmonk.com",
    "https://ghostmonk.com",
    "https://www.ghostmonk.com",
    "http://localhost:3000",
    "http://localhost:5001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up static file serving
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include routers
app.include_router(stories_router)
app.include_router(uploads_router)

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
