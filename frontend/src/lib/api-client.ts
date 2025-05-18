/**
 * API Client for making requests to the backend
 */

import { ApiError, Story, CreateStoryRequest } from '@/types/api';

// Types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions<T = unknown> {
  method?: HttpMethod;
  token?: string;
  body?: T;
}

// Error handling
class ApiRequestError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Core fetch function with error handling
 */
async function fetchApi<T, B = unknown>(
  endpoint: string,
  { method = 'GET', token, body }: RequestOptions<B> = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  console.log(`${method} request to: ${endpoint}`, { hasToken: !!token });

  try {
    const response = await fetch(endpoint, config);

    // Handle non-JSON responses
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new ApiRequestError(
        `Invalid response format: ${response.headers.get('content-type')}`,
        response.status
      );
    }

    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      const errorMessage = (data as ApiError).detail || `Error: ${response.status} ${response.statusText}`;
      console.error('API error:', { status: response.status, data });
      throw new ApiRequestError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    // Handle network errors
    console.error('Network error:', error);
    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Unknown network error',
      0
    );
  }
}

/**
 * API endpoints that go through Next.js API routes
 */
const apiRoutes = {
  // Story-related endpoints
  stories: {
    list: () => '/api/stories',
    getById: (id: string) => `/api/stories/${id}`,
    create: () => '/api/stories',
    update: (id: string) => `/api/stories/${id}`,
    delete: (id: string) => `/api/stories/${id}`,
  },
};

/**
 * Public API client object
 */
const apiClient = {
  /**
   * Generic request method
   */
  request: fetchApi,

  /**
   * Story methods
   */
  stories: {
    list: (token?: string) => 
      fetchApi<Story[]>(apiRoutes.stories.list(), { token }),
    
    getById: (id: string, token: string) => 
      fetchApi<Story>(apiRoutes.stories.getById(id), { token }),
    
    create: (data: CreateStoryRequest, token: string) => 
      fetchApi<Story, CreateStoryRequest>(apiRoutes.stories.create(), { 
        method: 'POST', 
        body: data, 
        token 
      }),
    
    update: (id: string, data: Partial<Story>, token: string) => 
      fetchApi<Story, Partial<Story>>(apiRoutes.stories.update(id), { 
        method: 'PUT', 
        body: data, 
        token 
      }),
    
    delete: (id: string, token: string) => 
      fetchApi<Story>(apiRoutes.stories.delete(id), { 
        method: 'DELETE', 
        token 
      }),
  },
};

export { ApiRequestError, apiClient };
export default apiClient; 