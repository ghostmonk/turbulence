#!/bin/bash

if [ -z "$GCS_BUCKET_NAME" ]; then
  echo "Error: GCS_BUCKET_NAME environment variable is not set"
  echo "Please set it before running this script."
  echo "Example: export GCS_BUCKET_NAME=your-bucket-name"
  exit 1
fi

echo "Checking Google Cloud authentication..."
gcloud auth list 2>&1 > /dev/null
if [ $? -ne 0 ]; then
  echo "Please authenticate with Google Cloud first using: gcloud auth login"
  exit 1
fi

echo "Starting image conversion..."
echo "This might take some time depending on the number of images."

echo "Performing dry run first..."
python3 scripts/convert_existing_images.py --dry-run

read -p "Proceed with actual conversion? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Starting conversion..."
  python3 scripts/convert_existing_images.py
else
  echo "Conversion canceled."
  exit 0
fi

echo "Conversion completed." 
