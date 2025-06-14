// components/WritePageClient.tsx (corrected version)
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from 'react-hot-toast';

export default function WritePageClient() {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [statusPost, setStatusPost] = useState<"draft" | "published">("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  // Format buttons active state
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  const editorRef = useRef<HTMLDivElement>(null);
  const canSave = !!session?.user?.id;

  useEffect(() => {
    // Check if there's a theme preference in local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  // Update theme in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const parseTags = (input: string) =>
    input
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

  const handleSubmit = async () => {
    if (!canSave) {
      toast.error("Please login to save your story");
      return;
    }
    
    if (!title.trim()) {
      toast.error("Please add a title to your story");
      return;
    }
    
    if (!editorRef.current?.innerHTML || !editorRef.current.textContent?.trim()) {
      toast.error("Please add content to your story");
      return;
    }

    // Get the HTML content from our editor
    const htmlContent = editorRef.current.innerHTML;
    const tags = parseTags(tagsInput);
    
    const payload = {
      title: title.trim(),
      content: htmlContent,
      imageUrl: coverImage || "", // Use cover image for the post
      status: statusPost,
      tags,
    };

    setIsSaving(true);
    try {
      const res = await fetch("/api/writing", {  // Changed to correct endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save story");
      }

      toast.success("Story saved successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save story");
    } finally {
      setIsSaving(false);
    }
  };

  // For inline image upload
  const handleImageUpload = (url: string) => {
    // Create an image element
    const img = document.createElement('img');
    img.src = url;
    img.alt = "Uploaded image";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.margin = "10px 0";
    img.style.borderRadius = "4px";
    
    // Insert the image at cursor position or at the end
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        
        // Add a line break after the image (fixed)
        const br = document.createElement('br');
        // Directly insert after the image
        img.parentNode?.insertBefore(br, img.nextSibling);
      } else {
        editorRef.current.appendChild(img);
        // Add a line break
        editorRef.current.appendChild(document.createElement('br'));
      }
      
      editorRef.current.focus();
    }
    
    setShowFileUpload(false);
  };

  // For cover image upload
  const handleCoverImageUpload = (url: string) => {
    setCoverImage(url);
    setShowCoverUpload(false);
    toast.success("Cover image uploaded");
  };

  // Format text (bold, italic)
  // In WritePageClient.tsx, update the formatText function
const formatText = (command: string) => {
  document.execCommand(command, false);
  
  // Update active formats
  if (activeFormats.includes(command)) {
    setActiveFormats(activeFormats.filter(f => f !== command));
  } else {
    setActiveFormats([...activeFormats, command]);
  }
  
  if (editorRef.current) {
    editorRef.current.focus();
    
    // Save the current HTML to state
    if (editorRef.current.innerHTML) {
      setContent(editorRef.current.innerHTML);
    }
  }
};
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      {/* Theme toggle and save buttons */}
      <div className="sticky top-0 z-20 bg-opacity-90 backdrop-blur-sm bg-inherit border-b border-gray-700 py-3 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-yellow-300' : 'bg-gray-200 text-gray-800'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <button
              onClick={() => {
                setStatusPost("draft");
                handleSubmit();
              }}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } transition-colors`}
            >
              Save Draft
            </button>
            
            <button
              onClick={() => {
                setStatusPost("published");
                handleSubmit();
              }}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto p-6">
        {/* Cover image */}
        {coverImage && (
          <div className="relative mb-6 rounded-lg overflow-hidden h-60">
            <img 
              src={coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setCoverImage("")}
              className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
              title="Remove cover image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Story title */}
        <input
          type="text"
          placeholder="Add a title..."
          className={`w-full text-4xl font-bold mb-8 bg-transparent border-none outline-none ${
            theme === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400'
          }`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        {/* Simplified formatting toolbar */}
        <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-700 pb-3">
          <button
            onClick={() => formatText('bold')}
            className={`px-3 py-1.5 rounded text-sm font-bold ${
              activeFormats.includes('bold') 
                ? theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-200'
                : theme === 'dark' ? 'hover:bg-indigo-900/50' : 'hover:bg-indigo-100'
            }`}
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => formatText('italic')}
            className={`px-3 py-1.5 rounded text-sm italic ${
              activeFormats.includes('italic') 
                ? theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-200'
                : theme === 'dark' ? 'hover:bg-indigo-900/50' : 'hover:bg-indigo-100'
            }`}
            title="Italic"
          >
            I
          </button>
          <button
            onClick={() => setShowFileUpload(true)}
            className={`px-3 py-1.5 rounded text-sm ${
              theme === 'dark' ? 'hover:bg-indigo-900/50' : 'hover:bg-indigo-100'
            }`}
            title="Insert Image"
          >
            🖼️
          </button>
          <div className="ml-auto">
            <button
              onClick={() => setShowCoverUpload(true)}
              className={`px-3 py-1.5 rounded text-sm ${
                theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
              title="Set Cover Image"
            >
              Cover Image
            </button>
          </div>
        </div>
        
        {/* Content editor - Fixed the comment issue */}
        <div
          ref={editorRef}
          className={`prose max-w-none ${
            theme === 'dark' ? 'prose-invert' : 'prose-gray'
          } min-h-[50vh] focus:outline-none`}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Start writing your story..."
          style={{ 
            fontSize: '18px', 
            lineHeight: '1.6',
            minHeight: '400px'
          }}
        ></div>
        
        {/* Tags */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">
            Tags (comma separated)
          </label>
          <input
            type="text"
            placeholder="e.g. fiction, adventure, fantasy"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 focus:ring-indigo-500' 
                : 'bg-gray-100 border-gray-300 focus:ring-indigo-500'
            } border focus:outline-none focus:ring-2`}
          />
        </div>
      </div>
      
      {/* Image upload modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} max-w-md w-full p-6 rounded-lg`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Insert Image</h3>
              <button 
                onClick={() => setShowFileUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <FileUpload onImageUpload={handleImageUpload} />
          </div>
        </div>
      )}
      
      {/* Cover image upload modal */}
      {showCoverUpload && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} max-w-md w-full p-6 rounded-lg`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Set Cover Image</h3>
              <button 
                onClick={() => setShowCoverUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <FileUpload onImageUpload={handleCoverImageUpload} />
            
            <p className="mt-3 text-sm text-gray-500">
              This image will be used as the cover for your story and will be shown on your dashboard and story cards.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// File upload component
const FileUpload = ({ onImageUpload }: { onImageUpload: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB)");
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(10);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("timestamp", Date.now().toString());

    try {
      setProgress(30);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      setProgress(70);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Upload failed");
      }
      
      setProgress(90);
      
      const data = await res.json();
      
      // Support both url and fileUrl
      const imageUrl = data.url || data.fileUrl;
      
      if (imageUrl) {
        setProgress(100);
        onImageUpload(imageUrl);
      } else {
        throw new Error("No file URL returned from server");
      }
    } catch (error: any) {
      setError(error.message || "Upload failed");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded
          file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
      />
      
      {uploading && (
        <div className="mt-4">
          <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-1 text-center">{progress}%</p>
        </div>
      )}
      
      {error && (
        <p className="text-red-500 mt-2 text-sm">{error}</p>
      )}
    </div>
  );
};