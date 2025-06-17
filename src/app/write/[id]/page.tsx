"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from 'react-hot-toast';
import ImageCropper from "@/components/ImageCropper";

interface PostData {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

export default function WritePageClient() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const { data: session, status } = useSession();

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [wordCount, setWordCount] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">("dark");
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Add state variables for image cropper
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState("");
  
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
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

  // Auto-resize textarea
  useEffect(() => {
    const resizeTextarea = (textarea: HTMLTextAreaElement) => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };

    if (titleRef.current && post?.title) {
      resizeTextarea(titleRef.current);
    }
  }, [post?.title]);

  // Update word count
  useEffect(() => {
    if (post?.content) {
      const words = post.content.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  }, [post?.content]);

  // Check for authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    }
  }, [status]);

  // Handle post loading
  useEffect(() => {
    // Wait for authentication status to resolve
    if (status === "loading") return;
    
    // If not authenticated and not loading, wait for redirect
    if (status === "unauthenticated") return;
    
    // Special handling for "new" route
    if (id === "new") {
      setPost({
        id: "new",
        title: "",
        content: "",
        imageUrl: "",
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/writing?id=${id}`, {
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || `Failed with status ${res.status}`);
          } catch (e) {
            throw new Error(`Failed with status ${res.status}: ${errorText.slice(0, 100)}`);
          }
        }

        const data = await res.json();
        
        setPost({
          id: data._id,
          title: data.title || "",
          content: data.content || "",
          imageUrl: data.imageUrl || "",
          status: data.status || "draft",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
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

    // Only fetch if we're editing an existing post
    if (id && id !== "new") {
      fetchPost();
    } else {
      // Make sure we stop loading state even if ID is invalid
      setLoading(false);
    }
  }, [id, status, session]);

  const handleImageUrlChange = (url: string) => {
    setPost(prev => {
      if (!prev) return null;
      return { ...prev, imageUrl: url };
    });
    
    if (url.trim()) {
      setImagePreview(url);
    } else {
      setImagePreview("");
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!file) {
      throw new Error("No file selected");
    }
  
    // File validation
    if (!file.type.startsWith('image/')) {
      throw new Error("Please select an image file");
    }
  
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File is too large (max 5MB)");
    }
  
    setImageUploading(true);
    setUploadProgress(10);
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
  
      setUploadProgress(50);
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Upload failed");
      }
  
      setUploadProgress(80);
      const data = await res.json();
      
      // Accept either url or fileUrl from the response
      const imageUrl = data.url || data.fileUrl;
      
      if (!imageUrl) {
        throw new Error("No image URL returned from server");
      }
  
      setUploadProgress(100);
      handleImageUrlChange(imageUrl);
      return imageUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setImageUploading(false);
      setUploadProgress(0);
      setShowImageUploader(false);
    }
  };
  
  // Helper to format markdown
  const formatContent = (content: string, type: 'bold' | 'italic' | 'h1' | 'h2' | 'h3' | 'list') => {
    if (!contentRef.current) return;
  
    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    let cursorOffset = 0;
    
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        cursorOffset = 2;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        cursorOffset = 3;
        break;
      case 'h3':
        formattedText = `### ${selectedText}`;
        cursorOffset = 4;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        cursorOffset = 2;
        break;
    }
    
    const newContent = 
      content.substring(0, start) + 
      formattedText + 
      content.substring(end);
    
    setPost(prev => {
      if (!prev) return null;
      return { ...prev, content: newContent };
    });
    
    // Set cursor position after update
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        if (selectedText.length > 0) {
          contentRef.current.setSelectionRange(
            start + cursorOffset, 
            end + cursorOffset
          );
        } else {
          const newPosition = start + formattedText.length;
          contentRef.current.setSelectionRange(newPosition, newPosition);
        }
      }
    }, 0);
  };

  async function savePost(post: PostData) {
    let url, method;
    
    if (post.id === "new") {
      url = "/api/writing";
      method = "POST";
    } else {
      url = `/api/writing?id=${post.id}`;
      method = "PUT";
    }

    const body = {
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      status: post.status,
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
      
      // Try to parse response, but handle non-JSON responses
      const contentType = res.headers.get("content-type");
      let responseData;
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
        // Try to parse as JSON even if content-type is not set correctly
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          // Keep as text if it's not valid JSON
        }
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

      return responseData;
    } catch (error) {
      throw error;
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen ${bgColors[theme]} ${textColors[theme]} flex items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-500 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`min-h-screen ${bgColors[theme]} ${textColors[theme]} p-6`}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-red-500 mb-6">{error}</p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (!post && id !== "new") {
    return (
      <div className={`min-h-screen ${bgColors[theme]} ${textColors[theme]} p-6`}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Post not found</h1>
          <p className="mb-6 text-gray-400">The post you are looking for may have been deleted or doesn't exist.</p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // For "new" posts, initialize empty post if not already done
  if (!post && id === "new") {
    setPost({
      id: "new",
      title: "",
      content: "",
      imageUrl: "",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return (
      <div className={`min-h-screen ${bgColors[theme]} ${textColors[theme]} flex items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-500 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // Safety check - should never happen but prevents runtime errors
  if (!post) {
    return (
      <div className={`min-h-screen ${bgColors[theme]} ${textColors[theme]} p-6`}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-6 text-gray-400">Unable to load the editor. Please try again.</p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${bgColors[theme]} ${textColors[theme]} transition-colors duration-300`}>
      {/* Top Navigation */}
      <nav className={`border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} px-4 py-3 flex items-center justify-between sticky top-0 z-30 ${bgColors[theme]} ${textColors[theme]}`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/dashboard")}
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {wordCount > 0 ? `${wordCount} words` : "Draft"}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                if (!post.title.trim()) {
                  setError("Please add a title to your story.");
                  titleRef.current?.focus();
                  return;
                }

                if (!post.content.trim() || wordCount < 5) {
                  setError("Your story seems too short. Please add more content.");
                  contentRef.current?.focus();
                  return;
                }

                setSaving(true);
                setError(null);
                
                post.status = "draft";
                
                try {
                  const result = await savePost(post);
                  
                  if (post.id === "new" && result.id) {
                    toast.success("Draft saved successfully!");
                    router.replace(`/write/${result.id}`);
                  } else {
                    toast.success("Draft updated successfully!");
                  }
                } catch (error: any) {
                  console.error("Save error:", error);
                  setError("Failed to save draft. Please try again.");
                  toast.error("Failed to save draft");
                } finally {
                  setSaving(false);
                }
              }}
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
              onClick={async () => {
                if (!post.title.trim()) {
                  setError("Please add a title to your story.");
                  titleRef.current?.focus();
                  return;
                }

                if (!post.content.trim() || wordCount < 5) {
                  setError("Your story seems too short. Please add more content.");
                  contentRef.current?.focus();
                  return;
                }

                setSaving(true);
                setError(null);
                
                post.status = "published";
                
                try {
                  const result = await savePost(post);
                  
                  if (post.id === "new" && result.id) {
                    toast.success("Your story has been published successfully!");
                    router.push("/dashboard");
                  } else {
                    toast.success("Your story has been updated and published!");
                    router.push("/dashboard");
                  }
                } catch (error: any) {
                  console.error("Save error:", error);
                  setError("Failed to publish. Please try again.");
                  toast.error("Failed to publish");
                } finally {
                  setSaving(false);
                }
              }}
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
      
      {/* Formatting toolbar */}
      <div className={`sticky top-16 z-20 p-2 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} ${bgColors[theme]}`}>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => formatContent(post.content, 'bold')}
            title="Bold"
            className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={() => formatContent(post.content, 'italic')}
            title="Italic"
            className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <span className="italic">I</span>
          </button>
          <button
            onClick={() => formatContent(post.content, 'h1')}
            title="Heading 1"
            className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <span className="font-bold">H1</span>
          </button>
          <button
            onClick={() => formatContent(post.content, 'h2')}
            title="Heading 2"
            className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <span className="font-bold">H2</span>
          </button>
          <button
            onClick={() => formatContent(post.content, 'h3')}
            title="Heading 3"
            className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <span className="font-bold">H3</span>
          </button>
          <button
            onClick={() => formatContent(post.content, 'list')}
            title="Bulleted List"
            className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <span>•</span>
          </button>
          <button
            onClick={() => setShowImageUploader(true)}
            title="Insert Image"
            className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <span>🖼️</span>
          </button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col w-full">
        {/* Cover image preview */}
        {imagePreview && (
          <div className="relative w-full h-64 overflow-hidden">
            <img 
              src={imagePreview} 
              alt="Cover" 
              className="w-full h-full object-cover"
              onError={() => {
                setImagePreview("");
                setError("Invalid image URL. Please check the URL and try again.");
              }}
            />
            <button
              onClick={() => {
                setImagePreview("");
                setPost(prev => {
                  if (!prev) return null;
                  return { ...prev, imageUrl: "" };
                });
              }}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
              title="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Writing area */}
        <div className="flex-1 px-4 py-4">
          {/* Title input */}
          <textarea
            ref={titleRef}
            placeholder="Title"
            className={`w-full text-4xl font-bold resize-none overflow-hidden mb-4 bg-transparent focus:outline-none ${theme === 'dark' ? 'placeholder-gray-600' : 'placeholder-gray-300'}`}
            value={post.title}
            onChange={(e) => {
              setPost({ ...post, title: e.target.value });
              // Auto-resize
              if (titleRef.current) {
                titleRef.current.style.height = "auto";
                titleRef.current.style.height = titleRef.current.scrollHeight + "px";
              }
            }}
            rows={1}
            style={{ minHeight: '50px' }}
          />
          
          {/* Content input */}
          <textarea
            ref={contentRef}
            placeholder="Tell your story..."
            className={`w-full text-lg resize-none bg-transparent focus:outline-none ${theme === 'dark' ? 'placeholder-gray-600' : 'placeholder-gray-300'} font-serif`}
            value={post.content}
            onChange={(e) => setPost({ ...post, content: e.target.value })}
            style={{ minHeight: '50vh' }}
          />
          
          {/* Image URL input */}
          <div className="mt-8 mb-4">
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Cover Image URL (optional)
            </label>
            <input
              type="text"
              value={post.imageUrl || ''}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={`w-full px-3 py-2 rounded-lg ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-black placeholder-gray-400'
              } border focus:outline-none focus:ring-2 ${
                theme === 'dark' ? 'focus:ring-blue-600' : 'focus:ring-blue-500'
              }`}
            />
          </div>
          
          <div className="mt-4 flex items-center">
            <button
              onClick={() => setShowImageUploader(true)}
              className={`px-4 py-2 rounded-lg ${
                theme === 'dark'
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } transition-colors`}
            >
              Upload Cover Image
            </button>
          </div>
        </div>
      </div>
      
      {/* Image uploader modal */}
      {showImageUploader && (
        <div className={`fixed inset-0 flex items-center justify-center z-40 bg-black/70 ${textColors[theme]}`}>
          <div className={`${bgColors[theme]} p-6 rounded-lg shadow-xl max-w-md w-full`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Upload Image</h3>
              <button 
                onClick={() => setShowImageUploader(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Create a temporary URL for cropping
                    const tempUrl = URL.createObjectURL(file);
                    setCropImageUrl(tempUrl);
                    setShowImageUploader(false);
                    setShowImageCropper(true);
                  }
                }}
                className={`block w-full text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                } file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 ${
                  theme === 'dark' 
                    ? 'file:bg-indigo-600 file:text-white hover:file:bg-indigo-700' 
                    : 'file:bg-blue-600 file:text-white hover:file:bg-blue-700'
                } file:cursor-pointer`}
              />
              
              {imageUploading && (
                <div className="mt-4">
                  <div className="h-2 w-full bg-gray-300 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-1 text-center">Uploading: {uploadProgress}%</p>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-300 pt-4">
              <div className="flex justify-between items-center">
                <p className="text-xs">Max file size: 5MB</p>
                <button
                  onClick={() => setShowImageUploader(false)}
                  className={`px-4 py-2 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image cropper modal */}
      {showImageCropper && cropImageUrl && (
        <ImageCropper
          imageUrl={cropImageUrl}
          onCropComplete={(croppedImageUrl) => {
            // Update image in post state
            handleImageUrlChange(croppedImageUrl);
            setShowImageCropper(false);
            // Clean up the temporary URL
            URL.revokeObjectURL(cropImageUrl);
          }}
          onCancel={() => {
            setShowImageCropper(false);
            // Clean up the temporary URL
            URL.revokeObjectURL(cropImageUrl);
          }}
        />
      )}
      
      {/* Footer */}
      <footer className={`py-4 ${theme === 'dark' ? 'border-t border-gray-800 text-gray-400' : 'border-t border-gray-200 text-gray-500'}`}>
        <div className="max-w-5xl mx-auto px-4 text-sm text-center">
          <p>Last updated: {new Date(post.updatedAt).toLocaleString()}</p>
        </div>
      </footer>
    </div>
  );
}