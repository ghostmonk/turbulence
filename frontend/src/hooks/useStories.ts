/**
 * Story-related hooks for data operations
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import apiClient, { ApiRequestError } from '@/lib/api-client';
import { Story, CreateStoryRequest, PaginatedResponse } from '@/types/api';
import { handleAuthError } from '@/lib/auth';

const STORIES_PAGE_SIZE = 5;

/**
 * Hook for fetching stories with infinite scrolling support
 */
export function useFetchStories() {
  const { data: session } = useSession();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalStories, setTotalStories] = useState(0);
  const offsetRef = useRef(0);

  const fetchStories = useCallback(async (reset = false) => {
    if (loading) return;
    
    if (reset) {
      offsetRef.current = 0;
      setStories([]);
      setHasMore(true);
    }
    
    // If we already know there are no more stories, don't fetch
    if (!reset && !hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.stories.list(session?.accessToken, {
        limit: STORIES_PAGE_SIZE,
        offset: offsetRef.current
      });
      
      setTotalStories(response.total);
      
      if (reset) {
        setStories(response.items);
      } else {
        setStories(prevStories => [...prevStories, ...response.items]);
      }
      
      // Check if we've loaded all stories
      offsetRef.current += response.items.length;
      setHasMore(offsetRef.current < response.total);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err instanceof ApiRequestError 
        ? err.message 
        : 'Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, loading, hasMore]);

  // Reset and fetch when session changes
  useEffect(() => {
    fetchStories(true);
  }, [session?.accessToken]);

  return {
    stories,
    loading,
    error,
    fetchStories: () => fetchStories(),
    hasMore,
    totalStories,
    resetStories: () => fetchStories(true),
  };
}

/**
 * Hook for fetching a single story
 */
export function useFetchStory(id?: string) {
  const { data: session } = useSession();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStory = useCallback(async (storyId: string) => {
    if (!storyId || !session?.accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.stories.getById(storyId, session.accessToken);
      setStory(data);
    } catch (err) {
      console.error('Error fetching story:', err);
      
      if (err instanceof ApiRequestError) {
        setError(err.status === 404 
          ? 'Story not found' 
          : err.message);
      } else {
        setError('Failed to fetch story');
      }
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  // Auto-fetch if ID is provided
  useEffect(() => {
    if (id) {
      fetchStory(id);
    }
  }, [id, fetchStory]);

  return {
    story,
    loading,
    error,
    fetchStory,
  };
}

/**
 * Hook for story operations (create, update)
 */
export function useStoryOperations() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createStory = useCallback(async (storyData: CreateStoryRequest) => {
    if (!session?.accessToken) {
      setError('You must be logged in to create a story');
      return null;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const newStory = await apiClient.stories.create(
        storyData,
        session.accessToken
      );
      
      setSuccess(true);
      return newStory;
    } catch (err) {
      console.error('Error creating story:', err);
      
      if (err instanceof ApiRequestError) {
        setError(err.status === 401 
          ? handleAuthError(err) 
          : err.message);
      } else {
        setError('Failed to create story');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const updateStory = useCallback(async (id: string, storyData: Partial<Story>) => {
    if (!session?.accessToken) {
      setError('You must be logged in to update a story');
      return null;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const updatedStory = await apiClient.stories.update(
        id,
        storyData,
        session.accessToken
      );
      
      setSuccess(true);
      return updatedStory;
    } catch (err) {
      console.error('Error updating story:', err);
      
      if (err instanceof ApiRequestError) {
        setError(err.status === 401 
          ? handleAuthError(err) 
          : err.message);
      } else {
        setError('Failed to update story');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const saveStory = useCallback(async (storyData: Partial<Story>, shouldRedirect = true) => {
    try {
      let result = null;
      
      if (storyData.id) {
        // Update existing story
        result = await updateStory(storyData.id, storyData);
      } else {
        // Create new story
        result = await createStory(storyData as CreateStoryRequest);
      }
      
      if (result && shouldRedirect) {
        router.push('/');
      }
      
      return result;
    } catch (err) {
      console.error('Error saving story:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    }
  }, [createStory, updateStory, router]);

  return {
    loading,
    error,
    success,
    createStory,
    updateStory,
    saveStory,
  };
} 