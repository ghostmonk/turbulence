/**
 * Story-related hooks for data operations
 */
import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import apiClient, { ApiRequestError } from '@/lib/api-client';
import { Story, CreateStoryRequest } from '@/types/api';
import { handleAuthError } from '@/lib/auth';

/**
 * Hook for fetching stories
 */
export function useFetchStories() {
  const { data: session } = useSession();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.stories.list(session?.accessToken);
      setStories(data);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err instanceof ApiRequestError 
        ? err.message 
        : 'Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  return {
    stories,
    loading,
    error,
    fetchStories,
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