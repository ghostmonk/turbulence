import base64
import io
import os
import traceback
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from decorators.auth import requires_auth
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import RedirectResponse, StreamingResponse
from google.cloud import storage
from google.oauth2 import service_account
import json
from logger import logger
from PIL import Image, ImageOps

router = APIRouter()

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_IMAGE_LENGTH = 1200
IMAGE_SIZES = [1200, 750, 500]
OUTPUT_FORMAT = "webp"

GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")
if not GCS_BUCKET_NAME:
    raise ValueError("GCS_BUCKET_NAME environment variable not set")


def generate_signed_url_or_none(blob, blob_path: str) -> Optional[str]:
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


@router.get("/uploads/{filename:path}")
async def get_image(filename: str, size: Optional[int] = None):
    try:
        logger.info(f"Image request received: {filename}, size: {size}")
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
            logger.error(f"Image not found: {blob_path}")
            raise HTTPException(status_code=404, detail="Image not found")

        logger.info(f"Image found, attempting to generate signed URL for: {blob_path}")

        # Try to generate signed URL, fall back to streaming if it fails
        signed_url = generate_signed_url_or_none(blob, blob_path)
        if signed_url:
            logger.info(f"Redirecting image request to signed URL: {filename}")
            # Use 307 to preserve the original request method and add cache headers
            response = RedirectResponse(url=signed_url, status_code=307)
            # Add cache headers to help with browser caching
            response.headers["Cache-Control"] = "public, max-age=3600"  # Cache for 1 hour
            response.headers["Vary"] = "Accept-Encoding"
            return response

        # Fallback: Stream the image through the server
        logger.info(f"Falling back to streaming response for: {filename}")
        content_type = blob.content_type or "application/octet-stream"
        image_data = blob.download_as_bytes()
        
        # Add cache headers for streaming response too
        response = StreamingResponse(io.BytesIO(image_data), media_type=content_type)
        response.headers["Cache-Control"] = "public, max-age=3600"  # Cache for 1 hour
        response.headers["Vary"] = "Accept-Encoding"
        return response

    except Exception as e:
        logger.error(f"Error in get_image for {filename}: {str(e)}")
        handle_error(e, "accessing image")


async def process_single_file(file: UploadFile, bucket) -> Tuple[str, str]:
    """Process a single uploaded file and return (primary_url, srcset)."""
    contents = await file.read()
    file_size = len(contents)
    validate_image(file.content_type, file_size)
    new_filename = generate_unique_filename(file.filename)
    base_name, extension = os.path.splitext(new_filename)
    webp_extension = f".{OUTPUT_FORMAT}"

    srcset_entries = []
    primary_url = None

    for size in IMAGE_SIZES:
        sized_filename = (
            f"{base_name}_{size}{webp_extension}"
            if size != max(IMAGE_SIZES)
            else f"{base_name}{webp_extension}"
        )
        resized_image = resize_image(contents, size)

        blob_path, _ = await upload_to_gcs(resized_image, sized_filename, f"image/{OUTPUT_FORMAT}", bucket)
        
        # Always use API endpoint instead of signed URLs to avoid expiration issues
        # The API endpoint will handle signed URL generation on-demand
        url = f"/uploads/{sized_filename}"
        
        srcset_entries.append(f"{url} {size}w")
        if size == max(IMAGE_SIZES):
            primary_url = url

    return primary_url, ", ".join(srcset_entries)


@router.post("/uploads", response_model=Dict[str, List[str]])
@requires_auth
async def upload_images(request: Request, files: List[UploadFile] = File(...)):
    try:
        uploaded_files = {"urls": [], "srcsets": []}
        bucket = get_gcs_bucket()

        for file in files:
            try:
                primary_url, srcset = await process_single_file(file, bucket)
                uploaded_files["urls"].append(primary_url)
                uploaded_files["srcsets"].append(srcset)
            except Exception as e:
                logger.error(f"Failed to process file {file.filename}: {str(e)}")
                handle_error(e, f"uploading image {file.filename}")

        return uploaded_files

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
                credentials_json = base64.b64decode(credentials_json_b64).decode('utf-8')
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                storage_client = storage.Client(credentials=credentials)
                logger.info("Successfully created GCS client with base64 decoded JSON credentials")
            except (base64.binascii.Error, json.JSONDecodeError) as e:
                logger.error(f"Failed to decode/parse base64 JSON credentials: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Invalid base64 JSON credentials: {str(e)}")
        elif credentials_json:
            logger.info("Using service account JSON from environment variable")
            try:
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
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
                credentials = service_account.Credentials.from_service_account_file(credentials_file)
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
        raise HTTPException(status_code=400, detail=f"Invalid image type: {content_type}")

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, detail=f"Image too large. Maximum size is {MAX_FILE_SIZE/1024/1024}MB"
        )


def handle_error(e, context="operation"):
    logger.exception_with_context(
        f"Uploads: {context}",
        {
            "error_type": type(e).__name__,
            "error_details": str(e),
            "traceback": traceback.format_exc(),
        },
    )
    if not isinstance(e, HTTPException):
        raise HTTPException(status_code=500, detail=f"Error during {context}: {str(e)}")
    raise e
