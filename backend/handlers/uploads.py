import io
import os
import uuid
from datetime import datetime
from typing import List, Tuple

from decorators.auth import requires_auth
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import RedirectResponse, StreamingResponse
from google.cloud import storage
from logger import logger

router = APIRouter()

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

MAX_FILE_SIZE = 5 * 1024 * 1024

GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")
if not GCS_BUCKET_NAME:
    raise ValueError("GCS_BUCKET_NAME environment variable not set")


@router.get("/uploads/{filename:path}")
async def get_image(filename: str):
    try:
        bucket = get_gcs_bucket()
        blob_path = construct_blob_path(filename)
        blob = bucket.blob(blob_path)

        exists = blob.exists()

        if not exists:
            raise HTTPException(status_code=404, detail="Image not found")

        content_type = blob.content_type
        if not content_type:
            content_type = "application/octet-stream"

        image_data = blob.download_as_bytes()

        return StreamingResponse(io.BytesIO(image_data), media_type=content_type)

    except Exception as e:
        handle_error(e, "accessing image")


@router.post("/uploads", response_model=List[str])
@requires_auth
async def upload_images(request: Request, files: List[UploadFile] = File(...)):
    uploaded_files = []

    try:
        bucket = get_gcs_bucket()

        for file in files:
            contents = await file.read()
            file_size = len(contents)
            validate_image(file.content_type, file_size)
            new_filename = generate_unique_filename(file.filename)

            try:
                _, _ = await upload_to_gcs(contents, new_filename, file.content_type, bucket)
                proxy_path = f"/uploads/{new_filename}"
                uploaded_files.append(proxy_path)
            except Exception as e:
                handle_error(e, "uploading image")

        return uploaded_files

    except Exception as e:
        handle_error(e, "processing uploads")


def get_gcs_bucket():
    try:
        storage_client = storage.Client()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Storage configuration error")

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
    if not isinstance(e, HTTPException):
        raise HTTPException(status_code=500, detail=f"Error during {context}: {str(e)}")
    raise e
