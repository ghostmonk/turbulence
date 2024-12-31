import React, { useEffect, useState } from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import DOMPurify from "dompurify";
import { fetchContent } from '@/utils/api';
import { formatDate } from "@/utils/formatDate";

interface ContentItem {
    id: string;
    title: string;
    content: string;
    date: Date
}

interface ContentListProps {
    url: string;
}

const Posts: React.FC<ContentListProps> = ({ url }) => {
    const [data, setData] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchContent(url)
            .then((response) => {
                setData(response);
            })
            .catch((err) => {
                setError(err.message || 'An unexpected error occurred');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [url]);

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
                <div key={item.id} className="border p-4 my-4">
                    <h2 className="text-2xl font-bold">{item.title}</h2>
                    <h3 className="text-xl font-bold">{formatDate(item.date)}</h3>
                    <div
                        className="mt-2 prose max-w-none"
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
