import base64
import io
import json
import os
import traceback
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Tuple

from database import get_database
from decorators.auth import requires_auth
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import RedirectResponse, StreamingResponse
from glogger import logger
from google.cloud import storage
from google.oauth2 import service_account
from models.error import (
    ErrorCode,
    StandardErrorResponse,
    create_upload_error_response,
)
from models.upload import (
    ErrorContext,
    MediaDimensions,
    ProcessedMediaFile,
    UploadResponse,
)
from models.video import VideoMetadata, VideoProcessingJob
from PIL import Image, ImageOps

router = APIRouter()

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/avi"]

MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_VIDEO_SIZE = 100 * 1024 * 1024
MAX_IMAGE_LENGTH = 1200
IMAGE_SIZES = [1200, 750, 500]
OUTPUT_FORMAT = "webp"

GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")
if not GCS_BUCKET_NAME:
    raise ValueError("GCS_BUCKET_NAME environment variable not set")

# Allowed origins for CORS
ALLOWED_ORIGINS = [
    "https://ghostmonk.com",
    "https://www.ghostmonk.com",
    "https://api.ghostmonk.com",
    "http://localhost:3000",
    "http://localhost:5001",
]


def generate_signed_url_or_none(blob, blob_path: str) -> str | None:
    """Generate a signed URL for the blob, returning None if it fails."""
    try:
        signed_url = blob.generate_signed_url(
            version="v4", expiration=timedelta(hours=1), method="GET"
        )
        logger.info(f"Generated signed URL: {signed_url}")
        return signed_url
    except Exception as e:
        logger.error(f"Failed to generate signed URL for {blob_path}: {str(e)}")
        return None


def set_media_response_headers(response, request: Request):
    """Set consistent headers for media responses (both redirect and streaming)."""
    # Cache headers - mobile-friendly, always revalidate
    response.headers["Cache-Control"] = "public, max-age=3600, no-cache"
    response.headers["Vary"] = "Accept-Encoding, Origin"

    # CORS headers - only for allowed origins
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
    # No CORS header for unauthorized domains - blocks cross-origin requests

    # Security and method headers
    response.headers["Access-Control-Allow-Methods"] = "GET"
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"


@router.options("/uploads/{filename:path}")
async def options_media(request: Request, filename: str):
    """Handle CORS preflight requests for images and videos"""
    from fastapi.responses import Response

    response = Response()
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, User-Agent"
    response.headers["Access-Control-Max-Age"] = "86400"  # 24 hours
    return response


@router.get("/uploads/{filename:path}")
async def get_media(request: Request, filename: str, size: int | None = None):
    try:
        logger.info(f"Media request received: {filename}, size: {size}")

        # Log request headers to help debug mobile issues
        user_agent = request.headers.get("user-agent", "Unknown")
        logger.info(f"User-Agent: {user_agent}")

        bucket = get_gcs_bucket()

        if size and size in IMAGE_SIZES:
            base_name, extension = os.path.splitext(filename)
            sized_filename = f"{base_name}_{size}{extension}"
            blob_path = construct_blob_path(sized_filename)
        else:
            blob_path = construct_blob_path(filename)

        logger.info(f"Looking for blob at path: {blob_path}")
        blob = bucket.blob(blob_path)

        if not blob.exists():
            logger.error(f"Media file not found: {blob_path}")
            raise HTTPException(status_code=404, detail="Media file not found")

        logger.info(f"Media file found, attempting to generate signed URL for: {blob_path}")

        signed_url = generate_signed_url_or_none(blob, blob_path)
        if signed_url:
            logger.info(f"Redirecting media request to signed URL: {filename}")
            response = RedirectResponse(url=signed_url, status_code=307)
            set_media_response_headers(response, request)
            return response

        logger.info(f"Falling back to streaming response for: {filename}")
        content_type = blob.content_type or "application/octet-stream"
        media_data = blob.download_as_bytes()

        response = StreamingResponse(io.BytesIO(media_data), media_type=content_type)
        set_media_response_headers(response, request)
        return response

    except Exception as e:
        logger.error(f"Error in get_media for {filename}: {str(e)}")
        handle_error(e, "accessing media")


async def process_single_file(file: UploadFile, bucket) -> ProcessedMediaFile:
    """Process a single uploaded file and return ProcessedMediaFile."""
    contents = await file.read()
    file_size = len(contents)

    if file.content_type in ALLOWED_IMAGE_TYPES:
        return await process_image_file(file, contents, file_size, bucket)
    elif file.content_type in ALLOWED_VIDEO_TYPES:
        return await process_video_file(file, contents, file_size, bucket)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")


