import React, { useEffect } from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import DOMPurify from "dompurify";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { formatDate } from "@/utils/formatDate";
import { Story } from '@/types/api';
import { useFetchStories } from '@/hooks/useStories';

const Stories: React.FC = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const { stories, loading, error, fetchStories } = useFetchStories();
    
    // Fetch stories on component mount
    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    const handleEdit = (story: Story) => {
        if (!session) {
            router.push('/api/auth/signin');
            return;
        }
        
        router.push({
            pathname: '/editor',
            query: { id: story.id }
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
                <h3 className="text-red-800 font-semibold">Error Loading Stories</h3>
                <p className="text-red-600 mt-2">{error}</p>
                <button 
                    onClick={() => fetchStories()}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (stories.length === 0) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-semibold text-gray-700">No stories found</h2>
                {session && (
                    <button
                        onClick={() => router.push('/editor')}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Create Your First Story
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="mt-4">            
            <div className="flex flex-col space-y-6">
                {stories.map((story) => (
                    <div key={story.id} className="card relative">
                        {session && (
                            <button
                                onClick={() => handleEdit(story)}
                                className="absolute top-4 right-4 px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                            >
                                Edit
                            </button>
                        )}
                        <h2 className="text-xl font-bold mb-2">{story.title}</h2>
                        <h3 className="text-sm text-gray-400 mb-4">{formatDate(story.date)}</h3>
                        <div
                            className="card-content"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(story.content),
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Stories;
