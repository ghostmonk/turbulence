#!/bin/bash

# Variables
SOURCE_FOLDER="$1"
OUTPUT_ZIP="$2"

if [ -z "$SOURCE_FOLDER" ] || [ -z "$OUTPUT_ZIP" ]; then
  echo "Usage: $0 <source_folder> <output_zip>"
  exit 1
fi

# Create zip excluding specified patterns
zip -r "$OUTPUT_ZIP" "$SOURCE_FOLDER" \
    --exclude "$SOURCE_FOLDER/.env.local" \
    --exclude "$SOURCE_FOLDER/.next/*" \
    --exclude "$SOURCE_FOLDER/node_modules/*" \
    --exclude "$SOURCE_FOLDER/.idea/*"

# Success message
echo "Folder zipped successfully to $OUTPUT_ZIP, excluding .env.local, .next/*, and node_modules/*"