async def process_image_file(
    file: UploadFile, contents: bytes, file_size: int, bucket
) -> ProcessedMediaFile:
    """Process an image file and return ProcessedMediaFile."""
    validate_image(file.content_type, file_size)
    new_filename = generate_unique_filename(file.filename)
    base_name, extension = os.path.splitext(new_filename)
    webp_extension = f".{OUTPUT_FORMAT}"

    # Get original image dimensions for aspect ratio calculation
    original_image = Image.open(io.BytesIO(contents))
    original_image = ImageOps.exif_transpose(original_image)
    original_width, original_height = original_image.size

    srcset_entries = []
    primary_url = None
    final_width = original_width
    final_height = original_height

    for size in IMAGE_SIZES:
        sized_filename = (
            f"{base_name}_{size}{webp_extension}"
            if size != max(IMAGE_SIZES)
            else f"{base_name}{webp_extension}"
        )
        resized_image = resize_image(contents, size)

        blob_path, _ = await upload_to_gcs(
            resized_image, sized_filename, f"image/{OUTPUT_FORMAT}", bucket
        )

        # Always use API endpoint instead of signed URLs to avoid expiration issues
        # The API endpoint will handle signed URL generation on-demand
        url = f"/uploads/{sized_filename}"

        srcset_entries.append(f"{url} {size}w")
        if size == max(IMAGE_SIZES):
            primary_url = url
            # Calculate final dimensions for the largest size
            if original_width > size:
                final_width = size
                final_height = int(original_height * size / original_width)

    return ProcessedMediaFile(
        primary_url=primary_url,
        srcset=", ".join(srcset_entries),
        width=final_width,
        height=final_height,
    )


async def process_video_file(
    file: UploadFile, contents: bytes, file_size: int, bucket
) -> ProcessedMediaFile:
    """Process a video file and return ProcessedMediaFile."""
    validate_video(file.content_type, file_size)
    new_filename = generate_unique_filename(file.filename)

    blob_path, _ = await upload_to_gcs(contents, new_filename, file.content_type, bucket)

    # Create video processing job entry
    try:
        db = await get_database()
        video_jobs_collection = db.video_processing_jobs

        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        # Create video metadata using Pydantic model
        video_metadata = VideoMetadata(
            duration_seconds=0.0,  # Will be updated by processing
            width=1280,  # Default, will be updated
            height=720,  # Default, will be updated
            file_size=file_size,
            content_type=file.content_type,
            upload_time=now,
        )

        # Create video processing job using Pydantic model
        job = VideoProcessingJob(
            job_id=job_id,
            original_file=f"uploads/{new_filename}",
            status="pending",  # Will be updated to 'started' by Cloud Function
            created_at=now,
            updated_at=now,
            metadata=video_metadata,
            thumbnail_options=[],
            selected_thumbnail_id="",
            processed_formats=[],
            error_message="",
        )
        await video_jobs_collection.insert_one(job.model_dump())
        logger.info(f"Created video processing job: {job_id} for file: {new_filename}")

    except Exception as e:
        logger.error(f"Failed to create video processing job: {str(e)}")

    primary_url = f"/uploads/{new_filename}"

    return ProcessedMediaFile(
        primary_url=primary_url,
        srcset="",
        width=1280,
        height=720,
    )


@router.post("/uploads", response_model=UploadResponse)
@requires_auth
async def upload_media(request: Request, files: List[UploadFile] = File(...)) -> UploadResponse:
    try:
        urls = []
        srcsets = []
        dimensions = []
        bucket = get_gcs_bucket()

        for file in files:
            try:
                processed_file = await process_single_file(file, bucket)
                urls.append(processed_file.primary_url)
                srcsets.append(processed_file.srcset)
                dimensions.append(
                    MediaDimensions(width=processed_file.width, height=processed_file.height)
                )
            except Exception as e:
                logger.error(f"Failed to process file {file.filename}: {str(e)}")
                if is_structured_http_exception(e):
                    raise e
                handle_error(e, f"uploading media file {file.filename}")

        return UploadResponse(urls=urls, srcsets=srcsets, dimensions=dimensions)

    except Exception as e:
        handle_error(e, "processing uploads")


def resize_image(content: bytes, target_width: int) -> bytes:
    image = Image.open(io.BytesIO(content))
    image = ImageOps.exif_transpose(image)
    width, height = image.size

    new_width = target_width
    new_height = int(height * target_width / width)

    if width > target_width:
        image = image.resize((new_width, new_height), resample=Image.Resampling.LANCZOS)

    output = io.BytesIO()
    image.save(output, format=OUTPUT_FORMAT.upper(), quality=85)
    output.seek(0)
    return output.read()


