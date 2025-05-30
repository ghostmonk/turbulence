/**
 * API type definitions for the Turbulence blog
 */

/**
 * Represents a story
 */
export interface Story {
    id: string;
    title: string;
    content: string;
    is_published: boolean;
    slug?: string;
    date: string;
    createdDate: string;
    updatedDate: string;
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
 * Request payload for creating a new story
 */
export interface CreateStoryRequest {
    title: string;
    content: string;
    is_published: boolean;
}

/**
 * Request payload for updating an existing story
 */
export type UpdateStoryRequest = Partial<CreateStoryRequest>;

/**
 * Generic pagination response wrapper
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
} 