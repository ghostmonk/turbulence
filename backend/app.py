import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from handlers.posts import router
from handlers.backfill import backfill_published_flag
from logger import logger

load_dotenv()

# Define lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: run before the application starts
    logger.info("Starting application turbulent")
    # Run backfill to ensure all posts have is_published flag
    updated_count = await backfill_published_flag()
    logger.info(f"Startup complete. Backfilled {updated_count} posts.")
    
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
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)