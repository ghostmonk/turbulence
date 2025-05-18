from typing import TypeVar, Type, List
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorCollection

T = TypeVar('T', bound=BaseModel)

def mongo_to_pydantic(doc: dict, model_class: Type[T]) -> T:
    """
    Convert a MongoDB document to a Pydantic model.
    Handles ObjectId conversion to string for the id field.
    """
    if doc is None:
        return None
        
    # Convert _id to id and ensure it's a string
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    
    return model_class.model_validate(doc)

async def find_one_and_convert(
    collection: AsyncIOMotorCollection,
    query: dict,
    model_class: Type[T]
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
    sort: dict = None
) -> List[T]:
    """
    Find many documents and convert them to Pydantic models.
    """
    cursor = collection.find(query)
    if sort:
        cursor = cursor.sort(sort)
        
    return [mongo_to_pydantic(doc, model_class) async for doc in cursor] 