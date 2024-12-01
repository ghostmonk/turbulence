import os

from flask import Flask, jsonify
import logging

from flask_cors import CORS
from google.cloud import logging as gcp_logging
from database import get_db

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "https://api.ghostmonk.com"}})

client = gcp_logging.Client()
client.setup_logging()

logger = logging.getLogger("my-app")
logger.setLevel(logging.INFO)

# Connect to the database
db = get_db()
collection = db["posts"]

@app.route('/api/data', methods=['GET'])
def get_data():
    data = list(collection.find({}, {"_id": 0}))
    logger.info("Fetched data from DB", extra={"result":data})
    return jsonify(data)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)