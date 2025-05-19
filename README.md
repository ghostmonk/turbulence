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

## Architecture

### Frontend

- **Framework**: Next.js with TypeScript
- **UI**: Tailwind CSS for styling
- **Authentication**: NextAuth.js with Google provider
- **Rich Text Editing**: TipTap editor with image support
- **State Management**: React Hooks

### Backend

- **Framework**: FastAPI (Python)
- **Database**: MongoDB (via motor - async MongoDB driver)
- **Authentication**: Google OAuth token validation
- **File Storage**: Google Cloud Storage for image uploads
- **Logging**: Google Cloud Logging

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- Docker and docker-compose (optional)
- MongoDB Atlas account (or local MongoDB instance)
- Google Cloud Platform account (for image uploads)

### Environment Variables

#### Backend (.env)

```
MONGO_USER=your_mongo_user
MONGO_PASSWORD=your_mongo_password
MONGO_CLUSTER=your_mongo_cluster
MONGO_APP_NAME=your_mongo_app_name
MONGO_HOST=your_mongo_host
MONGO_DB_NAME=your_db_name
GCS_BUCKET_NAME=your_gcs_bucket_name
```

#### Frontend (.env.local)

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

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