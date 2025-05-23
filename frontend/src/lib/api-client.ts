/**
 * API Client for making requests to the backend
 */

import { ApiError, Story, CreateStoryRequest, PaginatedResponse } from '@/types/api';

// Types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions<T = unknown> {
  method?: HttpMethod;
  token?: string;
  body?: T;
  params?: Record<string, string | number>;
}

// Error handling
class ApiRequestError extends Error {
  status: number;
  data: unknown;
  requestDetails?: {
    url: string;
    method: string;
    hasToken: boolean;
    bodyPreview?: string;
  };

  constructor(
    message: string, 
    status: number, 
    data?: unknown, 
    requestDetails?: { url: string; method: string; hasToken: boolean; bodyPreview?: string }
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
    this.requestDetails = requestDetails;
    
    // Capture stack trace for better debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiRequestError);
    }
  }
}

/**
 * Core fetch function with error handling
 */
async function fetchApi<T, B = unknown>(
  endpoint: string,
  { method = 'GET', token, body, params }: RequestOptions<B> = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add query parameters if provided
  let url = endpoint;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url = `${endpoint}?${queryString}`;
    }
  }

  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  // Create request details for error reporting
  const requestDetails = {
    url,
    method,
    hasToken: !!token,
    bodyPreview: body ? JSON.stringify(body).substring(0, 100) + (JSON.stringify(body).length > 100 ? '...' : '') : undefined
  };

  console.log(`${method} request to: ${url}`, requestDetails);

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new ApiRequestError(
        `Invalid response format: ${response.headers.get('content-type')}`,
        response.status,
        undefined,
        requestDetails
      );
    }

    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      const errorMessage = (data as ApiError).detail || `Error: ${response.status} ${response.statusText}`;
      console.error('API error:', { 
        status: response.status, 
        data,
        request: requestDetails
      });
      throw new ApiRequestError(errorMessage, response.status, data, requestDetails);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    // Handle network errors with more details
    console.error('Network error:', error, {
      request: requestDetails,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Unknown network error',
      0,
      undefined,
      requestDetails
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

// Pagination interface
interface PaginationParams {
  limit?: number;
  offset?: number;
  include_drafts?: boolean;
}

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
    list: (token?: string, pagination?: PaginationParams) => 
      fetchApi<PaginatedResponse<Story>>(apiRoutes.stories.list(), { 
        token,
        params: pagination as Record<string, string | number>
      }),
    
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