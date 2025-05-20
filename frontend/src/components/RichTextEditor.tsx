import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import DOMPurify from "dompurify";

interface RichTextEditorProps {
    onChange: (content: string) => void;
    content?: string;
}

export default function RichTextEditor({ onChange, content = "" }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
            }),
            Image,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
        },
        immediatelyRender: false,
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [editor, content]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length) return;
        
        try {
            const file = e.target.files[0];
            
            const formData = new FormData();
            formData.append('files', file);
            
            const loadingText = `![Uploading ${file.name}...]()`;
            editor?.commands.insertContent(loadingText);
            
            const response = await fetch('/api/upload-proxy', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details');
                console.error('Upload failed:', response.status, errorText);
                throw new Error(`Failed to upload image: ${response.status}`);
            }
            
            // Get the image URL from the response
            const urls = await response.json();
            console.log('Upload successful, received URLs:', urls);
            
            if (urls && urls.length > 0) {
                const content = editor?.getHTML() || '';
                const updatedContent = content.replace(loadingText, '');
                editor?.commands.setContent(updatedContent);
                editor?.commands.insertContent(`<img src="${urls[0]}" alt="${file.name}" />`);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            const content = editor?.getHTML() || '';
            const loadingPattern = /!\[Uploading .*?\]\(\)/g;
            const updatedContent = content.replace(loadingPattern, '');
            editor?.commands.setContent(updatedContent);
            alert('Failed to upload image. Please try again.');
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    if (!editor) {
        return <div>Loading editor...</div>;
    }

    return (
        <div className="w-full border rounded dark:border-gray-700 p-2">
            <div className="mb-2 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                    Bold
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                    Italic
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                    H1
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                    H2
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                    Bullet List
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`px-2 py-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                    Ordered List
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`px-2 py-1 rounded ${editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                    Blockquote
                </button>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800"
                >
                    Image
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                />
            </div>
            <EditorContent editor={editor} className="border p-3 rounded min-h-[400px] dark:bg-gray-800 dark:text-white" />
        </div>
    );
}

export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html);
