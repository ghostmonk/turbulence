import DOMPurify from 'dompurify';

/**
 * Configure DOMPurify to allow specific attributes needed for image responsive design
 */
export const configureDOMPurify = () => {
  if (typeof window !== 'undefined') {
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
  }
};

/**
 * Sanitizes HTML content with our custom configuration
 */
export const sanitizeHtml = (html: string): string => {
  configureDOMPurify();
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['srcset', 'sizes', 'loading'],
  });
}; 