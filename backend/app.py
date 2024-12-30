import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import logging as gcp_logging

from handlers.posts import router

app = FastAPI()

origins = [
    "https://api.ghostmonk.com",
    "https://ghostmonk.com",
    "https://www.ghostmonk.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = gcp_logging.Client()
client.setup_logging()

logger = logging.getLogger("ghostmonk-turbulence")
logger.setLevel(logging.INFO)
logger.info("Starting application turbulent")

app.include_router(router)

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)