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

# Copy function source code
COPY . /workspace
WORKDIR /workspace

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# The Functions Framework will handle the entry point
