# Turbulence

Turbulence is a modern blog/content management system built with Next.js and FastAPI. It allows authenticated users to create and publish rich text content that can be viewed by anyone.

## Features

- **Modern Tech Stack**: Next.js frontend with TypeScript and FastAPI backend
- **Rich Text Editing**: Create and edit posts with a full-featured rich text editor
- **Authentication**: Secure Google OAuth authentication for content creators
- **Responsive Design**: Beautiful UI with Tailwind CSS
- **MongoDB Integration**: Persistent storage with MongoDB Atlas
- **Docker Support**: Easy deployment with Docker and docker-compose

## Architecture

### Frontend

- **Framework**: Next.js with TypeScript
- **UI**: Tailwind CSS for styling
- **Authentication**: NextAuth.js with Google provider
- **Rich Text Editing**: React Quill
- **State Management**: React Hooks

### Backend

- **Framework**: FastAPI (Python)
- **Database**: MongoDB (via motor - async MongoDB driver)
- **Authentication**: Google OAuth token validation
- **Logging**: Google Cloud Logging

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- Docker and docker-compose (optional)
- MongoDB Atlas account (or local MongoDB instance)

### Environment Variables

#### Backend (.env)

```
MONGO_USER=your_mongo_user
MONGO_PASSWORD=your_mongo_password
MONGO_CLUSTER=your_mongo_cluster
MONGO_APP_NAME=your_mongo_app_name
MONGO_HOST=your_mongo_host
MONGO_DB_NAME=your_db_name
```

#### Frontend (.env.local)

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Installation

#### Using Docker

1. Clone the repository
   ```
   git clone https://github.com/yourusername/turbulence.git
   cd turbulence
   ```

2. Set up environment variables
   - Create `.env` file in the root directory with the required variables

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

## Deployment

The application can be deployed to any cloud provider that supports Docker containers. The frontend and backend are containerized separately and can be deployed independently if needed.

### Production Considerations

- Set up proper environment variables for production
- Configure CORS settings in the backend for your production domain
- Set up a reverse proxy (like Nginx) for production deployments
- Configure proper MongoDB security settings

## License

This project is licensed under the MIT License - see the LICENSE file for details.