def get_gcs_bucket():
    try:
        # Check for base64 encoded JSON credentials first
        credentials_json_b64 = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON_B64")
        credentials_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")

        if credentials_json_b64:
            logger.info("Using base64 encoded service account JSON from environment variable")
            try:
                # Decode base64 to get the JSON
                credentials_json = base64.b64decode(credentials_json_b64).decode("utf-8")
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(
                    credentials_info
                )
                storage_client = storage.Client(credentials=credentials)
                logger.info("Successfully created GCS client with base64 decoded JSON credentials")
            except (base64.binascii.Error, json.JSONDecodeError) as e:
                logger.error(f"Failed to decode/parse base64 JSON credentials: {str(e)}")
                raise HTTPException(
                    status_code=500, detail=f"Invalid base64 JSON credentials: {str(e)}"
                )
        elif credentials_json:
            logger.info("Using service account JSON from environment variable")
            try:
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(
                    credentials_info
                )
                storage_client = storage.Client(credentials=credentials)
                logger.info("Successfully created GCS client with JSON credentials")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON credentials: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Invalid JSON credentials: {str(e)}")
        else:
            # Check for file-based credentials
            credentials_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if credentials_file and os.path.exists(credentials_file):
                logger.info(f"Using service account file: {credentials_file}")
                credentials = service_account.Credentials.from_service_account_file(
                    credentials_file
                )
                storage_client = storage.Client(credentials=credentials)
            else:
                logger.info("Using default credentials (Application Default Credentials)")
                storage_client = storage.Client()

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Failed to initialize GCS client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Storage configuration error: {str(e)}")

    return storage_client.bucket(GCS_BUCKET_NAME)


async def upload_to_gcs(file_content, filename, content_type, bucket) -> Tuple[str, str]:
    blob_path = construct_blob_path(filename)
    blob = bucket.blob(blob_path)
    blob.content_type = content_type
    blob.upload_from_string(file_content, content_type=content_type)
    gcs_url = construct_gcs_url(blob_path)
    return blob_path, gcs_url


def construct_blob_path(filename):
    return f"uploads/{filename}"


def construct_gcs_url(blob_path):
    return f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{blob_path}"


def generate_unique_filename(original_filename):
    extension = os.path.splitext(original_filename)[1]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}{extension}"


def validate_image(content_type, file_size):
    if content_type not in ALLOWED_IMAGE_TYPES:
        error_response = create_upload_error_response(
            error_code=ErrorCode.UPLOAD_INVALID_FORMAT,
            file_type="image",
            allowed_formats=["JPEG", "PNG", "GIF", "WebP"],
        )
        raise HTTPException(status_code=400, detail=error_response.model_dump())

    if file_size > MAX_FILE_SIZE:
        error_response = create_upload_error_response(
            error_code=ErrorCode.UPLOAD_FILE_TOO_LARGE,
            file_type="image",
            current_size=file_size,
            max_size=MAX_FILE_SIZE,
        )
        raise HTTPException(status_code=400, detail=error_response.model_dump())


def validate_video(content_type, file_size):
    if content_type not in ALLOWED_VIDEO_TYPES:
        error_response = create_upload_error_response(
            error_code=ErrorCode.UPLOAD_INVALID_FORMAT,
            file_type="video",
            allowed_formats=["MP4", "WebM", "QuickTime", "AVI"],
        )
        raise HTTPException(status_code=400, detail=error_response.model_dump())

    if file_size > MAX_VIDEO_SIZE:
        error_response = create_upload_error_response(
            error_code=ErrorCode.UPLOAD_FILE_TOO_LARGE,
            file_type="video",
            current_size=file_size,
            max_size=MAX_VIDEO_SIZE,
        )
        raise HTTPException(status_code=400, detail=error_response.model_dump())


def is_structured_http_exception(exception: Exception) -> bool:
    """Check if an exception is an HTTPException with a structured error response."""
    return (
        isinstance(exception, HTTPException)
        and isinstance(exception.detail, dict)
        and "error_code" in exception.detail
    )


def handle_error(e, context="operation"):
    error_context = ErrorContext(
        error_type=type(e).__name__,
        error_details=str(e),
        traceback=traceback.format_exc(),
    )

    logger.exception_with_context(
        f"Uploads: {context}",
        error_context.model_dump(),
    )

    if not isinstance(e, HTTPException):
        error_response = create_upload_error_response(
            error_code=ErrorCode.UPLOAD_PROCESSING_FAILED, file_type="generic"
        )
        raise HTTPException(status_code=500, detail=error_response.model_dump())
    raise e
