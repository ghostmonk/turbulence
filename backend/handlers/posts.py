from flask import Blueprint, jsonify
from database import get_db
from decorators.cache import cached

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