import { Post, ApiError } from '@/types/api';

const API_BASE_URL = 'https://api.ghostmonk.com';

export async function fetchContent(token?: string): Promise<Post[]> {
    const headers: HeadersInit = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/data`, { headers });
    if (!response.ok) {
        const error = await response.json() as ApiError;
        throw new Error(error.detail || 'Failed to fetch posts');
    }
    return response.json();
}

export async function fetchPost(id: string, token: string): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/data/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json() as ApiError;
        throw new Error(error.detail || 'Failed to fetch post');
    }

    return response.json();
}

export async function createPost(post: Partial<Post>, token: string): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(post),
    });

    if (!response.ok) {
        const error = await response.json() as ApiError;
        throw new Error(error.detail || 'Failed to create post');
    }

    return response.json();
}

export async function updatePost(id: string, post: Partial<Post>, token: string): Promise<Post> {
    const response = await fetch(`${API_BASE_URL}/data/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(post),
    });

    if (!response.ok) {
        const error = await response.json() as ApiError;
        throw new Error(error.detail || 'Failed to update post');
    }

    return response.json();
} 