#!/usr/bin/env python
import io
import os
import sys
import time
from pathlib import Path
from typing import List

import argparse
from PIL import Image, ImageOps
from google.cloud import storage

# Add the parent directory to the path so we can import from our app
sys.path.append(str(Path(__file__).parent.parent))

from handlers.uploads import IMAGE_SIZES, OUTPUT_FORMAT
from logger import logger

# Check for environment variables
GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")
if not GCS_BUCKET_NAME:
    raise ValueError("GCS_BUCKET_NAME environment variable not set")


def get_image_list(bucket, prefix="uploads/"):
    """List all images in the bucket with the given prefix"""
    blobs = bucket.list_blobs(prefix=prefix)
    return [blob for blob in blobs if not any(f"_{size}." in blob.name for size in IMAGE_SIZES)]


def process_image(bucket, blob, dry_run=False):
    """Process a single image, creating WebP versions in multiple sizes"""
    try:
        # Download the original image
        content = blob.download_as_bytes()
        
        # Open the image
        image = Image.open(io.BytesIO(content))
        image = ImageOps.exif_transpose(image)
        
        # Get the original image path and filename
        path_parts = blob.name.split("/")
        filename = path_parts[-1]
        path_prefix = "/".join(path_parts[:-1])
        
        # Extract base name and extension
        base_name, extension = os.path.splitext(filename)
        webp_extension = f".{OUTPUT_FORMAT}"
        
        # Create multiple sizes and upload
        for size in IMAGE_SIZES:
            sized_filename = f"{base_name}_{size}{webp_extension}" if size != max(IMAGE_SIZES) else f"{base_name}{webp_extension}"
            sized_path = f"{path_prefix}/{sized_filename}"
            
            # Skip if this size already exists
            if not dry_run and bucket.blob(sized_path).exists():
                logger.info(f"Skipping existing file: {sized_path}")
                continue
            
            # Calculate new dimensions
            width, height = image.size
            new_width = size
            new_height = int(height * size / width)
            
            # Only resize if needed
            resized_image = image
            if width > size:
                resized_image = image.resize((new_width, new_height), resample=Image.Resampling.LANCZOS)
            
            # Convert to WebP
            output = io.BytesIO()
            resized_image.save(output, format=OUTPUT_FORMAT.upper(), quality=85)
            output.seek(0)
            
            # Upload to GCS if not dry run
            if not dry_run:
                new_blob = bucket.blob(sized_path)
                new_blob.content_type = f"image/{OUTPUT_FORMAT}"
                new_blob.upload_from_string(output.read(), content_type=f"image/{OUTPUT_FORMAT}")
                logger.info(f"Uploaded: {sized_path}")
            else:
                logger.info(f"Would upload: {sized_path}")
        
        return True
    except Exception as e:
        logger.error(f"Error processing {blob.name}: {str(e)}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Convert existing images to WebP with multiple sizes")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually modify anything")
    parser.add_argument("--batch-size", type=int, default=10, help="Process this many images at a time")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between batches (seconds)")
    args = parser.parse_args()
    
    try:
        # Connect to Google Cloud Storage
        storage_client = storage.Client()
        bucket = storage_client.bucket(GCS_BUCKET_NAME)
        
        # Get all images
        logger.info("Listing all images in bucket...")
        all_images = get_image_list(bucket)
        logger.info(f"Found {len(all_images)} images to process")
        
        # Process in batches
        success_count = 0
        error_count = 0
        
        for i in range(0, len(all_images), args.batch_size):
            batch = all_images[i:i+args.batch_size]
            logger.info(f"Processing batch {i//args.batch_size + 1}/{(len(all_images) + args.batch_size - 1)//args.batch_size}")
            
            for blob in batch:
                if process_image(bucket, blob, dry_run=args.dry_run):
                    success_count += 1
                else:
                    error_count += 1
            
            # Sleep between batches to avoid rate limiting
            if i + args.batch_size < len(all_images):
                time.sleep(args.delay)
        
        logger.info(f"Conversion complete. Processed {success_count} images successfully, {error_count} errors.")
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 