import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import RichTextEditor, { sanitizeHtml } from "../components/RichTextEditor";

const EditPage: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect unauthenticated users
    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/");
        }
    }, [status, router]);

    // State
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                body: JSON.stringify({ title, content }),
            });

            if (response.ok) {
                alert("Post created successfully!");
                setTitle("");
                setContent("");
            } else {
                alert("Error creating post.");
            }
        } catch (error) {
            console.error(error);
            alert("An unexpected error occurred.");
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

            {/* Title Input */}
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
                />
            </div>

            {/* Rich Text Editor */}
            <div className="h-[500px] mb-4"> {/* Adjust height here */}
                <RichTextEditor
                    onSave={(updatedContent) => setContent(updatedContent)}
                    initialContent={content}
                />
            </div>

            {/* Submit Button */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    {isLoading ? "Posting..." : "Submit Post"}
                </button>
            </div>

            {/* Rendered Content Preview */}
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
