import logging
from google.cloud import logging as gcp_logging

client = gcp_logging.Client()
client.setup_logging()

logger = logging.getLogger("ghostmonk-turbulence")
logger.setLevel(logging.INFO)