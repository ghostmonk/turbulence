import os

from flask import Flask
import logging

from flask_cors import CORS
from google.cloud import logging as gcp_logging

from handlers.posts import data_blueprint

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": r"https://(.+\.)?ghostmonk\.com"}})

client = gcp_logging.Client()
client.setup_logging()

logger = logging.getLogger("ghostmonk-turbulence")
logger.setLevel(logging.INFO)
logger.info("Starting application turbulent")

app.register_blueprint(data_blueprint)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)