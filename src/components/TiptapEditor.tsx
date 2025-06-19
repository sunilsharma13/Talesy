"use client";

import React, { useCallback, useEffect, useState, useRef} from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import Blockquote from '@tiptap/extension-blockquote';
import { toast } from 'react-hot-toast';
import FileUpload from './FileUpload'; // Reusing your FileUpload component

interface TiptapEditorProps {
  content: string;
  onContentChange: (html: string) => void;
  theme: 'light' | 'dark' | 'sepia';
  onImageUploadStart: () => void;
  onImageUploadComplete: () => void;
  isImageUploading: boolean;
  uploadProgress: number;
}

// Menu Bar Component for Editor Controls
const MenuBar = ({ editor, theme, onImageUpload, isImageUploading, uploadProgress }: {
  editor: Editor | null;
  theme: 'light' | 'dark' | 'sepia';
  onImageUpload: (file: File) => Promise<string>;
  isImageUploading: boolean;
  uploadProgress: number;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = useCallback(async (file: File | null) => {
    if (!editor || !file) return;

    try {
      const imageUrl = await onImageUpload(file); // This calls the parent's upload handler
      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
        toast.success("Image inserted!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to insert image.");
    }
  }, [editor, onImageUpload]);

  if (!editor) {
    return null;
  }

  const buttonClass = (isActive: boolean) =>
    `p-2 rounded ${isActive ? (theme === 'dark' ? 'bg-indigo-700 text-white' : 'bg-blue-200 text-blue-800') : (theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}`;
  const groupClass = "flex flex-wrap gap-1 border rounded-lg p-1";
  const outerContainerClass = `sticky top-[64px] z-20 p-2 border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : (theme === 'sepia' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white')}`;


  return (
    <div className={outerContainerClass}>
      <div className="flex flex-wrap items-center gap-2">
        <div className={groupClass}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={buttonClass(editor.isActive('bold'))}
            title="Bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.25 4.5A2.75 2.75 0 005.5 7.25v5.5A2.75 2.75 0 008.25 15h3.5A2.75 2.75 0 0014.5 12.25v-1.75a.75.75 0 00-1.5 0v1.75a1.25 1.25 0 01-1.25 1.25h-3.5a1.25 1.25 0 01-1.25-1.25v-5.5a1.25 1.25 0 011.25-1.25h3.5a1.25 1.25 0 011.25 1.25V9a.75.75 0 001.5 0V7.25A2.75 2.75 0 0011.75 4.5h-3.5z" clipRule="evenodd" /></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={buttonClass(editor.isActive('italic'))}
            title="Italic"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.75 4.5a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0V6.31L13.19 13.5H11.5a.75.75 0 000 1.5h3.25a.75.75 0 00.75-.75v-3.5a.75.75 0 00-1.5 0v2.94L6.81 6.5H8.5a.75.75 0 000-1.5H5.25a.75.75 0 00-.75.75z" /></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={buttonClass(editor.isActive('strike'))}
            title="Strike through"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.5 10.5a.5.5 0 000 1h13a.5.5 0 000-1h-13zM2.5 7A.5.5 0 013 6.5h14a.5.5 0 010 1H3a.5.5 0 01-.5-.5zM3 13.5a.5.5 0 000 1h14a.5.5 0 000-1H3z" clipRule="evenodd" /></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={buttonClass(editor.isActive('code'))}
            title="Code"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.5 3A.5.5 0 006 3.5v13a.5.5 0 00.5.5H8a.5.5 0 00.5-.5v-13a.5.5 0 00-.5-.5H6.5zM12 3a.5.5 0 01.5.5v13a.5.5 0 01-.5.5H10a.5.5 0 01-.5-.5v-13a.5.5 0 01.5-.5h2z" clipRule="evenodd" /></svg>
          </button>
        </div>

        <div className={groupClass}>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={buttonClass(editor.isActive('heading', { level: 1 }))}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={buttonClass(editor.isActive('heading', { level: 2 }))}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={buttonClass(editor.isActive('heading', { level: 3 }))}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <div className={groupClass}>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={buttonClass(editor.isActive('bulletList'))}
            title="Bullet List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zM7 13a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={buttonClass(editor.isActive('orderedList'))}
            title="Ordered List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zM7 13a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={buttonClass(editor.isActive('blockquote'))}
            title="Blockquote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 3a1 1 0 00-1-1H3a1 1 0 00-1 1v14a1 1 0 001 1h14a1 1 0 001-1V3zM9 8H7V6h2v2zm0 4H7V10h2v2zm4-4h-2V6h2v2zm0 4h-2V10h2v2z" clipRule="evenodd" /></svg>
          </button>
        </div>

        <div className={groupClass}>
          <button
            onClick={() => {
              const url = window.prompt('URL');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={buttonClass(editor.isActive('link'))}
            title="Add Link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 001.414 1.414l1.5-1.5zm-5.656 8.828a2 2 0 11-2.828-2.828l3-3a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 005.656 5.656l1.5-1.5a1 1 0 00-1.414-1.414l-1.5 1.5z" clipRule="evenodd" /></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive('link')}
            className={buttonClass(false)} // Always show as not active, just for removing
            title="Remove Link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 1.414L10 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 10 5.293 6.707a1 1 0 011.414-1.414L10 8.586l3.293-3.293a1 1 0 011.414 1.414L11.414 10l3.293 3.293z" clipRule="evenodd" /></svg>
          </button>
        </div>

        <div className={groupClass}>
          <button
            onClick={() => inputRef.current?.click()}
            className={buttonClass(editor.isActive('image'))}
            title="Insert Image"
            disabled={isImageUploading}
          >
            {isImageUploading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
            )}
            <input
              type="file"
              accept="image/*"
              ref={inputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleAddImage(e.target.files[0]);
                }
              }}
            />
          </button>
          {isImageUploading && (
            <div className="flex items-center space-x-2 text-sm text-gray-400 ml-2">
              <div className="w-16 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span>{uploadProgress}%</span>
            </div>
          )}
        </div>

        <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className={buttonClass(false)}
            title="Undo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className={buttonClass(false)}
            title="Redo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          </button>
      </div>
    </div>
  );
};

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onContentChange,
  theme,
  onImageUploadStart,
  onImageUploadComplete,
  isImageUploading,
  uploadProgress
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        validate: href => /^https?:\/\//.test(href),
      }),
      Image.configure({
        inline: false, // Ensure images are block elements
        allowBase64: true, // For pasting images, though server upload is preferred
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      ListItem,
      BulletList,
      OrderedList,
      Bold,
      Italic,
      Strike,
      Code,
      Blockquote,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose max-w-none focus:outline-none min-h-[50vh] p-4 rounded-b-lg ${
          theme === 'dark' ? 'prose-invert' : 'prose-gray'
        }`,
      },
    },
  });

  // Update editor content when external prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false); // false to not set history entry
    }
  }, [content, editor]);

  const handleEditorImageUpload = async (file: File): Promise<string> => {
    onImageUploadStart();
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { // Using your existing upload API
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Image upload failed");
      }

      const data = await res.json();
      const imageUrl = data.url || data.fileUrl; // Use url or fileUrl
      if (!imageUrl) {
        throw new Error("No image URL returned from server.");
      }
      toast.success("Image uploaded!");
      return imageUrl;
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image.");
      throw error;
    } finally {
      onImageUploadComplete();
    }
  };


  const editorClass = `${
    theme === 'dark' ? 'bg-gray-800 text-gray-100' : 
    theme === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' : 
    'bg-white text-gray-900'
  } rounded-lg shadow-md overflow-hidden`;

  return (
    <div className={editorClass}>
      <MenuBar
        editor={editor}
        theme={theme}
        onImageUpload={handleEditorImageUpload}
        isImageUploading={isImageUploading}
        uploadProgress={uploadProgress}
      />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;