import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { VideoExtension } from './VideoExtension';
import { logger } from '@/utils/logger';
import { ErrorService } from '@/services/errorService';
import { ApiRequestError, StandardErrorResponse } from '@/types/error';
import { ErrorDisplay } from './ErrorDisplay';
import { 
    ALLOWED_IMAGE_TYPES, 
    ALLOWED_VIDEO_TYPES,
    validateImageFile,
    validateVideoFile,
    createFileValidationError
} from '@/utils/uploadUtils';

interface RichTextEditorProps {
    onChange: (content: string) => void;
    content?: string;
}

export default function RichTextEditor({ onChange, content = "" }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<StandardErrorResponse | string | ApiRequestError | null>(null);
    
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
            }),
            Image.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        width: {
                            default: null,
                            parseHTML: element => element.getAttribute('width'),
                            renderHTML: attributes => {
                                if (!attributes.width) {
                                    return {}
                                }
                                return { width: attributes.width }
                            },
                        },
                        height: {
                            default: null,
                            parseHTML: element => element.getAttribute('height'),
                            renderHTML: attributes => {
                                if (!attributes.height) {
                                    return {}
                                }
                                return { height: attributes.height }
                            },
                        },
                        srcset: {
                            default: null,
                            parseHTML: element => element.getAttribute('srcset'),
                            renderHTML: attributes => {
                                if (!attributes.srcset) {
                                    return {}
                                }
                                return { srcset: attributes.srcset }
                            },
                        },
                        sizes: {
                            default: null,
                            parseHTML: element => element.getAttribute('sizes'),
                            renderHTML: attributes => {
                                if (!attributes.sizes) {
                                    return {}
                                }
                                return { sizes: attributes.sizes }
                            },
                        },
                    }
                },
            }).configure({
                HTMLAttributes: {
                    class: 'responsive-image',
                },
                allowBase64: false,
                inline: false,
            }),
            VideoExtension,
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
        
        const file = e.target.files[0];
        setUploadError(null);
        
        // Client-side validation using utility functions
        const validation = validateImageFile(file);
        if (!validation.isValid) {
            setUploadError(createFileValidationError(file, validation.error!, 'image'));
            return;
        }
        
        const loadingText = `![Uploading ${file.name}...]()`;
        editor?.commands.insertContent(loadingText);
        
        try {
            const formData = new FormData();
            formData.append('files', file);
            
            const response = await fetch('/api/upload-proxy', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });
            
            logger.info('Image upload response received', { status: response.status });
            
            if (!response.ok) {
                const apiError = await ErrorService.parseApiError(response);
                ErrorService.logError(apiError, 'image upload', { fileName: file.name });
                setUploadError(apiError);
                throw apiError;
            }
            
            const data = await response.json();
            logger.info('Image upload successful', { data });
            
            if (data && data.urls && data.urls.length > 0) {
                const content = editor?.getHTML() || '';
                const updatedContent = content.replace(loadingText, '');
                editor?.commands.setContent(updatedContent);
                
                if (data.srcsets && data.srcsets.length > 0 && data.dimensions && data.dimensions.length > 0) {
                    const srcUrl = data.urls[0];
                    const srcset = data.srcsets[0];
                    const dimensions = data.dimensions[0];
                    const imgHTML = `<img src="${srcUrl}" srcset="${srcset}" sizes="(max-width: 500px) 500px, (max-width: 750px) 750px, 1200px" width="${dimensions.width}" height="${dimensions.height}" alt="${file.name}" />`;
                    editor?.commands.insertContent(imgHTML);
                } else if (data.srcsets && data.srcsets.length > 0) {
                    // Fallback without dimensions
                    const srcUrl = data.urls[0];
                    const srcset = data.srcsets[0];
                    const imgHTML = `<img src="${srcUrl}" srcset="${srcset}" sizes="(max-width: 500px) 500px, (max-width: 750px) 750px, 1200px" alt="${file.name}" />`;
                    editor?.commands.insertContent(imgHTML);
                } else {
                    // Fallback to old method
                    editor?.commands.insertContent(`<img src="${data.urls[0]}" alt="${file.name}" />`);
                }
            }
        } catch (error) {
            const content = editor?.getHTML() || '';
            const loadingPattern = /!\[Uploading .*?\]\(\)/g;
            const updatedContent = content.replace(loadingPattern, '');
            editor?.commands.setContent(updatedContent);
            
            if (!(error instanceof ApiRequestError)) {
                ErrorService.logError(error, 'image upload', { fileName: file.name });
                setUploadError(ErrorService.createDisplayError(error));
            }
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length) return;
        
        const file = e.target.files[0];
        setUploadError(null);
        
        const validation = validateVideoFile(file);
        if (!validation.isValid) {
            setUploadError(createFileValidationError(file, validation.error!, 'video'));
            return;
        }
        
        const loadingText = `[Uploading video ${file.name}...]`;
        editor?.commands.insertContent(loadingText);
        
        try {
            const formData = new FormData();
            formData.append('files', file);
            
            const response = await fetch('/api/upload-proxy', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });
            
            logger.info('Video upload response received', { status: response.status });
            
            if (!response.ok) {
                const apiError = await ErrorService.parseApiError(response);
                ErrorService.logError(apiError, 'video upload', { fileName: file.name });
                setUploadError(apiError);
                throw apiError;
            }
            
            const data = await response.json();
            logger.info('Video upload successful', { data });
            
            if (data && data.urls && data.urls.length > 0) {
                const content = editor?.getHTML() || '';
                const updatedContent = content.replace(loadingText, '');
                editor?.commands.setContent(updatedContent);
                
                // Insert video with basic attributes
                const videoUrl = data.urls[0];
                const dimensions = data.dimensions?.[0] || { width: 1280, height: 720 };
                
                (editor?.commands as any).setVideo({
                    src: videoUrl,
                    width: dimensions.width,
                    height: dimensions.height,
                });
            }
        } catch (error) {
            const content = editor?.getHTML() || '';
            const loadingPattern = /\[Uploading video .*?\]/g;
            const updatedContent = content.replace(loadingPattern, '');
            editor?.commands.setContent(updatedContent);
            
            if (!(error instanceof ApiRequestError)) {
                ErrorService.logError(error, 'video upload', { fileName: file.name });
                setUploadError(ErrorService.createDisplayError(error));
            }
        }
        
        if (videoInputRef.current) {
            videoInputRef.current.value = '';
        }
    };
    
    if (!editor) {
        return <div>Loading editor...</div>;
    }

    return (
        <div className="w-full border rounded dark:border-gray-700 p-2">
            {uploadError && (
                <div className="mb-4">
                    <ErrorDisplay 
                        error={ErrorService.createDisplayError(uploadError)} 
                        onDismiss={() => setUploadError(null)}
                        showDetails={true}
                    />
                </div>
            )}
            
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
                <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800"
                >
                    Video
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    onChange={handleImageUpload}
                />
                <input 
                    type="file" 
                    ref={videoInputRef} 
                    className="hidden" 
                    accept={ALLOWED_VIDEO_TYPES.join(',')}
                    onChange={handleVideoUpload}
                />
            </div>
            <EditorContent editor={editor} className="border p-3 rounded min-h-[400px] dark:bg-gray-800 dark:text-white" />
        </div>
    );
}
