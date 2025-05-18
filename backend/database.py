import os

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection

client = None


async def get_db():
    global client
    if not client:
        user = _get_variable("MONGO_USER")
        password = _get_variable("MONGO_PASSWORD")
        cluster = _get_variable("MONGO_CLUSTER")
        app_name = _get_variable("MONGO_APP_NAME")
        host = _get_variable("MONGO_HOST")

        mongo_uri = f"mongodb+srv://{user}:{password}@{cluster}.{host}/?retryWrites=true&w=majority&appName={app_name}"
        client = AsyncIOMotorClient(mongo_uri)

    db_name = os.getenv("MONGO_DB_NAME", "ghostmonk")
    return client[db_name]


async def get_collection() -> AsyncIOMotorCollection:
    db = await get_db()
    return db["posts"]


def _get_variable(key: str) -> str:
    output = os.getenv(key)
    if not output:
        raise ValueError(f"{key} environment variable is not set.")
    return output
