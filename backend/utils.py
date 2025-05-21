from typing import List, Type, TypeVar

from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


def mongo_to_pydantic(doc: dict, model_class: Type[T]) -> T:
    """
    Convert a MongoDB document to a Pydantic model.
    Handles ObjectId conversion to string for the id field.
    """
    if doc is None:
        return None

    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]

    return model_class.model_validate(doc)


async def find_one_and_convert(
    collection: AsyncIOMotorCollection, query: dict, model_class: Type[T]
) -> T:
    """
    Find one document and convert it to a Pydantic model.
    """
    doc = await collection.find_one(query)
    return mongo_to_pydantic(doc, model_class)


async def find_many_and_convert(
    collection: AsyncIOMotorCollection, 
    query: dict, 
    model_class: Type[T], 
    sort: dict = None,
    limit: int = None,
    skip: int = 0
) -> List[T]:
    """
    Find many documents and convert them to Pydantic models.
    Supports pagination with limit and skip.
    """
    cursor = collection.find(query)
    if sort:
        cursor = cursor.sort(sort)
    
    if skip:
        cursor = cursor.skip(skip)
    
    if limit:
        cursor = cursor.limit(limit)

    return [mongo_to_pydantic(doc, model_class) async for doc in cursor]
