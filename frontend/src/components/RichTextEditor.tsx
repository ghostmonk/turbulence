import React, { useState } from "react";
import dynamic from "next/dynamic";
import DOMPurify from "dompurify";

// Dynamically load ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

interface RichTextEditorProps {
    onSave: (content: string) => void;
    initialContent?: string;
}

export default function RichTextEditor({ onSave, initialContent = "" }: RichTextEditorProps) {
    const [editorContent, setEditorContent] = useState(initialContent);

    const handleChange = (content: string) => {
        setEditorContent(content);
        onSave(content);
    };

    return (
        <div className="w-full h-full overflow-hidden rounded border dark:border-gray-700">
            <ReactQuill
                value={editorContent}
                onChange={handleChange}
                modules={{
                    toolbar: [
                        ["bold", "italic", "underline", "strike"],
                        [{ header: [1, 2, 3, false] }],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["blockquote", "link"],
                        ["clean"],
                    ],
                }}
                placeholder="Write your post content here..."
                className="h-full"
            />
        </div>
    );
}

export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html);
