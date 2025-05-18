import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { Post } from '@/types/api';
import { isTokenExpired } from '@/lib/auth';
import { useFetchPost, usePostOperations } from '@/hooks/usePosts';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

export default function EditorPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { id } = router.query;
  const postId = typeof id === 'string' ? id : undefined;
  
  // Custom hooks
  const { post: fetchedPost, loading: fetchLoading } = useFetchPost(postId);
  const { savePost, loading: saveLoading, error: saveError } = usePostOperations();
  
  // Local state
  const [post, setPost] = useState<Partial<Post>>({
    title: '',
    content: '',
    is_published: true
  });
  const [error, setError] = useState<string | null>(null);
  
  // Update local state when post is fetched
  useEffect(() => {
    if (fetchedPost) {
      setPost(fetchedPost);
    }
  }, [fetchedPost]);
  
  // Set post data from URL params if available (for new posts from other pages)
  useEffect(() => {
    if (!postId) {
      const { title, content, is_published } = router.query;
      if (title || content) {
        setPost({
          title: title as string || '',
          content: content as string || '',
          is_published: is_published === 'true'
        });
      }
    }
  }, [router.query, postId]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent, shouldPublish: boolean = true) => {
    e.preventDefault();
    
    if (!session) {
      setError("You must be logged in to save a post");
      return;
    }
    
    if (!session.accessToken) {
      setError("No access token found. Please log in again.");
      console.error("Missing access token in session:", session);
      return;
    }

    setError(null);

    try {
      const postToSave = {
        ...post,
        is_published: shouldPublish ? post.is_published : false
      };
      
      const result = await savePost(postToSave, shouldPublish);
      
      if (!result) {
        throw new Error("Failed to save post");
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error: ${errorMessage}`);
    }
  }, [session, post, savePost]);
  
  // Auto-save and session expiry check
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.accessToken && isTokenExpired(session.accessToken) && (post.title || post.content)) {
        handleSubmit(new Event('submit') as unknown as React.FormEvent, false).then(() => {
          alert("Session expired. Your post has been saved as a draft. Logging out.");
          signOut();
        });
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session?.accessToken, post.title, post.content, handleSubmit]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Update handlers
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPost(prev => ({ ...prev, title: e.target.value }));
  };

  const handleContentChange = (content: string) => {
    setPost(prev => ({ ...prev, content }));
  };

  const handlePublishToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPost(prev => ({ ...prev, is_published: e.target.checked }));
  };

  // Loading state
  const isLoading = fetchLoading || saveLoading || status === 'loading';
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        {post.id ? 'Edit Post' : 'New Post'}
      </h1>

      {(error || saveError) && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error || saveError}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={post.title || ''}
            onChange={handleTitleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Post title"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <div className="mt-1 prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto">
            <RichTextEditor
              content={post.content || ''}
              onChange={handleContentChange}
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="is_published"
            name="is_published"
            type="checkbox"
            checked={post.is_published || false}
            onChange={handlePublishToggle}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
            Publish
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            Save{post.is_published ? ' & Publish' : ' as Draft'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 