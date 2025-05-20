import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from handlers.backfill import backfill_published_flag
from handlers.stories import router as stories_router
from handlers.uploads import router as uploads_router
from logger import logger

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application turbulent")
    updated_count = await backfill_published_flag()
    logger.info(f"Startup complete. Backfilled {updated_count} stories.")

    yield  # This is where the app runs
    logger.info("Shutting down application")


# Pass the lifespan context manager to FastAPI
app = FastAPI(lifespan=lifespan)

origins = [
    "https://api.ghostmonk.com",
    "https://ghostmonk.com",
    "https://www.ghostmonk.com",
    "http://localhost:3000",
    "http://localhost:5001",
    "http://frontend:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stories_router)
app.include_router(uploads_router)

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
