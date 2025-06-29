// src/components/TiptapEditor.tsx
"use client";

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Heading from "@tiptap/extension-heading";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import type { Editor } from '@tiptap/react';
import type { Node } from 'prosemirror-model';
import { NodeSelection } from 'prosemirror-state';

interface TiptapEditorProps {
  content: string;
  onContentChange: (html: string) => void;
  onImageUpload?: (file: File, insertCallback: (url: string) => void) => void;
  theme: "light" | "dark" | "sepia";
}

interface ResizableImageProps {
  node: Node;
  getPos: () => number | undefined;
  editor: Editor;
}

const ResizableImage = ({ node, getPos, editor }: ResizableImageProps) => {
  const [resizeActive, setResizeActive] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && !node.attrs.width && !node.attrs.height) {
      const editorContentWidth = editor.view.dom.querySelector('.ProseMirror')?.clientWidth || editor.view.dom.offsetWidth;
      const initialWidth = Math.min(imgRef.current.naturalWidth, editorContentWidth * 0.8);
      if (initialWidth > 0) {
        editor.commands.updateAttributes('image', { width: initialWidth, height: 'auto' });
      }
    }
  }, [editor, getPos, node.attrs.width, node.attrs.height]);

  const setDimensions = useCallback((width: number | string, height: number | string) => {
    const pos = getPos();
    if (pos !== undefined) {
      editor.commands.setNodeSelection(pos);
      editor.commands.updateAttributes('image', { width, height });
    }
  }, [editor, getPos]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResizeActive(true);
    const startX = e.clientX;
    const startWidth = imgRef.current?.offsetWidth || (node.attrs.width as number);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!imgRef.current) return;
      const dx = moveEvent.clientX - startX;
      let newWidth = Math.max(50, startWidth + dx);
      let newHeight: string | number = 'auto';

      const editorContentWidth = editor.view.dom.querySelector('.ProseMirror')?.clientWidth || editor.view.dom.offsetWidth;
      if (newWidth > editorContentWidth) {
        newWidth = editorContentWidth;
      }
      setDimensions(newWidth, newHeight);
    };

    const onMouseUp = () => {
      setResizeActive(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [node.attrs.width, editor, getPos, setDimensions]);

  const isSelected = editor.isActive('image') &&
                     editor.state.selection instanceof NodeSelection &&
                     editor.state.selection.node.eq(node);

  return (
    <NodeViewWrapper className={`relative inline-block ${isSelected ? 'outline outline-2 outline-blue-500' : ''}`}>
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        style={{ width: node.attrs.width || 'auto', height: node.attrs.height || 'auto' }}
        className="block max-w-full h-auto mx-auto my-4 cursor-pointer"
      />
      {isSelected && (
        <>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize transform translate-x-1/2 translate-y-1/2"
            onMouseDown={handleMouseDown}
            title="Resize Image"
          />
        </>
      )}
    </NodeViewWrapper>
  );
};

