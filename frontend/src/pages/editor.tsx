import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { Story } from '@/types/api';
import { isTokenExpired } from '@/lib/auth';
import { useFetchStory, useStoryOperations } from '@/hooks/useStories';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

export default function EditorPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { id } = router.query;
  const storyId = typeof id === 'string' ? id : undefined;
  
  // Custom hooks
  const { story: fetchedStory, loading: fetchLoading, error: fetchError } = useFetchStory(storyId);
  const { saveStory, loading: saveLoading, error: saveError } = useStoryOperations();
  
  // Local state
  const [story, setStory] = useState<Partial<Story>>({
    title: '',
    content: '',
    is_published: true
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Reset form to create a new story
  const resetForm = useCallback(() => {
    setStory({
      title: '',
      content: '',
      is_published: true
    });
    setError(null);
    // Clear the id from the URL without full page reload
    router.push('/editor', undefined, { shallow: true });
  }, [router]);
  
  // Update local state when story is fetched
  useEffect(() => {
    if (fetchedStory) {
      setStory(fetchedStory);
      setError(null);
    }
  }, [fetchedStory]);

  // Handle fetch errors
  useEffect(() => {
    if (fetchError && storyId) {
      setError(fetchError);
    }
  }, [fetchError, storyId]);
  
  // Reset form when storyId becomes undefined (new story mode)
  useEffect(() => {
    if (!storyId) {
      // Only reset the form if we're explicitly in "new story" mode
      // and not just on initial component mount
      if (Object.keys(router.query).length > 0 || story.id) {
        resetForm();
      }
    }
  }, [storyId, router.query, story.id, resetForm]);
  
  // Set story data from URL params if available (for new stories from other pages)
  useEffect(() => {
    if (!storyId) {
      const { title, content, is_published } = router.query;
      if (title || content) {
        setStory({
          title: title as string || '',
          content: content as string || '',
          is_published: is_published === undefined ? true : is_published === 'true'
        });
      }
    }
  }, [router.query, storyId]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent, shouldPublish: boolean = true) => {
    e.preventDefault();
    
    if (!session) {
      setError("You must be logged in to save a story");
      return;
    }
    
    if (!session.accessToken) {
      setError("No access token found. Please log in again.");
      console.error("Missing access token in session:", session);
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const storyToSave = {
        ...story,
        is_published: shouldPublish ? story.is_published : false
      };
      
      // Pass false to prevent automatic redirection in the saveStory hook
      const result = await saveStory(storyToSave, false);
      
      if (!result) {
        throw new Error("Failed to save story");
      }
      
      // Manually redirect after successful save
      router.push('/');
      
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error: ${errorMessage}`);
      setIsSaving(false);
    }
  }, [session, story, saveStory, router]);
  
  // Auto-save and session expiry check
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.accessToken && isTokenExpired(session.accessToken) && (story.title || story.content)) {
        handleSubmit(new Event('submit') as unknown as React.FormEvent, false).then(() => {
          alert("Session expired. Your story has been saved as a draft. Logging out.");
          signOut();
        });
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session?.accessToken, story.title, story.content, handleSubmit]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Update handlers
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStory(prev => ({ ...prev, title: e.target.value }));
  };

  const handleContentChange = (content: string) => {
    setStory(prev => ({ ...prev, content }));
  };

  const handlePublishToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStory(prev => ({ ...prev, is_published: e.target.checked }));
  };

  // Loading state
  const isLoading = fetchLoading || saveLoading || status === 'loading';
  if (isLoading && !isSaving) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {story.id ? 'Edit Story' : 'New Story'}
        </h1>
        {story.id && (
          <button
            type="button"
            onClick={resetForm}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            New Story
          </button>
        )}
      </div>

      {(error || saveError) && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error || saveError}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4 max-w-4xl mx-auto">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={story.title || ''}
            onChange={handleTitleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            placeholder="Story title"
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content
          </label>
          <div className="mt-1">
            <RichTextEditor
              content={story.content || ''}
              onChange={handleContentChange}
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="is_published"
            name="is_published"
            type="checkbox"
            checked={story.is_published || false}
            onChange={handlePublishToggle}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
            disabled={isSaving}
          />
          <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Publish
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading || isSaving}
          >
            {isSaving ? 'Saving...' : `Save${story.is_published ? ' & Publish' : ' as Draft'}`}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 