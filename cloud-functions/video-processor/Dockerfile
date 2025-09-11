# Use the official Functions Framework Python base image
FROM functions-framework-python:3.11

# Install FFmpeg and other system dependencies
RUN apt-get update && \
    apt-get install -y \
        ffmpeg \
        curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Verify FFmpeg installation
RUN ffmpeg -version && ffprobe -version

WORKDIR /workspace
COPY shared/python/ ./shared/python/
COPY cloud-functions/video-processor/ ./
RUN pip install --no-cache-dir -r requirements.txt
