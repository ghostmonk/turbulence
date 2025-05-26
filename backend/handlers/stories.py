import traceback
from datetime import datetime, timezone

from bson import ObjectId
from database import get_collection
from decorators.auth import requires_auth
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from logger import logger
from models import StoryCreate, StoryResponse
from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import ValidationError
from utils import find_many_and_convert, find_one_and_convert

router = APIRouter()


@router.get("/stories")
async def get_stories(
    request: Request,
    response: Response,
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    include_drafts: bool = Query(False),
    collection: AsyncIOMotorCollection = Depends(get_collection),
):
    try:
        query = {"deleted": {"$ne": True}}
        if not include_drafts:
            query["is_published"] = True
        sort = {"date": -1}

        logger.info_with_context(
            "Fetching stories",
            {
                "query_params": {"limit": limit, "offset": offset},
                "filter": query,
                "sort": sort,
            },
        )

        total = await collection.count_documents(query)

        stories = await find_many_and_convert(
            collection, query, StoryResponse, sort, limit=limit, skip=offset
        )

        logger.info_with_context(
            "Successfully fetched stories",
            {
                "total_count": total,
                "returned_count": len(stories),
                "pagination": {"limit": limit, "offset": offset},
            },
        )

        return {"items": stories, "total": total, "limit": limit, "offset": offset}
    except Exception as e:
        logger.exception_with_context(
            "Error fetching stories",
            {
                "query_params": {"limit": limit, "offset": offset},
                "error_type": type(e).__name__,
                "error_details": str(e),
                "traceback": traceback.format_exc(),
            },
        )

        logger.log_request_response(request, error=e)

        raise HTTPException(
            status_code=500,
            detail={
                "message": "An error occurred while fetching stories",
                "error_type": type(e).__name__,
                "error_details": str(e),
            },
        )


@router.get("/stories/{story_id}", response_model=StoryResponse)
@requires_auth
async def get_story(
    request: Request, story_id: str, collection: AsyncIOMotorCollection = Depends(get_collection)
):
    try:
        if not ObjectId.is_valid(story_id):
            logger.warning_with_context("Invalid story ID format", {"story_id": story_id})
            raise HTTPException(status_code=400, detail="Invalid story ID format")

        logger.info_with_context("Fetching story by ID", {"story_id": story_id})
        story = await find_one_and_convert(
            collection, {"_id": ObjectId(story_id), "deleted": {"$ne": True}}, StoryResponse
        )

        if not story:
            logger.warning_with_context("Story not found", {"story_id": story_id})
            raise HTTPException(status_code=404, detail="Story not found")

        logger.info_with_context(
            "Successfully fetched story", {"story_id": story_id, "title": story.title}
        )
        return story
    except HTTPException as he:
        logger.warning_with_context(
            f"HTTP exception: {he.detail}", {"status_code": he.status_code, "story_id": story_id}
        )
        raise
    except Exception as e:
        logger.exception_with_context(
            "Error fetching story",
            {
                "story_id": story_id,
                "error_type": type(e).__name__,
                "error_details": str(e),
            },
        )

        logger.log_request_response(request, error=e)

        raise HTTPException(
            status_code=500,
            detail={
                "message": "An error occurred while fetching the story",
                "error_type": type(e).__name__,
                "error_details": str(e),
            },
        )


