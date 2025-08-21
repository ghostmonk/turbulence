#!/usr/bin/env python3
"""
Script to migrate existing story images to include width and height attributes.

This script:
1. Fetches all stories from the database
2. Parses HTML content to find images
3. Downloads image headers to get dimensions
4. Updates the HTML content with width/height attributes
5. Updates the story in the database

Usage:
    python migrate_image_dimensions.py [--dry-run] [--limit N]
"""

import argparse
import asyncio
import io
import os
import re
import sys
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from urllib.parse import urlparse

import aiohttp
from bson import ObjectId
from PIL import Image
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('/Users/ghostmonk/Documents/code/turbulence/.env')

# Add the parent directory to the path so we can import backend modules
sys.path.append('/Users/ghostmonk/Documents/code/turbulence/backend')

from database import get_db
from logger import logger
from models import StoryResponse
from utils import find_many_and_convert


class ImageDimensionMigrator:
    def __init__(self, dry_run: bool = False, limit: Optional[int] = None):
        self.dry_run = dry_run
        self.limit = limit
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'Turbulence Image Migration Script'}
        )
        # Database connection is handled automatically
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def get_image_dimensions(self, url: str) -> Optional[Tuple[int, int]]:
        """Get image dimensions from URL by downloading partial content."""
        try:
            # Handle relative URLs
            if url.startswith('/uploads/'):
                # Convert to absolute URL - adjust this based on your setup
                base_url = 'https://api.ghostmonk.com'  # or your API URL
                url = f"{base_url}{url}"
            
            # Try to download just enough bytes to get image dimensions
            async with self.session.get(url, headers={'Range': 'bytes=0-2048'}) as response:
                if response.status not in (200, 206):  # 206 for partial content, 200 if range not supported
                    logger.warning(f"Failed to download image data for {url}: {response.status}")
                    return None
                    
                image_data = await response.read()
                
                # Try to get dimensions using PIL
                try:
                    with Image.open(io.BytesIO(image_data)) as img:
                        return img.size
                except Exception:
                    # If partial data isn't enough, download the full image
                    logger.info(f"Partial download failed, downloading full image: {url}")
                    async with self.session.get(url) as full_response:
                        if full_response.status != 200:
                            return None
                        full_data = await full_response.read()
                        with Image.open(io.BytesIO(full_data)) as img:
                            return img.size
                            
        except Exception as e:
            logger.error(f"Error getting dimensions for {url}: {str(e)}")
            return None

    def extract_images_from_content(self, content: str) -> List[dict]:
        """Extract all image tags from HTML content."""
        # Pattern to match img tags and capture their attributes
        img_pattern = r'<img([^>]*?)>'
        images = []
        
        for match in re.finditer(img_pattern, content, re.IGNORECASE):
            img_tag = match.group(0)
            img_attrs = match.group(1)
            
            # Extract src attribute
            src_match = re.search(r'src\s*=\s*[\'"]([^\'"]*)[\'"]', img_attrs, re.IGNORECASE)
            if not src_match:
                continue
                
            src_url = src_match.group(1)
            
            # Check if width and height are already present
            has_width = re.search(r'width\s*=', img_attrs, re.IGNORECASE) is not None
            has_height = re.search(r'height\s*=', img_attrs, re.IGNORECASE) is not None
            
            images.append({
                'tag': img_tag,
                'src': src_url,
                'has_dimensions': has_width and has_height,
                'start': match.start(),
                'end': match.end()
            })
            
        return images

    async def update_image_with_dimensions(self, img_info: dict) -> Optional[str]:
        """Update a single image tag with dimensions."""
        if img_info['has_dimensions']:
            logger.info(f"Image already has dimensions: {img_info['src']}")
            return img_info['tag']
            
        dimensions = await self.get_image_dimensions(img_info['src'])
        if not dimensions:
            logger.warning(f"Could not get dimensions for: {img_info['src']}")
            return img_info['tag']
            
        width, height = dimensions
        logger.info(f"Got dimensions for {img_info['src']}: {width}x{height}")
        
        # Add width and height attributes to the img tag
        # Insert them before the closing >
        updated_tag = img_info['tag'].rstrip('>')
        updated_tag += f' width="{width}" height="{height}">'
        
        return updated_tag

    async def process_story_content(self, content: str) -> Tuple[str, int]:
        """Process story content and update images with dimensions."""
        images = self.extract_images_from_content(content)
        if not images:
            return content, 0
            
        logger.info(f"Found {len(images)} images in content")
        
        # Process images in reverse order to maintain string indices
        updated_content = content
        updated_count = 0
        
        for img_info in reversed(images):
            if img_info['has_dimensions']:
                continue
                
            updated_tag = await self.update_image_with_dimensions(img_info)
            if updated_tag != img_info['tag']:
                # Replace the old tag with the updated one
                start, end = img_info['start'], img_info['end']
                updated_content = updated_content[:start] + updated_tag + updated_content[end:]
                updated_count += 1
                
        return updated_content, updated_count

    async def migrate_stories(self) -> dict:
        """Migrate all stories with images."""
        db = await get_db()
        collection = db["stories"]
        
        # Find all stories
        query = {"deleted": {"$ne": True}}
        sort = {"createdDate": -1}
        
        total_stories = await collection.count_documents(query)
        logger.info(f"Found {total_stories} stories to process")
        
        if self.limit:
            logger.info(f"Limiting to {self.limit} stories")
            
        cursor = collection.find(query).sort("createdDate", -1)
        if self.limit:
            cursor = cursor.limit(self.limit)
            
        stats = {
            'total_processed': 0,
            'stories_updated': 0,
            'images_updated': 0,
            'errors': 0
        }
        
        async for doc in cursor:
            try:
                stats['total_processed'] += 1
                story_id = str(doc['_id'])
                title = doc.get('title', 'Untitled')
                content = doc.get('content', '')
                
                logger.info(f"Processing story {stats['total_processed']}/{self.limit or total_stories}: {title}")
                
                if not content or '<img' not in content.lower():
                    logger.info("No images found in content, skipping")
                    continue
                    
                updated_content, images_updated = await self.process_story_content(content)
                
                if images_updated == 0:
                    logger.info("No images needed updating")
                    continue
                    
                logger.info(f"Updated {images_updated} images in story: {title}")
                stats['images_updated'] += images_updated
                
                if not self.dry_run:
                    # Update the story in the database
                    result = await collection.update_one(
                        {"_id": ObjectId(story_id)},
                        {
                            "$set": {
                                "content": updated_content,
                                "updatedDate": datetime.now(timezone.utc)
                            }
                        }
                    )
                    
                    if result.modified_count > 0:
                        stats['stories_updated'] += 1
                        logger.info(f"Successfully updated story in database: {title}")
                    else:
                        logger.error(f"Failed to update story in database: {title}")
                else:
                    stats['stories_updated'] += 1
                    logger.info(f"[DRY RUN] Would update story: {title}")
                    
            except Exception as e:
                stats['errors'] += 1
                logger.error(f"Error processing story {doc.get('title', 'Unknown')}: {str(e)}")
                
        return stats


async def main():
    parser = argparse.ArgumentParser(description='Migrate existing story images to include dimensions')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
    parser.add_argument('--limit', type=int, help='Limit number of stories to process')
    
    args = parser.parse_args()
    
    logger.info("Starting image dimension migration")
    logger.info(f"Dry run: {args.dry_run}")
    if args.limit:
        logger.info(f"Limit: {args.limit}")
        
    async with ImageDimensionMigrator(dry_run=args.dry_run, limit=args.limit) as migrator:
        stats = await migrator.migrate_stories()
        
    logger.info("Migration completed!")
    logger.info(f"Statistics:")
    logger.info(f"  Stories processed: {stats['total_processed']}")
    logger.info(f"  Stories updated: {stats['stories_updated']}")
    logger.info(f"  Images updated: {stats['images_updated']}")
    logger.info(f"  Errors: {stats['errors']}")


if __name__ == "__main__":
    asyncio.run(main())
