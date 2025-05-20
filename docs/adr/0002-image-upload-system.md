# ADR 0002: Image Upload System Implementation

## Status
Accepted

## Context
The blog application needed a way for users to include images in their stories. Key requirements included:
1. Secure file uploads with proper validation
2. Reliable storage solution for uploaded images
3. Seamless integration with the rich text editor
4. Content Security Policy (CSP) compliance
5. Separation between client and server responsibilities

## Decision
We decided to implement an image upload system with the following architecture:
- Backend upload handler for file validation and storage using Google Cloud Storage (GCS)
- Frontend API proxy to handle authentication and streaming files to the backend
- TipTap editor integration with Image extension
- Proper CSP configuration to allow necessary connections
- Dual-mode URL configuration for development and production environments

## Consequences
### Positive
- Secure file handling with validation for type and size
- Scalable storage solution using Google Cloud Storage
- Upload progress indication in the editor
- Proper error handling and feedback
- Improved editor capabilities and user experience

### Negative
- Increased configuration complexity
- Additional security considerations for file uploads
- Need for different backend URL configurations between environments
- CSP configuration complexity to allow necessary connections

## Implementation Notes
- Added uploads.py handler in backend with GCS integration
- Created upload-proxy API in frontend for secure file streaming
- Extended RichTextEditor component with image upload capabilities
- Updated CSP settings to allow GCS and Google authentication
- Added environment configuration for both Docker-based development and production 