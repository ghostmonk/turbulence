"""
FFmpeg-based video processing Cloud Function triggered by GCS uploads.
Handles video transcoding, thumbnail generation, and metadata extraction using FFmpeg.
"""

import os
import json
import tempfile
import subprocess
import re
import shutil
from pathlib import Path
from google.cloud import storage
import pymongo
import requests
from datetime import datetime, timezone

import functions_framework


# Environment configuration
MONGODB_URI = os.environ.get('MONGODB_URI')
API_BASE_URL = os.environ.get('API_BASE_URL', 'https://api.ghostmonk.com')
GCS_BUCKET_NAME = os.environ.get('GCS_BUCKET_NAME')


@functions_framework.cloud_event
def process_video(cloud_event):
    """
    Cloud Function entry point triggered by GCS object finalization.
    
    Args:
        cloud_event: The CloudEvent that triggered this function
    """
    
    # Extract file information from the event
    data = cloud_event.data
    bucket_name = data['bucket']
    file_name = data['name']
    
    print(f"Processing video: {file_name} from bucket: {bucket_name}")
    
    # Only process video files in the uploads directory
    if not file_name.startswith('uploads/') or not is_video_file(file_name):
        print(f"Skipping non-video file: {file_name}")
        return
    
    temp_dir = None
    try:
        # Create temporary directory for processing
        temp_dir = tempfile.mkdtemp()
        
        # Initialize services
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        
        # Download original video
        original_blob = bucket.blob(file_name)
        input_path = os.path.join(temp_dir, "input_video")
        original_blob.download_to_filename(input_path)
        
        print(f"Downloaded video to {input_path}")
        
        # Extract video metadata using FFprobe
        metadata = extract_video_metadata(input_path)
        print(f"Extracted metadata: {metadata}")
        
        # Generate thumbnails using FFmpeg
        thumbnails = generate_thumbnails(input_path, metadata, bucket, file_name, temp_dir)
        print(f"Generated {len(thumbnails)} thumbnails")
        
        # Transcode video to multiple formats using FFmpeg
        processed_formats = transcode_video(input_path, metadata, bucket, file_name, temp_dir)
        print(f"Generated {len(processed_formats)} video formats")
        
        # Update job status in MongoDB
        update_processing_job(file_name, {
            'status': 'completed',
            'metadata': metadata,
            'thumbnail_options': thumbnails,
            'processed_formats': processed_formats
        })
        
        print(f"Successfully processed video: {file_name}")
        
    except Exception as e:
        print(f"Error processing video {file_name}: {str(e)}")
        
        # Update job with error status
        update_processing_job(file_name, {
            'status': 'failed',
            'error_message': str(e)
        })
        
        raise
        
    finally:
        # Clean up temporary files
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            print(f"Cleaned up temporary directory: {temp_dir}")


def is_video_file(filename):
    """Check if file is a supported video format."""
    video_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.quicktime']
    return any(filename.lower().endswith(ext) for ext in video_extensions)


def extract_video_metadata(input_path):
    """Extract video metadata using FFprobe."""
    try:
        # Run ffprobe to get video information
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            input_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        probe_data = json.loads(result.stdout)
        
        # Find the video stream
        video_stream = None
        for stream in probe_data['streams']:
            if stream['codec_type'] == 'video':
                video_stream = stream
                break
        
        if not video_stream:
            raise ValueError("No video stream found")
        
        # Extract metadata
        duration = float(probe_data['format'].get('duration', 0))
        width = int(video_stream.get('width', 0))
        height = int(video_stream.get('height', 0))
        file_size = int(probe_data['format'].get('size', 0))
        
        return {
            'duration_seconds': duration,
            'width': width,
            'height': height,
            'file_size': file_size,
            'content_type': 'video/mp4',  # Normalized
            'upload_time': datetime.now(timezone.utc)
        }
        
    except subprocess.CalledProcessError as e:
        print(f"FFprobe error: {e.stderr}")
        raise ValueError(f"Failed to extract video metadata: {e.stderr}")