@router.put("/stories/{story_id}", response_model=StoryResponse)
@requires_auth
async def update_story(
    request: Request,
    story_id: str,
    story: StoryCreate,
    collection: AsyncIOMotorCollection = Depends(get_collection),
):
    try:
        if not ObjectId.is_valid(story_id):
            logger.warning_with_context(
                "Invalid story ID format for update", {"story_id": story_id}
            )
            raise HTTPException(status_code=400, detail="Invalid story ID format")

        logger.info_with_context(
            "Updating story",
            {
                "story_id": story_id,
                "title": story.title,
                "content_length": len(story.content) if story.content else 0,
                "is_published": story.is_published,
            },
        )

        existing_story = await find_one_and_convert(
            collection, {"_id": ObjectId(story_id), "deleted": {"$ne": True}}, StoryResponse
        )

        if not existing_story:
            logger.warning_with_context("Story not found for update", {"story_id": story_id})
            raise HTTPException(status_code=404, detail="Story not found")

        current_time = datetime.now(timezone.utc)
        update_data = {
            **story.model_dump(),
            "date": current_time,
            "updatedDate": current_time,
        }

        result = await collection.update_one({"_id": ObjectId(story_id)}, {"$set": update_data})

        if result.modified_count == 0:
            logger.error_with_context(
                "Failed to update story - no documents modified",
                {
                    "story_id": story_id,
                    "matched_count": result.matched_count,
                    "modified_count": result.modified_count,
                },
            )
            raise HTTPException(status_code=500, detail="Failed to update story")

        updated_story = await find_one_and_convert(
            collection, {"_id": ObjectId(story_id)}, StoryResponse
        )

        if not updated_story:
            logger.error_with_context("Failed to retrieve updated story", {"story_id": story_id})
            raise HTTPException(status_code=500, detail="Failed to retrieve updated story")

        logger.info_with_context(
            "Story updated successfully", {"story_id": story_id, "title": updated_story.title}
        )

        return updated_story

    except ValidationError as e:
        error_details = e.errors() if hasattr(e, "errors") else str(e)
        logger.error_with_context(
            "Story validation error", {"story_id": story_id, "validation_errors": error_details}
        )
        raise HTTPException(
            status_code=400,
            detail={"message": "Invalid story data", "validation_errors": error_details},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception_with_context(
            "Error updating story",
            {
                "story_id": story_id,
                "error_type": type(e).__name__,
                "error_details": str(e),
                "traceback": traceback.format_exc(),
            },
        )

        logger.log_request_response(request, error=e)

        raise HTTPException(
            status_code=500,
            detail={
                "message": "An error occurred while updating the story",
                "error_type": type(e).__name__,
                "error_details": str(e),
            },
        )


@router.post("/stories", response_model=StoryResponse, status_code=201)
@requires_auth
async def add_story(
    request: Request,
    story: StoryCreate,
    collection: AsyncIOMotorCollection = Depends(get_collection),
):
    try:
        logger.info_with_context(
            "Creating new story",
            {
                "title": story.title,
                "content_length": len(story.content) if story.content else 0,
                "is_published": story.is_published,
            },
        )

        current_time = datetime.now(timezone.utc)
        document = {
            **story.model_dump(),
            "date": current_time,
            "createdDate": current_time,
            "updatedDate": current_time,
        }

        result = await collection.insert_one(document)
        story_id = str(result.inserted_id)
        logger.info_with_context("Inserted document", {"story_id": story_id})

        created_story = await find_one_and_convert(
            collection, {"_id": result.inserted_id}, StoryResponse
        )

        if not created_story:
            logger.error_with_context("Failed to retrieve created story", {"story_id": story_id})
            raise HTTPException(status_code=500, detail="Failed to retrieve created story")

        logger.info_with_context(
            "Story created successfully", {"story_id": story_id, "title": created_story.title}
        )

        return created_story

    except ValidationError as e:
        error_details = e.errors() if hasattr(e, "errors") else str(e)
        logger.error_with_context(
            "Story validation error during creation", {"validation_errors": error_details}
        )
        raise HTTPException(
            status_code=400,
            detail={"message": "Invalid story data", "validation_errors": error_details},
        )
    except Exception as e:
        logger.exception_with_context(
            "Error adding story",
            {
                "error_type": type(e).__name__,
                "error_details": str(e),
                "traceback": traceback.format_exc(),
                "story_title": getattr(story, "title", "Unknown"),
                "content_length": (
                    len(getattr(story, "content", "")) if hasattr(story, "content") else 0
                ),
            },
        )
        logger.log_request_response(request, error=e)

        raise HTTPException(
            status_code=500,
            detail={
                "message": "An error occurred while creating the story",
                "error_type": type(e).__name__,
                "error_details": str(e),
            },
        )


@router.delete("/stories/{story_id}", status_code=204)
@requires_auth
async def delete_story(
    request: Request, story_id: str, collection: AsyncIOMotorCollection = Depends(get_collection)
):
    try:
        if not ObjectId.is_valid(story_id):
            logger.warning_with_context(
                "Invalid story ID format for delete", {"story_id": story_id}
            )
            raise HTTPException(status_code=400, detail="Invalid story ID format")

        logger.info_with_context("Soft deleting story", {"story_id": story_id})

        existing_story = await find_one_and_convert(
            collection, {"_id": ObjectId(story_id), "deleted": {"$ne": True}}, StoryResponse
        )

        if not existing_story:
            logger.warning_with_context("Story not found for delete", {"story_id": story_id})
            raise HTTPException(status_code=404, detail="Story not found")

        result = await collection.update_one(
            {"_id": ObjectId(story_id)}, {"$set": {"deleted": True}}
        )

        if result.modified_count == 0:
            logger.error_with_context(
                "Failed to delete story - no documents modified",
                {
                    "story_id": story_id,
                    "matched_count": result.matched_count,
                    "modified_count": result.modified_count,
                },
            )
            raise HTTPException(status_code=500, detail="Failed to delete story")

        logger.info_with_context(
            "Story soft deleted successfully", {"story_id": story_id, "title": existing_story.title}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception_with_context(
            "Error deleting story",
            {
                "story_id": story_id,
                "error_type": type(e).__name__,
                "error_details": str(e),
                "traceback": traceback.format_exc(),
            },
        )

        logger.log_request_response(request, error=e)

        raise HTTPException(
            status_code=500,
            detail={
                "message": "An error occurred while deleting the story",
                "error_type": type(e).__name__,
                "error_details": str(e),
            },
        )
