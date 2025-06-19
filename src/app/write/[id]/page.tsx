"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from 'react-hot-toast';
import dynamic from "next/dynamic"; // Import dynamic for client-side only import
import ImageCropper from "@/components/ImageCropper"; // Keep your ImageCropper
import Link from "next/link"; // Ensure Link is imported for back button

// Dynamically import TiptapEditor as it's a client-side component
const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] flex items-center justify-center text-gray-400">
      Loading editor...
    </div>
  ),
});

interface PostData {
  _id?: string; // Optional for new posts
  title: string;
  content: string; // This will now store HTML from TipTap
  imageUrl?: string;
  status: "draft" | "published";
  createdAt?: string; // Optional for new posts
  updatedAt?: string; // Optional for new posts
  tags: string[]; // Add tags field
}

export default function WritePageClient() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string; // 'new' or existing post ID
  
  const { data: session, status } = useSession();

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [wordCount, setWordCount] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">("dark");
  
  // States for TipTap image upload progress
  const [isEditorImageUploading, setIsEditorImageUploading] = useState(false);
  const [editorUploadProgress, setEditorUploadProgress] = useState(0);

  // States for Image Cropper
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [currentCoverImageFile, setCurrentCoverImageFile] = useState<File | null>(null);

  // State for tags input
  const [currentTagInput, setCurrentTagInput] = useState<string>("");

  const titleRef = useRef<HTMLTextAreaElement>(null);
  
  // Background colors based on theme
  const bgColors = {
    light: "bg-white",
    sepia: "bg-amber-50",
    dark: "bg-gray-900"
  };
  
  const textColors = {
    light: "text-gray-800",
    sepia: "text-gray-900",
    dark: "text-gray-100"
  };

  // Auto-resize textarea for title
  useEffect(() => {
    const resizeTextarea = (textarea: HTMLTextAreaElement) => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };

    if (titleRef.current) {
      resizeTextarea(titleRef.current);
    }
  }, [post?.title]);

  // Update word count (from HTML content)
  const calculateWordCount = useCallback((htmlContent: string) => {
    // A simple way to get text from HTML for word count
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, []);

  useEffect(() => {
    if (post?.content) {
      calculateWordCount(post.content);
    }
  }, [post?.content, calculateWordCount]);

  // Check for authentication and fetch post
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      signIn();
      return; // Redirecting, no need to fetch
    }
    
    const fetchPost = async () => {
      if (id === "new") {
        setPost({
          title: "",
          content: "",
          imageUrl: "",
          status: "draft",
          tags: [],
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/writing?id=${id}`, {
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = `Failed with status ${res.status}`;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            errorMessage = errorText.slice(0, 100) || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        
        setPost({
          _id: data._id,
          title: data.title || "",
          content: data.content || "",
          imageUrl: data.imageUrl || "",
          status: data.status || "draft",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          tags: data.tags || [], // Ensure tags are loaded
        });
        
        if (data.imageUrl) {
          setImagePreview(data.imageUrl);
        }
      } catch (error: any) {
        console.error("Error loading post:", error);
        setError(error.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    } else {
      setLoading(false); // Should not happen if ID is derived from params
    }
  }, [id, status]); // Removed session from dependencies as it's handled by `status`

  // Handles cover image selection and opens cropper
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Cover image too large (max 5MB).");
        return;
      }
      setCurrentCoverImageFile(file);
      setCropImageUrl(URL.createObjectURL(file));
      setShowImageCropper(true);
    }
  };

  // Callback from ImageCropper when cropping is complete
  const handleCroppedImageUpload = useCallback(async (croppedImageUrl: string) => {
    setPost(prev => {
      if (!prev) return null;
      return { ...prev, imageUrl: croppedImageUrl };
    });
    setImagePreview(croppedImageUrl);
    setShowImageCropper(false);
    if (currentCoverImageFile) {
      URL.revokeObjectURL(URL.createObjectURL(currentCoverImageFile)); // Clean up temp URL
      setCurrentCoverImageFile(null);
    }
    toast.success("Cover image updated!");
  }, [currentCoverImageFile]);

  // Callback from ImageCropper when cancelled
  const handleCropperCancel = useCallback(() => {
    setShowImageCropper(false);
    if (currentCoverImageFile) {
      URL.revokeObjectURL(URL.createObjectURL(currentCoverImageFile)); // Clean up temp URL
      setCurrentCoverImageFile(null);
    }
  }, [currentCoverImageFile]);


  async function savePost(postToSave: PostData, targetStatus: "draft" | "published") {
    setSaving(true);
    setError(null);

    if (!postToSave.title.trim()) {
      setError("Please add a title to your story.");
      toast.error("Please add a title.");
      setSaving(false);
      titleRef.current?.focus();
      return;
    }

    // Minimum word count check on actual text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = postToSave.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);

    if (!textContent.trim() || words.length < 5) {
      setError("Your story seems too short. Please add more content.");
      toast.error("Your story is too short.");
      setSaving(false);
      return;
    }

    let url, method;
    const isNewPost = !postToSave._id || postToSave._id === "new";

    if (isNewPost) {
      url = "/api/posts"; // Your POST endpoint for new posts
      method = "POST";
    } else {
      url = `/api/posts?id=${postToSave._id}`; // Your PUT endpoint for existing posts
      method = "PUT";
    }

    const body = {
      title: postToSave.title,
      content: postToSave.content,
      imageUrl: postToSave.imageUrl,
      status: targetStatus, // Use the targetStatus for saving
      tags: postToSave.tags, // Include tags in the payload
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      let responseData;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
        try { responseData = JSON.parse(responseData); } catch (e) {}
      }
      
      if (!res.ok) {
        const errorMessage = typeof responseData === 'object' && responseData.message
          ? responseData.message
          : typeof responseData === 'object' && responseData.error
            ? responseData.error
            : typeof responseData === 'string'
              ? responseData
              : `Failed to save post: ${res.status}`;
              
        throw new Error(errorMessage);
      }

      if (isNewPost && responseData._id) {
        toast.success(`Story ${targetStatus} successfully!`);
        router.replace(`/write/${responseData._id}`); // Update URL for new post
      } else {
        toast.success(`Story ${targetStatus} successfully!`);
      }
      setPost(prev => ({ ...prev!, ...responseData, status: targetStatus })); // Update post state
      return responseData;
    } catch (error: any) {
      console.error("Save error:", error);
      setError(error.message || "Failed to save post. Please try again.");
      toast.error(error.message || "Failed to save post.");
    } finally {
      setSaving(false);
    }
  }

  const handleTagsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!post) return; // Add this line to ensure 'post' is not null

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = currentTagInput.trim().toLowerCase();
      if (newTag && !post.tags.includes(newTag)) { // Removed redundant 'post' check here
        setPost(prev => ({ ...prev!, tags: [...prev!.tags, newTag] }));
        setCurrentTagInput("");
      }
    } else if (e.key === 'Backspace' && currentTagInput === '' && post.tags.length > 0) { // Removed '?' as post is now guaranteed
      e.preventDefault();
      setPost(prev => ({ ...prev!, tags: prev!.tags.slice(0, -1) }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (post) {
      setPost(prev => ({ ...prev!, tags: prev!.tags.filter(tag => tag !== tagToRemove) }));
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen ${bgColors[theme]} ${textColors[theme]} flex items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-indigo-500 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error && !post) { // Show error if no post could be loaded at all
    return (
      <div className={`min-h-screen ${bgColors[theme]} ${textColors[theme]} p-6`}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-red-500 mb-6">{error}</p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Fallback if post is still null after loading (shouldn't happen with the current logic)
  if (!post) {
    return (
      <div className={`min-h-screen ${bgColors[theme]} ${textColors[theme]} p-6`}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Editor Not Ready</h1>
          <p className="mb-6 text-gray-400">There was an issue preparing the editor. Please try refreshing.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${bgColors[theme]} ${textColors[theme]} transition-colors duration-300`}>
      {/* Top Navigation */}
      <nav className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} px-4 py-3 flex items-center justify-between sticky top-0 z-30 ${bgColors[theme]}`}>
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
            title="Back to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {wordCount > 0 ? `${wordCount} words` : "New Story"}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <button
              onClick={() => savePost(post, "draft")}
              disabled={saving}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              } ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {saving && post.status === "draft" ? "Saving..." : "Save draft"}
            </button>
            
            <button
              onClick={() => savePost(post, "published")}
              disabled={saving}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {saving && post.status === "published" ? "Publishing..." : "Publish"}
            </button>
          </div>
          
          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'sepia' : theme === 'sepia' ? 'dark' : 'light')}
            className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
            title="Change theme"
          >
            {theme === 'light' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            )}
            {theme === 'sepia' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
            {theme === 'dark' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </nav>
      
      {/* Error message */}
      {error && (
        <div className={`${theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700'} p-3 text-sm`}>
          {error}
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col w-full p-4 max-w-4xl mx-auto">
        {/* Cover image section */}
        <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
          <label className={`block text-lg font-semibold mb-2 ${textColors[theme]}`}>
            Cover Image
          </label>
          {imagePreview ? (
            <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden group">
              <img 
                src={imagePreview} 
                alt="Cover Preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setImagePreview("");
                    setPost(prev => ({ ...prev!, imageUrl: "" }));
                    toast.success("Cover image removed.");
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-2"
                >
                  Remove
                </button>
                <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverImageChange}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className={`w-full h-48 flex items-center justify-center border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-500' : 'border-gray-400 text-gray-600'} rounded-lg cursor-pointer hover:bg-opacity-80 transition-colors`}>
              <label className="text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverImageChange}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Click to upload a cover image (max 5MB)</p>
                <p className="text-xs mt-1 text-gray-400">Recommended aspect ratio 16:9</p>
              </label>
            </div>
          )}
        </div>

        {/* Title input */}
        <div className="mb-4">
          <textarea
            ref={titleRef}
            placeholder="Title of your story..."
            className={`w-full text-4xl font-bold resize-none overflow-hidden bg-transparent focus:outline-none ${theme === 'dark' ? 'placeholder-gray-600 text-white' : 'placeholder-gray-400 text-gray-900'}`}
            value={post.title}
            onChange={(e) => {
              setPost({ ...post, title: e.target.value });
              if (titleRef.current) {
                titleRef.current.style.height = "auto";
                titleRef.current.style.height = titleRef.current.scrollHeight + "px";
              }
            }}
            rows={1}
            style={{ minHeight: '50px' }}
          />
        </div>
        
        {/* TipTap Editor for Content */}
        <div className="mb-6 flex-1">
          <TiptapEditor
            content={post.content}
            onContentChange={(html) => {
              setPost(prev => ({ ...prev!, content: html }));
              calculateWordCount(html); // Update word count as content changes
            }}
            theme={theme}
            onImageUploadStart={() => setIsEditorImageUploading(true)}
            onImageUploadComplete={() => setIsEditorImageUploading(false)}
            isImageUploading={isEditorImageUploading}
            uploadProgress={editorUploadProgress} // You might need to update this state from the TiptapEditor itself
          />
        </div>

        {/* Tags input */}
        <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
          <label className={`block text-lg font-semibold mb-2 ${textColors[theme]}`}>
            Tags
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {post.tags.map(tag => (
              <span key={tag} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 -mr-0.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-white opacity-75 hover:opacity-100"
                  aria-label={`Remove ${tag}`}
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </span>
            ))}
            <input
              type="text"
              value={currentTagInput}
              onChange={(e) => setCurrentTagInput(e.target.value)}
              onKeyDown={handleTagsKeyDown}
              placeholder="Add tags (e.g., fiction, adventure, short story)"
              className={`flex-grow px-3 py-2 rounded-lg ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-black placeholder-gray-400'
              } border focus:outline-none focus:ring-2 ${
                theme === 'dark' ? 'focus:ring-indigo-600' : 'focus:ring-blue-500'
              }`}
            />
          </div>
          <p className="text-xs text-gray-400">Press Enter or comma to add a tag.</p>
        </div>
      </div>
      
      {/* Image cropper modal */}
      {showImageCropper && cropImageUrl && (
        <ImageCropper
          imageUrl={cropImageUrl}
          onCropComplete={handleCroppedImageUpload}
          onCancel={handleCropperCancel}
          aspectRatio={16 / 9} // Enforce 16:9 aspect ratio for cover image
        />
      )}
      
      {/* Footer */}
      <footer className={`py-4 ${theme === 'dark' ? 'border-t border-gray-800 text-gray-400' : 'border-t border-gray-200 text-gray-500'}`}>
        <div className="max-w-5xl mx-auto px-4 text-sm text-center">
          <p>Last updated: {post.updatedAt ? new Date(post.updatedAt).toLocaleString() : "N/A"}</p>
        </div>
      </footer>
    </div>
  );
}