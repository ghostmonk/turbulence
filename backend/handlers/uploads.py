import os
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Request
from fastapi.responses import JSONResponse
from logger import logger
from decorators.auth import requires_auth
from google.cloud import storage
import io

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

# Define upload directory (create if it doesn't exist) - moved outside the conditional
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
logger.info(f"Upload directory created at: {UPLOAD_DIR}")

# GCS bucket name from environment variable
GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")
if not GCS_BUCKET_NAME:
    logger.warning("GCS_BUCKET_NAME environment variable not set. Falling back to local storage.")


@router.post("/uploads", response_model=List[str])
@requires_auth
async def upload_files(request: Request, files: List[UploadFile] = File(...)):
    """
    Upload one or more image files to Google Cloud Storage or local storage
    """
    logger.info(f"Upload request received from {request.client.host}")
    logger.info(f"Request headers: {dict(request.headers)}")
    
    uploaded_files = []
    
    try:
        logger.info(f"Processing {len(files)} files")
        for i, file in enumerate(files):
            logger.info(f"File {i+1}: {file.filename}, {file.content_type}")
            
            # Check mime type
            if file.content_type not in ALLOWED_MIME_TYPES:
                logger.warning(f"Invalid file type: {file.content_type}")
                raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}")
            
            # Check file size
            contents = await file.read()
            file_size = len(contents)
            logger.info(f"File size: {file_size} bytes")
            
            if file_size > MAX_FILE_SIZE:
                logger.warning(f"File too large: {file_size} bytes")
                raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {MAX_FILE_SIZE/1024/1024}MB")
            
            # Generate unique filename to avoid collisions
            extension = os.path.splitext(file.filename)[1]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            new_filename = f"{timestamp}_{unique_id}{extension}"
            
            # Create a static proxy path that will work through our Next.js proxy
            proxy_path = f"/static/uploads/{new_filename}"
            
            # Try to upload to GCS if bucket name is set
            if GCS_BUCKET_NAME:
                try:
                    logger.info(f"Attempting to upload to GCS bucket: {GCS_BUCKET_NAME}")
                    
                    # Initialize GCS client
                    storage_client = storage.Client()
                    
                    # Get bucket
                    bucket = storage_client.bucket(GCS_BUCKET_NAME)
                    
                    # Create blob and upload
                    blob_path = f"uploads/{new_filename}"
                    blob = bucket.blob(blob_path)
                    
                    # Set content type
                    blob.content_type = file.content_type
                    
                    # Upload from memory
                    blob.upload_from_string(contents, content_type=file.content_type)
                    
                    # Store the real GCS URL in logs for reference
                    gcs_url = f"https://storage.googleapis.com/{GCS_BUCKET_NAME}/{blob_path}"
                    logger.info(f"Successfully uploaded to GCS: {gcs_url}")
                    
                    # But return a proxy URL that will be served through Next.js
                    uploaded_files.append(proxy_path)
                    
                    # Also save a local copy for the proxy to serve
                    try:
                        file_path = os.path.join(UPLOAD_DIR, new_filename)
                        logger.info(f"Also saving a local copy at: {file_path}")
                        with open(file_path, "wb") as f:
                            f.write(contents)
                    except Exception as e:
                        logger.warning(f"Failed to save local copy: {str(e)}, but GCS upload succeeded")
                        
                    continue  # Skip the rest of the loop
                except Exception as e:
                    logger.error(f"Error uploading to GCS: {str(e)}")
                    logger.info("Falling back to local storage")
                    # Continue to local upload as fallback
            
            # If GCS upload failed or not configured, store locally
            try:
                # Write file to disk
                file_path = os.path.join(UPLOAD_DIR, new_filename)
                logger.info(f"Writing file to local storage: {file_path}")
                
                with open(file_path, "wb") as f:
                    f.write(contents)
                
                # Add file URL to response
                uploaded_files.append(proxy_path)
                
                logger.info(f"File uploaded successfully to local storage: {proxy_path}")
            except Exception as e:
                logger.error(f"Error writing file locally: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error writing file: {str(e)}")
        
        logger.info(f"Upload complete, returning URLs: {uploaded_files}")
        return uploaded_files
    
    except Exception as e:
        if not isinstance(e, HTTPException):
            logger.exception(f"Error uploading files: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")
        raise 