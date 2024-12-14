import { useSession, signIn, signOut } from "next-auth/react";
import React, { useState } from "react";

const EditPage: React.FC = () => {
    const { data: session } = useSession();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("Session data:", session);
        try {
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken || ""}`,
                },
                credentials: "include",
                body: JSON.stringify({ title, content }),
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Story posted! ID: ${data.id}`);
                setTitle("");
                setContent("");
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || "Failed to post story"}`);
            }
        } catch (error) {
            console.error("Error submitting story:", error);
            alert("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!session) {
        return (
            <div>
                <h1>Please sign in</h1>
                <button onClick={() => signIn("google")}>Sign in with Google</button>
            </div>
        );
    }

    return (
        <div>
            <form
                onSubmit={handleSubmit}
                className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md space-y-4"
            >
                <h2 className="text-xl font-bold text-gray-800">Create a Post</h2>
                <div>
                    <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label
                        htmlFor="content"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Content
                    </label>
                    <textarea
                        id="content"
                        placeholder="Content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={6}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {isLoading ? "Posting..." : "Post"}
                </button>
            </form>
            <button onClick={() => signOut()}>Sign out</button>
        </div>
    );
};

export default EditPage;
