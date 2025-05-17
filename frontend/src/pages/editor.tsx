import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { Post } from '@/types/api';
import { fetchPost, createPost, updatePost } from '@/utils/api';
import { isTokenExpired } from '@/utils/isTokenExpired';
import { sanitizeHtml } from '@/components/RichTextEditor';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

export default function EditorPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [post, setPost] = useState<Partial<Post>>({
        title: '',
        content: '',
        is_published: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            if (session?.accessToken && isTokenExpired(session.accessToken) && (post.title || post.content)) {
                handleSubmit(new Event('submit') as any, false).then(() => {
                    alert("Session expired. Your post has been saved as a draft. Logging out.");
                    signOut();
                });
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [session?.accessToken, post.title, post.content]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
            return;
        }

        const { id, title, content, is_published } = router.query;
        if (id && typeof id === 'string' && session?.accessToken) {
            setLoading(true);
            fetchPost(id, session.accessToken)
                .then(data => {
                    setPost(data);
                })
                .catch(err => {
                    setError(err.message);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else if (title && content) {
            setPost({
                title: title as string,
                content: content as string,
                is_published: is_published === 'true'
            });
        }
    }, [router.query, status, session?.accessToken]);

    const handleSubmit = async (e: React.FormEvent, shouldPublish: boolean = true) => {
        e.preventDefault();
        if (!session?.accessToken) return;

        setLoading(true);
        setError(null);

        try {
            const postToSave = {
                ...post,
                is_published: shouldPublish ? post.is_published : false
            };

            const savedPost = post.id
                ? await updatePost(post.id, postToSave, session.accessToken)
                : await createPost(postToSave, session.accessToken);

            if (shouldPublish) {
                router.push('/');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">
                {post.id ? 'Edit Post' : 'New Post'}
            </h1>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
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
                        value={post.title}
                        onChange={(e) => setPost({ ...post, title: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                        maxLength={200}
                    />
                </div>
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                        Content
                    </label>
                    <RichTextEditor
                        initialContent={post.content || ''}
                        onSave={(content) => setPost({ ...post, content })}
                    />
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is_published"
                        checked={post.is_published}
                        onChange={(e) => setPost({ ...post, is_published: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                        Publish immediately
                    </label>
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, false)}
                        disabled={loading || !post.title || !post.content}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save as Draft
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !post.title || !post.content}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save Post'}
                    </button>
                </div>
            </form>

            {post.content && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-2">Preview</h2>
                    <div
                        className="prose prose-lg max-w-none bg-white p-4 rounded shadow"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                    />
                </div>
            )}
        </div>
    );
} 