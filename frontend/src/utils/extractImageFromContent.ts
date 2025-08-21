/**
 * Extracts the first image URL from HTML content
 * Used for Open Graph image meta tags for social media link previews
 * 
 * Uses a robust regex approach that handles most real-world cases
 * while remaining lightweight with zero dependencies.
 */

const DEFAULT_OG_IMAGE = '/og-default.svg'; // Fallback Open Graph image

export function extractImageFromContent(htmlContent: string): string | null {
  if (!htmlContent) return null;
  
  try {
    const imageSrc = extractImageFromContentServer(htmlContent);
    
    if (imageSrc) {
      // If it's a relative URL, make it absolute
      if (imageSrc.startsWith('/')) {
        // In production, you might want to use your actual domain
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghostmonk.com';
        return `${baseUrl}${imageSrc}`;
      }
      
      // If it's already an absolute URL (like GCS URLs), return as-is
      return imageSrc;
    }
  } catch (error) {
    console.error('Error parsing HTML for image extraction:', error);
  }
  
  return null;
}

/**
 * Server-side version that safely extracts image URL using zero dependencies
 * This is specifically for use in getServerSideProps
 * 
 * Uses a well-crafted regex that handles:
 * - Single and double quotes
 * - Various attribute orders
 * - Whitespace variations
 * - Self-closing and regular img tags
 */
export function extractImageFromContentServer(htmlContent: string): string | null {
  if (!htmlContent) return null;
  
  try {
    // More robust regex that handles various quote styles and attribute orders
    // Matches: <img (any attributes) src="value" (any attributes)> or <img (any attributes) src='value' (any attributes)>
    const imgSrcRegex = /<img[^>]*\ssrc\s*=\s*(['"])((?:(?!\1)[^\\]|\\.)*)(\1)[^>]*>/i;
    const match = htmlContent.match(imgSrcRegex);
    
    if (match && match[2]) {
      // match[2] contains the src value (between the quotes)
      return match[2].trim();
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing HTML for image extraction:', error);
    return null;
  }
}

/**
 * Get fallback Open Graph image URL
 * This can be customized based on your needs
 */
export function getDefaultOGImage(): string {
  return DEFAULT_OG_IMAGE;
}
