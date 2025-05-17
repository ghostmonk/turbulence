import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import RichTextEditor, { sanitizeHtml } from "../components/RichTextEditor";
import { isTokenExpired } from "@/utils/isTokenExpired";
import { ApiError } from "@/types/api";

const EditPage: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/");
        }
    }, [status, router]);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check for token expiration and save as draft if needed
    useEffect(() => {
        const interval = setInterval(() => {
            if (session?.accessToken && isTokenExpired(session.accessToken) && (title || content)) {
                savePost(false).then(() => {
                    alert("Session expired. Your post has been saved as a draft. Logging out.");
                    signOut();
                });
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [session?.accessToken, title, content]);

    const savePost = async (isPublished: boolean = true) => {
        try {
            setError(null);
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify({ 
                    title, 
                    content,
                    is_published: isPublished 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiError;
                throw new Error(errorData.detail || "Error saving post");
            }

            return true;
        } catch (error) {
            setError(error instanceof Error ? error.message : "An unexpected error occurred");
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const success = await savePost(true);
            
            if (success) {
                alert("Post created successfully!");
                setTitle("");
                setContent("");
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="flex justify-center items-center h-screen">
                <button
                    onClick={() => signIn("google")}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Sign in with Google
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                Create a Post
            </h1>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                </label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter post title"
                    className="mt-1 p-2 w-full border rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                    maxLength={200}
                />
            </div>

            <div className="h-[500px] mb-4">
                <RichTextEditor
                    onSave={(updatedContent) => setContent(updatedContent)}
                    initialContent={content}
                />
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !title || !content}
                    className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                        (isLoading || !title || !content) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isLoading ? "Posting..." : "Submit Post"}
                </button>
            </div>

            {content && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Preview</h2>
                    <div
                        className="prose prose-lg prose-invert max-w-none bg-white dark:bg-gray-800 p-4 rounded shadow"
                        dangerouslySetInnerHTML={{__html: sanitizeHtml(content)}}
                    />
                </div>
            )}
        </div>
    );
};

export default EditPage;
