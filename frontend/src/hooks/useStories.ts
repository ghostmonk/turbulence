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
export function useFetchStories(initialData?: PaginatedResponse<Story>, initialError?: string) {
  const { data: session } = useSession();
  const [stories, setStories] = useState<Story[]>(initialData?.items || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [hasMore, setHasMore] = useState(initialData ? initialData.items.length < initialData.total : true);
  const [totalStories, setTotalStories] = useState(initialData?.total || 0);
  
  const offsetRef = useRef(initialData?.items.length || 0);
  const isMountedRef = useRef(false);
  const tokenRef = useRef(session?.accessToken);
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);
  
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  
  useEffect(() => {
    tokenRef.current = session?.accessToken;
  }, [session?.accessToken]);
  
  const fetchStoriesInternal = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    
    if (reset) {
      offsetRef.current = 0;
      setStories([]);
      setHasMore(true);
      hasMoreRef.current = true;
    }
    
    if (!reset && !hasMoreRef.current) return;
    
    setLoading(true);
    loadingRef.current = true;
    setError(null);
    
    try {
      console.log(`Fetching stories, offset: ${offsetRef.current}, reset: ${reset}`);
      
      const response = await apiClient.stories.list(tokenRef.current, {
        limit: STORIES_PAGE_SIZE,
        offset: offsetRef.current,
        include_drafts: session?.accessToken ? true : false
      });
      
      setTotalStories(response.total);
      
      if (reset) {
        setStories(response.items);
      } else {
        setStories(prevStories => [...prevStories, ...response.items]);
      }
      
      offsetRef.current += response.items.length;
      const newHasMore = offsetRef.current < response.total;
      setHasMore(newHasMore);
      hasMoreRef.current = newHasMore;
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err instanceof ApiRequestError 
        ? err.message 
        : 'Failed to fetch stories');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [session?.accessToken]); // No dependencies to avoid recreation
  
  /* eslint-disable react-hooks/exhaustive-deps */
  // Load initial data only once after mounting
  useEffect(() => {
    // Only fetch on first mount if we don't have initial data
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      if (!initialData || initialData.items.length === 0) {
        fetchStoriesInternal(true);
      }
    }
  }, []); // Empty dependency array = run once on mount
  
  // Refetch when token changes
  useEffect(() => {
    // Skip first render, already handled by mount effect
    if (isMountedRef.current) {
      fetchStoriesInternal(true);
    }
  }, [session?.accessToken]);
  /* eslint-enable react-hooks/exhaustive-deps */
  // Expose stable functions that don't get recreated
  const loadMore = useCallback(() => {
    fetchStoriesInternal(false);
  }, [fetchStoriesInternal]);
  
  const resetStories = useCallback(() => {
    fetchStoriesInternal(true);
  }, [fetchStoriesInternal]);

  return {
    stories,
    loading,
    error,
    fetchStories: loadMore,
    hasMore,
    totalStories,
    resetStories,
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
  const [errorDetails, setErrorDetails] = useState<any | null>(null);

  const createStory = useCallback(async (storyData: CreateStoryRequest) => {
    if (!session?.accessToken) {
      setError('You must be logged in to create a story');
      return null;
    }
    
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setSuccess(false);
    
    try {
      console.log('Creating story:', {
        title: storyData.title,
        contentLength: storyData.content?.length || 0,
        isPublished: storyData.is_published
      });
      
      const newStory = await apiClient.stories.create(
        storyData,
        session.accessToken
      );
      
      setSuccess(true);
      return newStory;
    } catch (err) {
      console.error('Error creating story:', err);
      console.log('Story data that failed:', {
        title: storyData.title,
        contentLength: storyData.content?.length || 0,
        hasContent: !!storyData.content,
        isPublished: storyData.is_published
      });
      
      if (err instanceof ApiRequestError) {
        const errMsg = err.status === 401 
          ? handleAuthError(err) 
          : err.message;
        
        setError(errMsg);
        setErrorDetails({
          status: err.status,
          data: err.data,
          requestDetails: err.requestDetails
        });
        
        console.error('Complete API error details:', {
          message: err.message,
          status: err.status,
          data: err.data,
          requestDetails: err.requestDetails,
          stack: err.stack
        });
      } else {
        setError('Failed to create story');
        setErrorDetails(err instanceof Error ? {
          message: err.message,
          stack: err.stack
        } : err);
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
    setErrorDetails(null);
    setSuccess(false);
    
    try {
      console.log('Updating story:', {
        id,
        title: storyData.title,
        contentLength: storyData.content?.length || 0,
        isPublished: storyData.is_published
      });
      
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
        const errMsg = err.status === 401 
          ? handleAuthError(err) 
          : err.message;
        
        setError(errMsg);
        setErrorDetails({
          status: err.status,
          data: err.data,
          requestDetails: err.requestDetails
        });
        
        console.error('Complete API error details:', {
          message: err.message,
          status: err.status,
          data: err.data,
          requestDetails: err.requestDetails,
          stack: err.stack
        });
      } else {
        setError('Failed to update story');
        setErrorDetails(err instanceof Error ? {
          message: err.message,
          stack: err.stack
        } : err);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const deleteStory = useCallback(async (id: string) => {
    if (!session?.accessToken) {
      setError('You must be logged in to delete a story');
      return false;
    }
    
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setSuccess(false);
    
    try {
      console.log('Deleting story:', { id });
      
      await apiClient.stories.delete(id, session.accessToken);
      
      setSuccess(true);
      return true;
    } catch (err) {
      console.error('Error deleting story:', err);
      
      if (err instanceof ApiRequestError) {
        const errMsg = err.status === 401 
          ? handleAuthError(err) 
          : err.message;
        
        setError(errMsg);
        setErrorDetails({
          status: err.status,
          data: err.data,
          requestDetails: err.requestDetails
        });
      } else {
        setError('Failed to delete story');
        setErrorDetails(err instanceof Error ? {
          message: err.message,
          stack: err.stack
        } : err);
      }
      
      return false;
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
      if (err instanceof Error) {
        console.error('Error stack:', err.stack);
        setError(`Error: ${err.message}`);
      } else {
        setError('Unknown error occurred');
      }
      setErrorDetails(err);
      return null;
    }
  }, [createStory, updateStory, router]);

  return {
    loading,
    error,
    errorDetails,
    success,
    createStory,
    updateStory,
    deleteStory,
    saveStory,
  };
} 