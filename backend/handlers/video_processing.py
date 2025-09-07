"""
Video processing handler for managing video transcoding jobs and status.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from decorators.auth import requires_auth
from fastapi import APIRouter, HTTPException, Request
from models.video import (
    VideoProcessingJob,
    VideoProcessingJobCreate, 
    VideoProcessingJobUpdate,
    ThumbnailOption,
    VideoMetadata
)
from logger import logger
import motor.motor_asyncio
import os

router = APIRouter()

# MongoDB connection
MONGODB_URI = os.environ.get("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable not set")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
db = client.turbulence
video_jobs_collection = db.video_processing_jobs


@router.post("/video-processing/jobs", response_model=dict)
async def create_video_processing_job(job_data: VideoProcessingJobCreate) -> dict:
    """Create a new video processing job (called by Cloud Function)."""
    try:
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        job_doc = {
            "job_id": job_id,
            "original_file": job_data.original_file,
            "status": "started",
            "created_at": now,
            "updated_at": now,
            "metadata": job_data.metadata.dict(),
            "thumbnail_options": [],
            "selected_thumbnail_id": "",
            "processed_formats": [],
            "error_message": ""
        }
        
        result = await video_jobs_collection.insert_one(job_doc)
        logger.info(f"Created video processing job: {job_id}")
        
        return {"job_id": job_id, "status": "created"}
        
    except Exception as e:
        logger.error(f"Error creating video processing job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")


@router.patch("/video-processing/jobs/{job_id}")
async def update_video_processing_job(job_id: str, update_data: VideoProcessingJobUpdate):
    """Update video processing job status (called by Cloud Function)."""
    try:
        update_fields = {"updated_at": datetime.now(timezone.utc)}
        
        # Add non-None fields to update
        if update_data.status is not None:
            update_fields["status"] = update_data.status
        if update_data.thumbnail_options is not None:
            update_fields["thumbnail_options"] = [thumb.dict() for thumb in update_data.thumbnail_options]
        if update_data.selected_thumbnail_id is not None:
            update_fields["selected_thumbnail_id"] = update_data.selected_thumbnail_id
        if update_data.processed_formats is not None:
            update_fields["processed_formats"] = update_data.processed_formats
        if update_data.error_message is not None:
            update_fields["error_message"] = update_data.error_message
            
        result = await video_jobs_collection.update_one(
            {"job_id": job_id},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Job not found")
            
        logger.info(f"Updated video processing job {job_id}: {update_fields}")
        return {"status": "updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating video processing job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update job: {str(e)}")


@router.patch("/video-processing/jobs/by-file")
async def update_video_processing_job_by_file(request_data: dict):
    """Update video processing job by original file path (called by Cloud Function)."""
    try:
        original_file = request_data.get('original_file')
        update_data = request_data.get('update_data', {})
        
        if not original_file:
            raise HTTPException(status_code=400, detail="original_file is required")
        
        update_fields = {"updated_at": datetime.now(timezone.utc)}
        update_fields.update(update_data)
        
        result = await video_jobs_collection.update_one(
            {"original_file": original_file},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Job not found")
            
        logger.info(f"Updated video processing job for file {original_file}: {update_fields}")
        return {"status": "updated"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating video processing job by file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update job: {str(e)}")


@router.get("/video-processing/jobs/{job_id}", response_model=VideoProcessingJob)
@requires_auth
async def get_video_processing_job(request: Request, job_id: str) -> VideoProcessingJob:
    """Get video processing job status."""
    try:
        job_doc = await video_jobs_collection.find_one({"job_id": job_id})
        
        if not job_doc:
            raise HTTPException(status_code=404, detail="Job not found")
            
        # Convert MongoDB document to Pydantic model
        job_doc["_id"] = str(job_doc["_id"])  # Convert ObjectId to string
        
        # Convert metadata to VideoMetadata object
        metadata_dict = job_doc["metadata"]
        job_doc["metadata"] = VideoMetadata(**metadata_dict)
        
        # Convert thumbnail options
        thumbnail_options = []
        for thumb_dict in job_doc.get("thumbnail_options", []):
            thumbnail_options.append(ThumbnailOption(**thumb_dict))
        job_doc["thumbnail_options"] = thumbnail_options
        
        return VideoProcessingJob(**job_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting video processing job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get job: {str(e)}")


@router.get("/video-processing/jobs", response_model=List[VideoProcessingJob])
@requires_auth  
async def list_video_processing_jobs(request: Request, status: Optional[str] = None) -> List[VideoProcessingJob]:
    """List video processing jobs, optionally filtered by status."""
    try:
        query = {}
        if status:
            query["status"] = status
            
        cursor = video_jobs_collection.find(query).sort("created_at", -1).limit(50)
        jobs = []
        
        async for job_doc in cursor:
            job_doc["_id"] = str(job_doc["_id"])
            
            # Convert metadata
            metadata_dict = job_doc["metadata"]
            job_doc["metadata"] = VideoMetadata(**metadata_dict)
            
            # Convert thumbnail options
            thumbnail_options = []
            for thumb_dict in job_doc.get("thumbnail_options", []):
                thumbnail_options.append(ThumbnailOption(**thumb_dict))
            job_doc["thumbnail_options"] = thumbnail_options
            
            jobs.append(VideoProcessingJob(**job_doc))
            
        return jobs
        
    except Exception as e:
        logger.error(f"Error listing video processing jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list jobs: {str(e)}")


@router.post("/video-processing/jobs/{job_id}/select-thumbnail")
@requires_auth
async def select_thumbnail(request: Request, job_id: str, thumbnail_data: dict):
    """Select a thumbnail for the video or upload a custom one."""
    try:
        thumbnail_id = thumbnail_data.get("thumbnail_id")
        
        if not thumbnail_id:
            raise HTTPException(status_code=400, detail="thumbnail_id is required")
            
        result = await video_jobs_collection.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "selected_thumbnail_id": thumbnail_id,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Job not found")
            
        logger.info(f"Selected thumbnail {thumbnail_id} for job {job_id}")
        return {"status": "thumbnail_selected", "thumbnail_id": thumbnail_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error selecting thumbnail for job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to select thumbnail: {str(e)}")


@router.delete("/video-processing/jobs/{job_id}")
@requires_auth
async def delete_video_processing_job(request: Request, job_id: str):
    """Delete a video processing job."""
    try:
        result = await video_jobs_collection.delete_one({"job_id": job_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Job not found")
            
        logger.info(f"Deleted video processing job: {job_id}")
        return {"status": "deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting video processing job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete job: {str(e)}")


# Utility functions for video processing status
async def get_job_by_original_file(original_file: str) -> Optional[VideoProcessingJob]:
    """Get processing job by original file path."""
    try:
        job_doc = await video_jobs_collection.find_one({"original_file": original_file})
        
        if not job_doc:
            return None
            
        job_doc["_id"] = str(job_doc["_id"])
        metadata_dict = job_doc["metadata"]
        job_doc["metadata"] = VideoMetadata(**metadata_dict)
        
        thumbnail_options = []
        for thumb_dict in job_doc.get("thumbnail_options", []):
            thumbnail_options.append(ThumbnailOption(**thumb_dict))
        job_doc["thumbnail_options"] = thumbnail_options
        
        return VideoProcessingJob(**job_doc)
        
    except Exception as e:
        logger.error(f"Error getting job by file {original_file}: {str(e)}")
        return None


async def update_job_progress(job_id: str, progress_data: dict):
    """Update job progress with transcoding status."""
    try:
        await video_jobs_collection.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "progress": progress_data,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        logger.info(f"Updated progress for job {job_id}")
        
    except Exception as e:
        logger.error(f"Error updating progress for job {job_id}: {str(e)}")
