import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from handlers.posts import router
from logger import logger

app = FastAPI()

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
logger.info("Starting application turbulent")

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)