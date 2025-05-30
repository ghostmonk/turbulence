import io
import os
import traceback
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from decorators.auth import requires_auth
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from google.cloud import storage
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


@router.get("/uploads/{filename:path}")
async def get_image(filename: str, size: Optional[int] = None):
    try:
        bucket = get_gcs_bucket()
        
        if size and size in IMAGE_SIZES:
            base_name, extension = os.path.splitext(filename)
            sized_filename = f"{base_name}_{size}{extension}"
            blob_path = construct_blob_path(sized_filename)
        else:
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


@router.post("/uploads", response_model=Dict[str, List[str]])
@requires_auth
async def upload_images(request: Request, files: List[UploadFile] = File(...)):
    uploaded_files = {"urls": [], "srcsets": []}

    try:
        bucket = get_gcs_bucket()

        for file in files:
            contents = await file.read()
            file_size = len(contents)
            validate_image(file.content_type, file_size)
            new_filename = generate_unique_filename(file.filename)
            base_name, extension = os.path.splitext(new_filename)
            
            webp_extension = f".{OUTPUT_FORMAT}"
            
            srcset_entries = []
            primary_url = None
            
            try:
                for size in IMAGE_SIZES:
                    sized_filename = f"{base_name}_{size}{webp_extension}" if size != max(IMAGE_SIZES) else f"{base_name}{webp_extension}"
                    resized_image = resize_image(contents, size)
                    
                    _, _ = await upload_to_gcs(resized_image, sized_filename, f"image/{OUTPUT_FORMAT}", bucket)
                    
                    url = f"/uploads/{sized_filename}"
                    
                    srcset_entries.append(f"{url} {size}w")
                    
                    if size == max(IMAGE_SIZES):
                        primary_url = url
                
                # Add to response
                uploaded_files["urls"].append(primary_url)
                uploaded_files["srcsets"].append(", ".join(srcset_entries))
                
            except Exception as e:
                handle_error(e, "uploading image")

        return uploaded_files

    except Exception as e:
        handle_error(e, "processing uploads")


def resize_image(content: bytes, target_width: int) -> bytes:
    image = Image.open(io.BytesIO(content))
    image = ImageOps.exif_transpose(image)
    width, height = image.size
    
    # Calculate new dimensions maintaining aspect ratio
    new_width = target_width
    new_height = int(height * target_width / width)
    
    # Only resize if the image is larger than target
    if width > target_width:
        image = image.resize((new_width, new_height), resample=Image.Resampling.LANCZOS)
    
    output = io.BytesIO()
    
    # Save as WebP with good quality
    image.save(output, format=OUTPUT_FORMAT.upper(), quality=85)
    output.seek(0)
    return output.read()


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
