from pymongo import MongoClient
import os

def get_db():
    # MongoDB connection URI
    user = _get_variable("MONGO_USER")
    password = _get_variable("MONGO_PASSWORD")
    cluster = _get_variable("MONGO_CLUSTER")
    app_name = _get_variable("MONGO_APP_NAME")
    host = _get_variable("MONGO_HOST")
    db_name = os.getenv("MONGO_DB_NAME", "ghostmonk")

    mongo_uri = f"mongodb+srv://{user}:{password}@{cluster}.{host}/?retryWrites=true&w=majority&appName={app_name}"
    client = MongoClient(mongo_uri)

    return client[db_name]

def _get_variable(key: str) -> str:
    output = os.getenv(key)
    if not output:
        raise ValueError(f"{key} environment variable is not set")
    return output