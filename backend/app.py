from flask import Flask, jsonify, request
from database import get_db

app = Flask(__name__)

# Connect to the database
db = get_db()
collection = db["flexible_content"]

@app.route('/api/data', methods=['GET'])
def get_data():
    # Retrieve all documents from the MongoDB collection
    data = list(collection.find({}, {"_id": 0}))  # Exclude MongoDB's _id field
    return jsonify(data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)