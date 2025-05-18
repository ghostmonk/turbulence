/**
 * Post-related hooks for data operations
 */
import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import apiClient, { ApiRequestError } from '@/lib/api-client';
import { Post, CreatePostRequest } from '@/types/api';
import { handleAuthError } from '@/lib/auth';

/**
 * Hook for fetching posts
 */
export function useFetchPosts() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.posts.list(session?.accessToken);
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof ApiRequestError 
        ? err.message 
        : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  return {
    posts,
    loading,
    error,
    fetchPosts,
  };
}

/**
 * Hook for fetching a single post
 */
export function useFetchPost(id?: string) {
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async (postId: string) => {
    if (!postId || !session?.accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.posts.getById(postId, session.accessToken);
      setPost(data);
    } catch (err) {
      console.error('Error fetching post:', err);
      
      if (err instanceof ApiRequestError) {
        setError(err.status === 404 
          ? 'Post not found' 
          : err.message);
      } else {
        setError('Failed to fetch post');
      }
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  // Auto-fetch if ID is provided
  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
  }, [id, fetchPost]);

  return {
    post,
    loading,
    error,
    fetchPost,
  };
}

/**
 * Hook for post operations (create, update)
 */
export function usePostOperations() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createPost = useCallback(async (postData: CreatePostRequest) => {
    if (!session?.accessToken) {
      setError('You must be logged in to create a post');
      return null;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const newPost = await apiClient.posts.create(
        postData,
        session.accessToken
      );
      
      setSuccess(true);
      return newPost;
    } catch (err) {
      console.error('Error creating post:', err);
      
      if (err instanceof ApiRequestError) {
        setError(err.status === 401 
          ? handleAuthError(err) 
          : err.message);
      } else {
        setError('Failed to create post');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const updatePost = useCallback(async (id: string, postData: Partial<Post>) => {
    if (!session?.accessToken) {
      setError('You must be logged in to update a post');
      return null;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const updatedPost = await apiClient.posts.update(
        id,
        postData,
        session.accessToken
      );
      
      setSuccess(true);
      return updatedPost;
    } catch (err) {
      console.error('Error updating post:', err);
      
      if (err instanceof ApiRequestError) {
        setError(err.status === 401 
          ? handleAuthError(err) 
          : err.message);
      } else {
        setError('Failed to update post');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const savePost = useCallback(async (postData: Partial<Post>, shouldRedirect = true) => {
    try {
      let result = null;
      
      if (postData.id) {
        // Update existing post
        result = await updatePost(postData.id, postData);
      } else {
        // Create new post
        result = await createPost(postData as CreatePostRequest);
      }
      
      if (result && shouldRedirect) {
        router.push('/');
      }
      
      return result;
    } catch (err) {
      console.error('Error saving post:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    }
  }, [createPost, updatePost, router]);

  return {
    loading,
    error,
    success,
    createPost,
    updatePost,
    savePost,
  };
} 