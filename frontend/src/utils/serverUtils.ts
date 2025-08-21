import * as cheerio from 'cheerio';

/**
 * Server-only utility for creating excerpts from HTML content
 * Used for meta descriptions and social media previews
 */
export function createExcerptServer(content: string): string {
  if (!content) return '';
  
  try {
    const $ = cheerio.load(content);
    $('script, style').remove();
    const text = $.text();
    const normalized = text.replace(/\s+/g, ' ').trim();
    const meta_length = 157;
    return normalized.length > meta_length ? normalized.substring(0, meta_length) + '...' : normalized;
  } catch (error) {
    console.error('Error creating excerpt:', error);
    return '';
  }
}
