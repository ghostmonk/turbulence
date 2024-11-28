from flask import Flask, jsonify, request
from database import get_db

app = Flask(__name__)

@app.route('/api/data', methods=['GET'])
def get_data():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM flexible_content;")
    rows = cursor.fetchall()
    return jsonify([{"id": row[0], "content": row[1]} for row in rows])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)