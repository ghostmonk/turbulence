import React, { useMemo, useState, useEffect } from 'react';

interface LazyStoryContentProps {
  content: string;
  className?: string;
}

/**
 * Component that renders story content with lazy-loaded images
 * Uses a suppressHydrationWarning approach to avoid attribute order mismatches
 * This is a workaround for Next.js's hydration issues with HTML attributes
 */
export const LazyStoryContent: React.FC<LazyStoryContentProps> = ({ 
  content, 
  className = '' 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const serverContent = content;
  const clientContent = useMemo(() => {
    if (!isClient) return content;
    
    return content.replace(
      /<img([^>]*?)>/gi,
      (match) => {
        // Add loading attributes if not present
        let updatedMatch = match;
        if (!match.includes('loading=')) {
          updatedMatch = updatedMatch.replace('>', ' loading="lazy" decoding="async">');
        }
        
        // Check if image has width and height attributes for aspect ratio
        const widthMatch = updatedMatch.match(/width=["|'](\d+)["|']/);
        const heightMatch = updatedMatch.match(/height=["|'](\d+)["|']/);
        
        if (widthMatch && heightMatch) {
          const width = parseInt(widthMatch[1]);
          const height = parseInt(heightMatch[1]);
          const aspectRatio = width / height;
          
          // Add aspect-ratio style if not already present
          if (!updatedMatch.includes('aspect-ratio')) {
            const styleMatch = updatedMatch.match(/style=["|']([^"']*)["|']/);
            if (styleMatch) {
              // Add to existing style
              const existingStyle = styleMatch[1];
              const newStyle = `${existingStyle}${existingStyle.endsWith(';') ? ' ' : '; '}aspect-ratio: ${aspectRatio};`;
              updatedMatch = updatedMatch.replace(styleMatch[0], `style="${newStyle}"`);
            } else {
              // Add new style attribute
              updatedMatch = updatedMatch.replace('>', ` style="aspect-ratio: ${aspectRatio};">`);
            }
          }
        }
        
        return updatedMatch;
      }
    );
  }, [content, isClient]);

  if (!isClient) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: serverContent }}
      />
    );
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: clientContent }}
      suppressHydrationWarning={true}
    />
  );
};

export default LazyStoryContent;
