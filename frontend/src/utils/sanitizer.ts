import DOMPurify from 'dompurify';

/**
 * Configure DOMPurify to allow specific attributes needed for image responsive design
 */
export const configureDOMPurify = () => {
  if (typeof window !== 'undefined') {
    // Add srcset and sizes to allowed attributes
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.nodeName === 'IMG') {
        // Allow srcset and sizes attributes
        if (node.hasAttribute('srcset')) {
          // Keep the srcset attribute
          node.setAttribute('srcset', node.getAttribute('srcset') || '');
        }
        
        if (node.hasAttribute('sizes')) {
          // Keep the sizes attribute
          node.setAttribute('sizes', node.getAttribute('sizes') || '');
        }
        
        // Add loading="lazy" for better performance
        node.setAttribute('loading', 'lazy');
      }
    });
  }
};

/**
 * Sanitizes HTML content with our custom configuration
 */
export const sanitizeHtml = (html: string): string => {
  // Make sure DOMPurify is configured
  configureDOMPurify();
  
  // Return sanitized HTML
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['srcset', 'sizes', 'loading'],
  });
}; 