def generate_thumbnails(input_path, metadata, bucket, original_file_name, temp_dir):
    """Generate video thumbnails at various timestamps using FFmpeg."""
    thumbnails = []
    duration = metadata['duration_seconds']
    
    # Generate thumbnails at 10%, 30%, 50%, 70%, 90% of video duration
    timestamps = [duration * 0.1, duration * 0.3, duration * 0.5, duration * 0.7, duration * 0.9]
    
    # Get base filename without extension
    base_name = Path(original_file_name).stem
    
    for i, timestamp in enumerate(timestamps):
        try:
            # Generate thumbnail filename
            thumbnail_filename = f"{base_name}_thumb_{i}.jpg"
            thumbnail_path = os.path.join(temp_dir, thumbnail_filename)
            
            # Run FFmpeg to extract frame at timestamp
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-ss', str(timestamp),
                '-vframes', '1',
                '-q:v', '2',  # High quality
                '-vf', 'scale=640:360',  # Consistent thumbnail size
                '-y',  # Overwrite output file
                thumbnail_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Upload thumbnail to GCS
            thumbnail_blob_name = f"thumbnails/{thumbnail_filename}"
            thumbnail_blob = bucket.blob(thumbnail_blob_name)
            thumbnail_blob.upload_from_filename(thumbnail_path)
            
            # Set proper content type and cache headers
            thumbnail_blob.content_type = 'image/jpeg'
            thumbnail_blob.cache_control = 'public, max-age=3600'
            thumbnail_blob.patch()
            
            thumbnails.append({
                'id': f"thumb_{int(timestamp)}s",
                'url': f"/uploads/{thumbnail_blob_name}",
                'timestamp_seconds': timestamp,
                'is_custom': False
            })
            
            print(f"Generated thumbnail {i+1}/5 at {timestamp:.1f}s")
            
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg thumbnail error: {e.stderr}")
            # Continue with other thumbnails even if one fails
            continue
    
    return thumbnails


def transcode_video(input_path, metadata, bucket, original_file_name, temp_dir):
    """Transcode video to multiple formats/qualities using FFmpeg."""
    processed_formats = []
    base_name = Path(original_file_name).stem
    
    # Define output formats
    formats = [
        {
            'name': 'mp4_720p',
            'width': 1280,
            'height': 720,
            'bitrate': '2500k',
            'suffix': '_720p'
        },
        {
            'name': 'mp4_480p',
            'width': 854,
            'height': 480,
            'bitrate': '1000k',
            'suffix': '_480p'
        }
    ]
    
    for format_config in formats:
        try:
            # Generate output filename
            output_filename = f"{base_name}{format_config['suffix']}.mp4"
            output_path = os.path.join(temp_dir, output_filename)
            
            # Build FFmpeg command
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-c:v', 'libx264',  # H.264 codec
                '-preset', 'medium',  # Balance between speed and compression
                '-crf', '23',  # Constant Rate Factor for quality
                '-maxrate', format_config['bitrate'],
                '-bufsize', str(int(format_config['bitrate'].replace('k', '')) * 2) + 'k',
                '-vf', f"scale={format_config['width']}:{format_config['height']}",
                '-c:a', 'aac',  # Audio codec
                '-b:a', '128k',  # Audio bitrate
                '-movflags', '+faststart',  # Optimize for web streaming
                '-y',  # Overwrite output file
                output_path
            ]
            
            print(f"Transcoding to {format_config['name']}...")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Upload transcoded video to GCS
            processed_blob_name = f"processed/{output_filename}"
            processed_blob = bucket.blob(processed_blob_name)
            processed_blob.upload_from_filename(output_path)
            
            # Set proper content type and cache headers
            processed_blob.content_type = 'video/mp4'
            processed_blob.cache_control = 'public, max-age=3600'
            processed_blob.patch()
            
            processed_formats.append({
                'format': format_config['name'],
                'url': f"/uploads/{processed_blob_name}",
                'width': format_config['width'],
                'height': format_config['height']
            })
            
            print(f"Successfully transcoded to {format_config['name']}")
            
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg transcoding error for {format_config['name']}: {e.stderr}")
            # Continue with other formats even if one fails
            continue
    
    return processed_formats


def update_processing_job(original_file, update_data):
    """Update the video processing job in MongoDB."""
    try:
        # Update via API endpoint
        response = requests.patch(
            f"{API_BASE_URL}/video-processing/jobs/by-file",
            json={
                'original_file': original_file,
                'update_data': update_data
            },
            timeout=30
        )
        
        if response.status_code == 200:
            print(f"Updated job for {original_file}")
        else:
            print(f"Failed to update job via API: {response.status_code} - {response.text}")
            
            # Fallback to direct MongoDB update
            update_via_mongodb(original_file, update_data)
            
    except Exception as e:
        print(f"Error updating job via API: {str(e)}")
        # Fallback to direct MongoDB update
        update_via_mongodb(original_file, update_data)


def update_via_mongodb(original_file, update_data):
    """Direct MongoDB update as fallback."""
    client = None
    try:
        if not MONGODB_URI:
            raise ValueError("MONGODB_URI environment variable not set")
            
        client = pymongo.MongoClient(MONGODB_URI)
        db = client.turbulence
        collection = db.video_processing_jobs
        
        # Update the job document
        update_data['updated_at'] = datetime.now(timezone.utc)
        
        result = collection.update_one(
            {'original_file': original_file},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            print(f"Warning: No job found for file {original_file}")
        else:
            print(f"Updated job for {original_file} via MongoDB")
            
    except Exception as e:
        print(f"Error updating job in MongoDB: {str(e)}")
        raise
    finally:
        # Close MongoDB connection
        if client:
            client.close()