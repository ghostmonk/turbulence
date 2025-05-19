import os
import uuid
from datetime import datetime
from typing import List
import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from logger import logger
from decorators.auth import requires_auth
from google.cloud import storage

# Create uploads router
router = APIRouter()

# Define allowed image mime types
ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
]

# Define maximum file size (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024

# Google Cloud Storage configuration
# Get bucket name from environment variable or use default
BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME", "turbulence-uploads")

# Initialize GCS client
try:
    storage_client = storage.Client()
    # Check if bucket exists, create if it doesn't
    try:
        bucket = storage_client.get_bucket(BUCKET_NAME)
    except Exception:
        logger.info(f"Bucket {BUCKET_NAME} does not exist. You need to create it manually in GCP console.")
        bucket = None
    logger.info(f"Successfully connected to GCS bucket: {BUCKET_NAME}")
except Exception as e:
    logger.error(f"Failed to initialize GCS client: {str(e)}")
    storage_client = None
    bucket = None


@router.post("/uploads", response_model=List[str])
@requires_auth
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload one or more image files to Google Cloud Storage
    """
    # Check if GCS client is initialized
    if not storage_client or not bucket:
        raise HTTPException(status_code=500, detail="Google Cloud Storage not configured properly")
    
    uploaded_files = []
    
    try:
        for file in files:
            # Check mime type
            if file.content_type not in ALLOWED_MIME_TYPES:
                logger.warning(f"Invalid file type: {file.content_type}")
                raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}")
            
            # Check file size
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE:
                logger.warning(f"File too large: {len(contents)} bytes")
                raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {MAX_FILE_SIZE/1024/1024}MB")
            
            # Generate unique filename to avoid collisions
            extension = os.path.splitext(file.filename)[1]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            new_filename = f"{timestamp}_{unique_id}{extension}"
            
            # Create a blob in the bucket and upload the file contents
            blob = bucket.blob(f"uploads/{new_filename}")
            blob.upload_from_string(
                contents,
                content_type=file.content_type
            )
            
            # Make the blob publicly accessible
            blob.make_public()
            
            # Get the public URL
            file_url = blob.public_url
            uploaded_files.append(file_url)
            
            logger.info(f"File uploaded to GCS: {file_url}")
        
        return uploaded_files
    
    except Exception as e:
        if not isinstance(e, HTTPException):
            logger.exception(f"Error uploading files to GCS: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")
        raise 