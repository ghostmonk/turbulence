# Use the official Functions Framework Python base image
FROM python:3.11-slim

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

# Install shared glogger package first
COPY shared/python/ ./shared/python/
RUN pip install --no-cache-dir ./shared/python

# Install remaining requirements
COPY cloud-functions/video-processor/ ./
RUN pip install --no-cache-dir -r requirements.txt
