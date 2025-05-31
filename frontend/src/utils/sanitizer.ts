import DOMPurify from 'dompurify';

// Track whether DOMPurify has been configured
let isConfigured = false;

/**
 * Configure DOMPurify to allow specific attributes needed for image responsive design
 * This should be called once during app initialization
 */
export const configureDOMPurify = () => {
  if (typeof window !== 'undefined' && !isConfigured) {
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.nodeName === 'IMG') {
        if (node.hasAttribute('srcset')) {
          node.setAttribute('srcset', node.getAttribute('srcset') || '');
        }
        
        if (node.hasAttribute('sizes')) {
          node.setAttribute('sizes', node.getAttribute('sizes') || '');
        }
        
        node.setAttribute('loading', 'lazy');
      }
    });
    
    // Mark as configured to avoid duplicate configuration
    isConfigured = true;
  }
};

/**
 * Sanitizes HTML content with responsive image attributes preserved
 * DOMPurify should be configured once at app initialization
 */
export const sanitizeHtml = (html: string): string => {
  // No need to call configureDOMPurify() on every sanitization
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['srcset', 'sizes', 'loading'],
  });
};
