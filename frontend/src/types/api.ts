export interface Post {
    id: string;
    title: string;
    content: string;
    is_published: boolean;
    date: string;
}

export interface ApiError {
    detail: string;
}

export interface CreatePostRequest {
    title: string;
    content: string;
    is_published: boolean;
} 