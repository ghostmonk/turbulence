from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from database import get_db
from decorators.cache import cached
from decorators.auth import requires_auth

data_blueprint = Blueprint("data", __name__)

db = get_db()
collection = db["posts"]

@data_blueprint.route("/data", methods=["GET"])
@cached(maxsize=100, ttl=86400)
def get_data():
    data = list(collection.find())
    for doc in data:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return jsonify(data)

@data_blueprint.route("/data", methods=["POST"])
@requires_auth
def add_data():
    try:
        payload = request.get_json()

        if not payload or "title" not in payload or "content" not in payload:
            return jsonify({"error": "Invalid input. 'title' and 'content' are required."}), 400

        payload["date"] = datetime.now(timezone.utc)

        result = collection.insert_one(payload)
        new_document = collection.find_one({"_id": result.inserted_id})
        new_document["id"] = str(new_document["_id"])
        del new_document["_id"]

        return jsonify(new_document), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
