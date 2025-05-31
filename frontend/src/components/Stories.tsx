import React, { useEffect, useMemo, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import ClipLoader from 'react-spinners/ClipLoader';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { formatDate } from "@/utils/formatDate";
import { Story } from '@/types/api';
import { useFetchStories, useStoryOperations } from '@/hooks/useStories';
import { sanitizeHtml } from '@/utils/sanitizer';

/**
 * Safely gets the story URL based on the slug
 * Falls back to ID if slug is not available
 */
const getStoryPath = (story: Story): string => {
    if (!story.slug || story.slug.trim() === '') {
        return `/stories/${story.id}`;
    }
    return `/stories/${story.slug}`;
};

const StoryItem = React.memo(({ 
    story, 
    session, 
    onEdit, 
    onDelete, 
    deleteLoading 
}: { 
    story: Story, 
    session: any, 
    onEdit: (story: Story) => void, 
    onDelete: (story: Story) => Promise<void>,
    deleteLoading: boolean
}) => {
    const isDraft = !story.is_published;
    const storyPath = getStoryPath(story);
    
    return (
        <div 
            key={story.id} 
            className={`card relative ${isDraft ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : ''}`}
        >
            <div className="absolute top-4 right-4 flex gap-2">
                {isDraft && (
                    <span className="px-3 py-1 text-xs bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200 rounded-full font-medium">
                        DRAFT
                    </span>
                )}
                {session && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(story)}
                            className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                        >
                            Edit
                        </button>
                        {isDraft && (
                            <button
                                onClick={() => onDelete(story)}
                                disabled={deleteLoading}
                                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        )}
                    </div>
                )}
            </div>
            <Link 
                href={storyPath}
                className={`block ${isDraft ? 'pointer-events-none' : ''}`}
            >
                <h2 className={`text-xl font-bold mb-2 ${isDraft && session ? 'pr-48' : isDraft ? 'pr-32' : session ? 'pr-16' : ''} ${!isDraft ? 'text-indigo-700 hover:text-indigo-900' : ''}`}
                    title={story.title}
                >
                    {story.title}
                </h2>
            </Link>
            <div className="flex items-center text-sm mb-4">
                <span className="text-gray-400">{formatDate(story.createdDate)}</span>
                {story.updatedDate !== story.createdDate && (
                    <span className="text-gray-400 text-xs ml-2 opacity-70">
                        (Updated: {formatDate(story.updatedDate)})
                    </span>
                )}
            </div>
            {!isDraft && (
                <Link href={storyPath} className="block">
                    <div
                        className="card-content dark:prose-invert"
                        dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(story.content),
                        }}
                    />
                    <div className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Read full story →
                    </div>
                </Link>
            )}
            {isDraft && (
                <div
                    className="card-content dark:prose-invert"
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(story.content),
                    }}
                />
            )}
        </div>
    );
});

StoryItem.displayName = 'StoryItem';

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
    const { deleteStory, loading: deleteLoading } = useStoryOperations();
    
    // Initialize data on component mount
    useEffect(() => {
        resetStories();
    }, [resetStories]);

    // Create stable callbacks for event handlers
    const handleEdit = useCallback((story: Story) => {
        if (!session) {
            router.push('/api/auth/signin');
            return;
        }
        
        router.push({
            pathname: '/editor',
            query: { id: story.id }
        });
    }, [session, router]);

    const handleDelete = useCallback(async (story: Story) => {
        if (!session) {
            router.push('/api/auth/signin');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete "${story.title}"? This action cannot be undone.`)) {
            return;
        }
        
        const success = await deleteStory(story.id);
        if (success) {
            resetStories(); // Refresh the list
        }
    }, [session, router, deleteStory, resetStories]);

    // Memoize the story list to prevent unnecessary re-renders
    const storyItems = useMemo(() => {
        return stories.map(story => (
            <StoryItem
                key={story.id}
                story={story}
                session={session}
                onEdit={handleEdit}
                onDelete={handleDelete}
                deleteLoading={deleteLoading}
            />
        ));
    }, [stories, session, handleEdit, handleDelete, deleteLoading]);

    // Handle error state
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

    // Handle empty state
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
                key="story-infinite-scroll"
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
                        You&apos;ve reached the end
                    </div>
                }
            >
                <div className="flex flex-col space-y-6">
                    {storyItems}
                </div>
            </InfiniteScroll>
        </div>
    );
};

export default Stories;
