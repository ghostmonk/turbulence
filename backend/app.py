import os
from contextlib import asynccontextmanager
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from handlers.backfill import backfill_published_flag
from handlers.stories import router as stories_router
from handlers.uploads import router as uploads_router
from logger import logger
from middleware.logging_middleware import LoggingMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse
from handlers.video_processing import router as video_processing_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application turbulent")

    # Debug environment variables for GCS credentials
    gcs_bucket = os.environ.get("GCS_BUCKET_NAME")
    google_creds_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    google_creds_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")

    logger.info(f"Environment debug - GCS_BUCKET_NAME: {'SET' if gcs_bucket else 'NOT_SET'}")
    logger.info(
        f"Environment debug - GOOGLE_APPLICATION_CREDENTIALS: {'SET' if google_creds_file else 'NOT_SET'}"
    )
    logger.info(
        f"Environment debug - GOOGLE_APPLICATION_CREDENTIALS_JSON: {'SET' if google_creds_json else 'NOT_SET'}"
    )

    if google_creds_json:
        logger.info(
            f"GOOGLE_APPLICATION_CREDENTIALS_JSON length: {len(google_creds_json)} characters"
        )
    if google_creds_file:
        logger.info(f"GOOGLE_APPLICATION_CREDENTIALS file path: {google_creds_file}")
    updated_count = await backfill_published_flag()
    logger.info(f"Startup complete. Backfilled {updated_count} stories.")

    yield  # This is where the app runs

    # Cleanup database connections
    logger.info("Shutting down application")
    from database import close_db_connection

    await close_db_connection()


app = FastAPI(lifespan=lifespan)
app.add_middleware(LoggingMiddleware)
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


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with detailed logging"""
    error_detail = exc.detail

    logger.error_with_context(
        f"HTTP exception: {exc.status_code}",
        {
            "path": request.url.path,
            "method": request.method,
            "status_code": exc.status_code,
            "detail": error_detail,
            "client_host": request.client.host if request.client else "unknown",
        },
    )

    return JSONResponse(status_code=exc.status_code, content={"detail": error_detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed logging"""
    errors = exc.errors()
    error_details = []

    for error in errors:
        error_details.append(
            {
                "loc": error.get("loc", []),
                "msg": error.get("msg", ""),
                "type": error.get("type", ""),
            }
        )

    logger.error_with_context(
        "Request validation error",
        {
            "path": request.url.path,
            "method": request.method,
            "client_host": request.client.host if request.client else "unknown",
            "validation_errors": error_details,
        },
    )

    return JSONResponse(
        status_code=422, content={"detail": "Validation Error", "errors": error_details}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions with detailed logging"""
    logger.exception_with_context(
        "Unhandled exception",
        {
            "path": request.url.path,
            "method": request.method,
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "client_host": request.client.host if request.client else "unknown",
        },
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "error_type": type(exc).__name__,
            "message": str(exc),
        },
    )


@app.get("/health")
async def health_check():
    """Fast health check endpoint for keep-alive pings"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/warmup")
async def warmup():
    """Warm-up endpoint that ensures database connection and caches are ready"""
    try:
        # Test database connection
        from database import get_database

        db = await get_database()
        # Quick database ping
        await db.command("ping")

        logger.info("Warmup successful - database connected")
        return {"status": "warm", "timestamp": datetime.now().isoformat(), "database": "connected"}
    except Exception as e:
        logger.error(f"Warmup failed: {str(e)}")
        return {
            "status": "cold",
            "timestamp": datetime.now().isoformat(),
            "database": "failed",
            "error": str(e),
        }


app.include_router(stories_router)
app.include_router(uploads_router)
app.include_router(video_processing_router)

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
