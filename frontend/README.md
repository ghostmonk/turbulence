# Turbulence Frontend

A Next.js-based frontend for the Turbulence blog/CMS system.

## Architecture

The frontend is structured with a clean, maintainable architecture:

### Core Components

- **API Client Layer** (`src/lib/api-client.ts`): Central module for API communication with consistent error handling
- **Authentication Utilities** (`src/lib/auth.ts`): Token handling and auth-related helper functions
- **Custom Hooks** (`src/hooks/`): React hooks for data fetching and state management
- **API Routes** (`src/pages/api/`): Next.js API routes that proxy requests to the backend
- **Components** (`src/components/`): Reusable UI components

### Data Flow

1. **UI Components**: Use custom hooks to fetch and manipulate data
2. **Custom Hooks**: Manage state and connect to API client
3. **API Client**: Makes requests to Next.js API routes
4. **API Routes**: Proxy requests to the backend with authentication

### Authentication

The app uses NextAuth.js for authentication with Google OAuth. The authentication flow:
1. User signs in via Google
2. NextAuth handles token management
3. Tokens are passed to the backend API when needed

## Development

To run the development server:

```bash
npm run dev
# or with Docker
npm run dev:docker
```

## Building

```bash
npm run build
npm start
```

## Docker

The application can be run with Docker using:

```bash
docker build -t turbulence-frontend .
docker run -p 3000:3000 turbulence-frontend
``` 