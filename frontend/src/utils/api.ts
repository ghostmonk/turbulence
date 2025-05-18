import { Post, ApiError } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ghostmonk.com';

// Define standalone functions first
export async function fetchContent(token?: string): Promise<Post[]> {
    console.log('fetchContent called with token:', !!token);
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
    console.log('fetchPost called with id:', id);
    const response = await fetch(`/api/posts/${id}`, {
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
    console.log('createPost called with post:', post);
    console.log('API_BASE_URL:', API_BASE_URL);
    const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(post),
    });

    if (!response.ok) {
        const error = await response.json() as ApiError;
        console.error('Create post error:', error);
        throw new Error(error.detail || 'Failed to create post');
    }

    return response.json();
}

export async function updatePost(id: string, post: Partial<Post>, token: string): Promise<Post> {
    console.log('updatePost called with id:', id, 'post:', post);
    const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(post),
    });

    if (!response.ok) {
        const error = await response.json() as ApiError;
        console.error('Update post error:', error);
        throw new Error(error.detail || 'Failed to update post');
    }

    return response.json();
}

// Also export an api object for backward compatibility
const api = { fetchContent, fetchPost, createPost, updatePost };
export default api;