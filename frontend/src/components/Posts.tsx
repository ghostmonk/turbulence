import React, { useEffect } from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import DOMPurify from "dompurify";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { formatDate } from "@/utils/formatDate";
import { Post } from '@/types/api';
import { useFetchPosts } from '@/hooks/usePosts';

const Posts: React.FC = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const { posts, loading, error, fetchPosts } = useFetchPosts();
    
    // Fetch posts on component mount
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleEdit = (post: Post) => {
        if (!session) {
            router.push('/api/auth/signin');
            return;
        }
        
        router.push({
            pathname: '/editor',
            query: { id: post.id }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <ClipLoader color="#4F46E5" loading={loading} size={50} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-red-800 font-semibold">Error Loading Posts</h3>
                <p className="text-red-600 mt-2">{error}</p>
                <button 
                    onClick={() => fetchPosts()}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-semibold text-gray-700">No posts found</h2>
                {session && (
                    <button
                        onClick={() => router.push('/editor')}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Create Your First Post
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="mt-4">            
            <div className="flex flex-col space-y-6">
                {posts.map((post) => (
                    <div key={post.id} className="card relative">
                        {session && (
                            <button
                                onClick={() => handleEdit(post)}
                                className="absolute top-4 right-4 px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                            >
                                Edit
                            </button>
                        )}
                        <h2 className="text-xl font-bold mb-2 dark:text-white text-gray-800">{post.title}</h2>
                        <h3 className="text-sm text-gray-400 mb-4">{formatDate(post.date)}</h3>
                        <div
                            className="dark:text-white text-gray-700"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(post.content),
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Posts;
