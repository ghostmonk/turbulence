import React, { useEffect, useState } from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import DOMPurify from "dompurify";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { fetchContent } from '@/utils/api';
import { formatDate } from "@/utils/formatDate";
import { Post } from '@/types/api';

interface ContentListProps {
    url: string;
}

const Posts: React.FC<ContentListProps> = ({ url }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchContent(session?.accessToken)
            .then((response) => {
                setData(response);
            })
            .catch((err) => {
                setError(err.message || 'An unexpected error occurred');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [session?.accessToken]);

    const handleEdit = (post: Post) => {
        if (!session?.accessToken) {
            router.push('/api/auth/signin');
            return;
        }
        
        router.push({
            pathname: '/editor',
            query: { 
                id: post.id,
                title: post.title,
                content: post.content,
                is_published: post.is_published
            }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <ClipLoader color="#123abc" loading={loading} size={50} />
            </div>
        );
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div className="mt-4 text-left">
            {data.map((item) => (
                <div key={item.id} className="card relative">
                    {session?.accessToken && (
                        <button
                            onClick={() => handleEdit(item)}
                            className="absolute top-4 right-4 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Edit
                        </button>
                    )}
                    <h2>{item.title}</h2>
                    <h3>{formatDate(item.date)}</h3>
                    <div
                        className="card-content"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(item.content),
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

export default Posts;
