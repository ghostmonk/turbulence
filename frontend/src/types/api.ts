/**
 * API type definitions for the Turbulence blog
 */

/**
 * Represents a blog post
 */
export interface Post {
    id: string;
    title: string;
    content: string;
    is_published: boolean;
    date: string;
}

/**
 * API error response
 */
export interface ApiError {
    detail: string;
    status?: number;
    error?: string;
}

/**
 * Request payload for creating a new post
 */
export interface CreatePostRequest {
    title: string;
    content: string;
    is_published: boolean;
}

/**
 * Request payload for updating an existing post
 */
export type UpdatePostRequest = Partial<CreatePostRequest>; 