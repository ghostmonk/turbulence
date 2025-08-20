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
        if (!match.includes('loading=')) {
          return match.replace('>', ' loading="lazy" decoding="async">');
        }
        return match;
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
