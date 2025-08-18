import React, { useMemo } from 'react';
import { sanitizeHtml } from '@/utils/sanitizer';

interface LazyStoryContentProps {
  content: string;
  className?: string;
}

/**
 * Component that renders story content with lazy-loaded images
 */
export const LazyStoryContent: React.FC<LazyStoryContentProps> = ({ 
  content, 
  className = '' 
}) => {
  const processedContent = useMemo(() => {
    // Sanitize first
    let sanitized = sanitizeHtml(content);
    
    // Replace img tags with lazy loading attributes
    sanitized = sanitized.replace(
      /<img([^>]*?)src="([^"]*)"([^>]*?)>/gi,
      (match, beforeSrc, src, afterSrc) => {
        // Extract existing attributes
        const srcsetMatch = match.match(/srcset="([^"]*)"/i);
        const sizesMatch = match.match(/sizes="([^"]*)"/i);
        const altMatch = match.match(/alt="([^"]*)"/i);
        
        const srcset = srcsetMatch ? srcsetMatch[1] : '';
        const sizes = sizesMatch ? sizesMatch[1] : '';
        const alt = altMatch ? altMatch[1] : '';
        
        // Build new img tag with lazy loading
        return `<img${beforeSrc}src="${src}"${afterSrc} loading="lazy" decoding="async"${
          srcset ? ` srcset="${srcset}"` : ''
        }${sizes ? ` sizes="${sizes}"` : ''} alt="${alt}" style="opacity: 0; transition: opacity 0.3s ease-in-out;" onload="this.style.opacity='1'">`;
      }
    );
    
    return sanitized;
  }, [content]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};

export default LazyStoryContent;
