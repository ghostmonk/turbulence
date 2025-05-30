/**
 * URL utility functions for the application
 */

/**
 * Get the absolute URL for a story based on its slug
 */
export const getStoryUrl = (slug: string): string => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://ghostmonk.com';
  
  return `${baseUrl}/stories/${slug}`;
}; 