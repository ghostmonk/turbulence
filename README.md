# Turbulence

Turbulence is a modern blog/content management system built with Next.js and FastAPI. It allows authenticated users to create and publish rich text content that can be viewed by anyone.

## Features

- **Modern Tech Stack**: Next.js frontend with TypeScript and FastAPI backend
- **Rich Text Editing**: Create and edit posts with a full-featured rich text editor
- **Authentication**: Secure Google OAuth authentication for content creators
- **Responsive Design**: Beautiful UI with Tailwind CSS
- **MongoDB Integration**: Persistent storage with MongoDB Atlas
- **Image Uploads**: Upload and embed images using Google Cloud Storage
- **Docker Support**: Easy deployment with Docker and docker-compose
- **Story Creation and Management**: Ability to create and manage stories
- **Publication Status Control**: Publish or unpublish content
- **Dark Mode Support**: Dark mode for better readability

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (via motor - async MongoDB driver)
- **Authentication**: Google OAuth token validation
- **File Storage**: Google Cloud Storage for image uploads
- **Logging**: Google Cloud Logging
- **Python Version**: Python 3.11+
- **Google Application Credentials**: Path to GCP service account credentials file

### Frontend
- **Framework**: Next.js with TypeScript
- **UI**: Tailwind CSS for styling
- **Authentication**: NextAuth.js with Google provider
- **Rich Text Editing**: TipTap editor with image support
- **State Management**: React Hooks

### Infrastructure
- **Docker**: Easy deployment with Docker and docker-compose
- **Google Cloud Run**: Containerized deployment on Google Cloud

## Configuration

### Environment Variables

The application requires the following environment variables:

#### Backend
- `PORT`: Backend server port
- `MONGO_USER`: MongoDB username
- `MONGO_PASSWORD`: MongoDB password
- `MONGO_CLUSTER`: MongoDB cluster name
- `MONGO_APP_NAME`: MongoDB application name
- `MONGO_HOST`: MongoDB host address
- `MONGO_DB_NAME`: MongoDB database name
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name for image uploads
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to GCP service account credentials file

#### Frontend
- `FE_PORT`: Frontend server port
- `NEXT_PUBLIC_API_URL`: URL for the backend API (client-facing)
- `BACKEND_URL`: URL for backend API (server-to-server, for Docker)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `NEXTAUTH_SECRET`: NextAuth secret key
- `NEXTAUTH_URL`: NextAuth URL
- `NEXTAUTH_DEBUG`: Enable NextAuth debug mode (true/false)
- `UNSAFE_EVAL`: Enable unsafe-eval in CSP (true/false)
- `ENABLE_PROXY_UPLOADS`: Enable image proxy through Next.js (true/false)

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- Docker and docker-compose (optional)
- MongoDB Atlas account (or local MongoDB instance)
- Google Cloud Platform account (for image uploads)

### Google Cloud Storage Setup

1. Create a Google Cloud Platform account if you don't have one
2. Create a new project or use an existing one
3. Enable the Google Cloud Storage API
4. Create a service account with Storage Admin permissions
5. Download the service account key as JSON
6. Save the key as `gcp-credentials.json` in the root directory of the project
7. Create a Cloud Storage bucket
8. Make sure the bucket has public access or configure appropriate permissions
9. Add the bucket name to your `.env` file as `GCS_BUCKET_NAME`

### Installation

#### Using Docker

1. Clone the repository
   ```
   git clone https://github.com/yourusername/turbulence.git
   cd turbulence
   ```

2. Set up environment variables
   - Create `.env` file in the root directory with the required variables
   - Place your `gcp-credentials.json` file in the root directory

3. Start the application
   ```
   docker-compose up -d
   ```

#### Manual Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/turbulence.git
   cd turbulence
   ```

2. Set up the backend
   ```
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

3. Set up the frontend
   ```
   cd frontend
   npm install
   npm run dev
   ```

## Usage

- Visit `http://localhost:3000` to view the blog
- Sign in with Google to create/edit posts
- Navigate to `/edit` to create a new post
- Use the image button in the editor to upload and embed images

## Deployment

The application can be deployed to any cloud provider that supports Docker containers. The frontend and backend are containerized separately and can be deployed independently if needed.

### Production Considerations

- Set up proper environment variables for production
- Configure CORS settings in the backend for your production domain
- Set up a reverse proxy (like Nginx) for production deployments
- Configure proper MongoDB security settings
- Secure your Google Cloud Storage bucket with appropriate IAM policies
- Consider using a CDN for serving images in production

## License

This project is licensed under the MIT License - see the LICENSE file for details.