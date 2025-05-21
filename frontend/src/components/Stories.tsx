import React, { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
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
    const { 
        stories, 
        loading, 
        error, 
        fetchStories, 
        hasMore, 
        totalStories, 
        resetStories 
    } = useFetchStories();
    
    // Initialize data on component mount
    useEffect(() => {
        resetStories();
    }, [resetStories]);

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

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-red-800 font-semibold">Error Loading Stories</h3>
                <p className="text-red-600 mt-2">{error}</p>
                <button 
                    onClick={() => resetStories()}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (stories.length === 0 && !loading) {
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
            {stories.length > 0 && (
                <div className="mb-4 text-sm text-gray-500">
                    Showing {stories.length} of {totalStories} stories
                </div>
            )}
            
            <InfiniteScroll
                dataLength={stories.length}
                next={fetchStories}
                hasMore={hasMore}
                loader={
                    <div className="flex justify-center items-center py-4">
                        <ClipLoader color="#4F46E5" loading={true} size={35} />
                    </div>
                }
                endMessage={
                    <div className="text-center py-4 text-gray-500">
                        You've reached the end
                    </div>
                }
            >
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
            </InfiniteScroll>
        </div>
    );
};

export default Stories;