const TiptapEditor = ({ content, onContentChange, onImageUpload, theme }: TiptapEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get theme-dependent CSS variables
  const getDynamicThemeVar = useCallback((prop: string) => `var(--${prop})`, []);

  // Theme-specific classes for button states.
  const buttonClasses = {
    light: "hover:bg-neutral-200 text-neutral-700",
    sepia: "hover:bg-amber-200 text-amber-800",
    // MODIFIED: Making the inactive button background significantly darker (neutral-900)
    // so it provides maximum contrast for neutral-300 icons.
    dark: "bg-neutral-200 hover:bg-neutral-1000 text-neutral-800", // <--- THIS LINE IS CHANGED
  };

  const activeClasses = {
    light: "bg-blue-200 text-blue-800",
    sepia: "bg-orange-200 text-orange-800",
    dark: "bg-indigo-600 text-white",
  };

  // Placeholder color classes - using Tailwind classes for these specific text colors
  const editorPlaceholderColor = {
    light: "text-gray-400",
    sepia: "text-amber-500",
    dark: "text-gray-500",
  }

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        strike: false,
        hardBreak: false,
      }),
      Heading.configure({
        levels: [1, 2],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ResizableImage);
        },
      }).configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'my-2 mx-auto',
          style: 'max-width: 100%; height: auto;',
        },
      }),
      HorizontalRule.extend({
        addNodeView() {
          return ({ node }) => {
            const hr = document.createElement("hr");
            hr.classList.add("my-8", "border-t-2", "border-indigo-500", "opacity-50", "rounded-full");
            return {
              dom: hr,
            };
          };
        },
      }),
      ListItem,
      BulletList,
      OrderedList,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'What\'s the heading?';
          }
          return 'Start writing from here...'; // Your requested dummy text
        },
        emptyNodeClass: `is-empty ${editorPlaceholderColor[theme]}`,
      }),
    ],
    content: content,
    onUpdate: ({ editor: updatedEditor }) => {
      onContentChange(updatedEditor.getHTML());
    },
    editorProps: {
      attributes: {
        // Apply Tailwind classes for prose styling and layout
        class: `
          focus:outline-none leading-relaxed prose prose-lg w-full max-w-full
          min-h-[300px] max-h-[900px] overflow-y-auto p-4
          ${theme === 'dark' ? 'prose-invert' : ''} {/* Handles text color inversion for dark mode prose */}
          ${theme === 'dark' ? 'scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900' : 'scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100'}
        `.replace(/\s+/g, ' ').trim(),
        // Apply dynamic background color directly via style attribute (as a string) for highest specificity
        style: `
          background-color: ${getDynamicThemeVar('background-secondary')};
          color: ${getDynamicThemeVar('text-color-primary')}; /* Ensure text color follows theme */
        `.replace(/\s+/g, ' ').trim(), // Important: convert style object to a single string
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];
            if (file.type.startsWith('image/') && onImageUpload && editor) {
                event.preventDefault();
                if (file.size > 2 * 1024 * 1024) {
                  toast.error(`Image "${file.name}" is too large (max 2MB).`);
                  return true;
                }
                onImageUpload(file, (url: string) => {
                    editor.chain().focus().setImage({ src: url }).run();
                });
                return true;
            }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/') && onImageUpload && editor) {
              const file = items[i].getAsFile();
              if (file) {
                event.preventDefault();
                if (file.size > 2 * 1024 * 1024) {
                  toast.error(`Pasted image is too large (max 2MB).`);
                  return true;
                }
                onImageUpload(file, (url: string) => {
                  editor.chain().focus().setImage({ src: url }).run();
                });
                return true;
              }
            }
          }
        }
        return false;
      }
    },
  });

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && onImageUpload) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          if (file.size > 2 * 1024 * 1024) {
            toast.error(`Image "${file.name}" is too large (max 2MB).`);
            return;
          }
          onImageUpload(file, (url: string) => {
            if (editor) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          });
        } else {
          toast.error(`File "${file.name}" is not an image.`);
        }
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div
      className="tiptap-container flex flex-col h-full rounded-lg border overflow-hidden"
      style={{
        backgroundColor: getDynamicThemeVar('background-primary'), // Main container background
        borderColor: getDynamicThemeVar('border-color'),
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Toolbar with dynamic background and text color */}
      <div
        className="editor-toolbar p-3 rounded-t-lg sticky top-0 z-10 flex flex-wrap gap-1 mb-2 transition-colors duration-300"
        style={{
          backgroundColor: getDynamicThemeVar('text-secondary'), // Toolbar background
          borderBottom: `1px solid ${getDynamicThemeVar('border-color')}`, // Toolbar border
          color: getDynamicThemeVar('text-color-primary'), // Toolbar text color for icons/text
        }}
      >
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded-md text-sm ${editor.isActive("paragraph") ? activeClasses[theme] : buttonClasses[theme]}`}
          title="Paragraph Text"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-align-left"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md text-sm ${editor.isActive("bold") ? activeClasses[theme] : buttonClasses[theme]}`}
          title="Bold (Ctrl+B)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bold"><path d="M6 12h8a4 4 0 0 0 4-4V4H6v8zm0 0h8a4 4 0 0 1 4 4v4H6v-8z"/></svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md text-sm ${editor.isActive("italic") ? activeClasses[theme] : buttonClasses[theme]}`}
          title="Italic (Ctrl+I)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-italic"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-md text-sm ${editor.isActive("heading", { level: 1 }) ? activeClasses[theme] : buttonClasses[theme]}`}
          title="Heading 1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-h-1"><path d="M10 12H14"/><path d="M10 18V6"/><path d="M14 18V6"/></svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md text-sm ${editor.isActive("heading", { level: 2 }) ? activeClasses[theme] : buttonClasses[theme]}`}
          title="Heading 2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-h-2"><path d="M4 12h8"/><path d="M12 18V6"/><path d="M17.5 12.5a3.5 3.5 0 1 1 0 7H13"/></svg>
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md text-sm ${editor.isActive("bulletList") ? activeClasses[theme] : buttonClasses[theme]}`}
          title="Bullet List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md text-sm ${editor.isActive("orderedList") ? activeClasses[theme] : buttonClasses[theme]}`}
          title="Numbered List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-ordered"><path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="M4 6h1v-.5a1.5 1.5 0 0 0-3 0v1a1.5 1.5 0 0 0 3 0V6"/><path d="M4 18v-1.5a1.5 1.5 0 0 1 3 0v1.5a1.5 1.5 0 0 1-3 0V18"/><path d="M6 12H4c0 1.1-.9 2-2 2"/></svg>
        </button>

        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={`p-1.5 rounded-md text-sm ${buttonClasses[theme]}`}
          title="Insert Separator Line"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus"><line x1="5" x2="19" y1="12" y2="12"/></svg>
        </button>

        <button
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href;
            const url = window.prompt("Enter URL:", previousUrl);
            if (url === null) return;
            if (url === "") {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
          }}
          className={`p-1.5 rounded-md text-sm ${editor.isActive("link") ? activeClasses[theme] : buttonClasses[theme]}`}
          title="Add Link (Ctrl+K)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07L10 6.33"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07L14 17.67"/></svg>
        </button>

        {editor.isActive("link") && (
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            className={`p-1.5 rounded-md text-sm ${buttonClasses[theme]}`}
            title="Remove Link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-unlink"><path d="m18.84 11.25-1.07-.38a2 2 0 0 1-1.1-3.23l3-3a5 5 0 0 0-7.07-7.07L8 6.33"/><path d="m5.26 13.91 1.07.38a2 2 0 0 1 1.1 3.23l-3 3a5 5 0 0 0 7.07 7.07L16 17.67"/><path d="m17 14 3-3"/><path d="m14 17 3-3"/></svg>
          </button>
        )}

        <button
          onClick={handleImageUploadClick}
          className={`p-1.5 rounded-md text-sm ${buttonClasses[theme]}`}
          title="Insert Image from Gallery"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </button>

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`p-1.5 rounded-md text-sm ${buttonClasses[theme]} transition-all duration-200`}
          title="Undo (Ctrl+Z)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-undo"><path d="M9.5 12H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10.5a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5H9.5a2 2 0 0 1-2-2V12z"/></svg>
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`p-1.5 rounded-md text-sm ${buttonClasses[theme]} transition-all duration-200`}
          title="Redo (Ctrl+Y)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-redo"><path d="M14.5 12H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9.5a5 5 0 0 1-5-5V12a5 5 0 0 1 5-5h5a2 2 0 0 1 2 2v3"/></svg>
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;