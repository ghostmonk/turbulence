import React, { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import ClipLoader from 'react-spinners/ClipLoader';
import DOMPurify from "dompurify";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { formatDate } from "@/utils/formatDate";
import { Story } from '@/types/api';
import { useFetchDrafts } from '@/hooks/useStories';

const Drafts: React.FC = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const { 
        drafts, 
        loading, 
        error, 
        fetchDrafts, 
        hasMore, 
        totalDrafts, 
        resetDrafts 
    } = useFetchDrafts();
    
    // Initialize data on component mount
    useEffect(() => {
        if (session?.accessToken) {
            resetDrafts();
        }
    }, [resetDrafts, session?.accessToken]);

    const handleEdit = (draft: Story) => {
        router.push({
            pathname: '/editor',
            query: { id: draft.id }
        });
    };

    if (!session) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-semibold text-gray-700">Please log in to view drafts</h2>
                <button
                    onClick={() => router.push('/api/auth/signin')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Log In
                </button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-red-800 font-semibold">Error Loading Drafts</h3>
                <p className="text-red-600 mt-2">{error}</p>
                <button 
                    onClick={() => resetDrafts()}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (drafts.length === 0 && !loading) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-semibold text-gray-700">No drafts found</h2>
                <p className="text-gray-500 mt-2">Create a new story and save it as a draft to see it here.</p>
                <button
                    onClick={() => router.push('/editor')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Create New Story
                </button>
            </div>
        );
    }

    return (
        <div className="mt-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Drafts</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    These are your unpublished stories. Click "Edit" to continue working on them.
                </p>
            </div>

            {drafts.length > 0 && (
                <div className="mb-4 text-sm text-gray-500">
                    Showing {drafts.length} of {totalDrafts} drafts
                </div>
            )}
            
            <InfiniteScroll
                dataLength={drafts.length}
                next={fetchDrafts}
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
                    {drafts.map((draft) => (
                        <div key={draft.id} className="card relative">
                            <div className="absolute top-4 right-4 flex gap-2">
                                <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                    Draft
                                </span>
                                <button
                                    onClick={() => handleEdit(draft)}
                                    className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                                >
                                    Edit
                                </button>
                            </div>
                            <h2 className="text-xl font-bold mb-2 pr-24">{draft.title}</h2>
                            <h3 className="text-sm text-gray-400 mb-4">{formatDate(draft.date)}</h3>
                            <div
                                className="card-content"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(draft.content),
                                }}
                            />
                        </div>
                    ))}
                </div>
            </InfiniteScroll>
        </div>
    );
};

export default Drafts;