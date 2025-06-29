// src/app/write/[id]/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from 'react-hot-toast';
import dynamic from "next/dynamic";
import ImageCropper from "@/components/ImageCropper";
import Link from "next/link";

// Dynamically import TiptapEditor
const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[400px] items-center justify-center bg-[var(--background-secondary)] rounded-xl shadow-lg animate-pulse">
      <div className="flex flex-col items-center text-[var(--text-secondary)]">
        <svg className="animate-spin h-12 w-12 text-[var(--accent-color)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="mt-4 text-xl font-semibold">Loading your creative canvas...</span>
      </div>
    </div>
  ),
});

interface PostData {
  _id?: string;
  title: string;
  content: string;
  imageUrl?: string;
  status: "draft" | "published";
  createdAt?: string;
  updatedAt?: string;
  tags: string[];
}

export default function WritePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: session, status: authStatus } = useSession();

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCoverImageUrl, setCurrentCoverImageUrl] = useState<string>("");
  const [wordCount, setWordCount] = useState(0);

  const [globalTheme, setGlobalTheme] = useState<'light' | 'dark'>('dark');

  // State for Cover Image Cropper
  const [showCoverImageCropper, setShowCoverImageCropper] = useState(false);
  const [coverCropImageUrl, setCoverCropImageUrl] = useState("");
  const [currentCoverImageFile, setCurrentCoverImageFile] = useState<File | null>(null);

  // State for Content Image Cropper
  const [showContentImageCropper, setShowContentImageCropper] = useState(false);
  const [contentCropImageUrl, setContentCropImageUrl] = useState("");
  const [currentContentImageFile, setCurrentContentImageFile] = useState<File | null>(null);
  const [tiptapInsertImageCallback, setTiptapInsertImageCallback] = useState<((url: string) => void) | null>(null);

  const [currentTagInput, setCurrentTagInput] = useState<string>("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null); // New ref for content image upload

  // Effect to determine the global theme
  useEffect(() => {
    const updateGlobalTheme = () => {
      setGlobalTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };
    updateGlobalTheme();
    const observer = new MutationObserver(updateGlobalTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Update word count (from HTML content)
  const parseContentForWordCount = useCallback((htmlContent: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, []);

  useEffect(() => {
    if (post?.content) {
      parseContentForWordCount(post.content);
    }
  }, [post?.content, parseContentForWordCount]);

  // Check for authentication and fetch post
  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }
    if (authStatus === "unauthenticated") {
      signIn();
      return;
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
        setTimeout(() => {
          titleInputRef.current?.focus();
        }, 100);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/writing?id=${id}`, {
          credentials: "include"
        });

        if (!res.ok) {
          const errorText = await res.text();
          toast.error(`Error ${res.status}: ${errorText || "Failed to load post"}`);
          setError(`Error ${res.status}: ${errorText || "Failed to load post"}`);
          setPost(null);
          return;
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
          tags: data.tags || [],
        });
        if (data.imageUrl) {
          setCurrentCoverImageUrl(data.imageUrl);
        }
      } catch (error: any) {
        console.error("Error loading post:", error);
        setError(error.message || "Failed to load post");
        toast.error(error.message || "Failed to load post");
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, authStatus]);

  // --- Image Handling Functions (Unified and Reusable) ---

  // UPDATED: Now accepts a File object directly
  const uploadImageToCloud = useCallback(async (imageFile: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", imageFile); // Use the File object directly

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.message || "Image upload failed");
      }

      const uploadData = await uploadRes.json();
      return uploadData.url; // Assuming the API returns { url: "..." }
    } catch (error) {
      console.error("Error uploading image to cloud:", error);
      toast.error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, []);


  const processImageFileForCropper = useCallback((file: File, isCover: boolean, insertCallback?: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image too large (max 5MB).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (isCover) {
      setCurrentCoverImageFile(file);
      setCoverCropImageUrl(objectUrl);
      setShowCoverImageCropper(true);
    } else {
      setCurrentContentImageFile(file);
      setContentCropImageUrl(objectUrl);
      setTiptapInsertImageCallback(() => insertCallback); // Store callback to use after crop & upload
      setShowContentImageCropper(true);
    }
  }, []);

  const handleCoverFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFileForCropper(file, true);
      e.target.value = ''; // Clear input for next upload
    }
  };

  // This is the new callback from TiptapEditor for content images
  const handleContentImageUploadRequest = useCallback((file: File, insertCallback: (url: string) => void) => {
    processImageFileForCropper(file, false, insertCallback);
  }, [processImageFileForCropper]);


  // UPDATED: Now accepts File and Data URL
  const handleCroppedImageUpload = useCallback(async (file: File, dataUrl: string, isCoverImage: boolean) => {
    setSaving(true); // Indicate saving while image is uploaded
    try {
      const uploadedUrl = await uploadImageToCloud(file); // Use the 'file' object here

      if (isCoverImage) {
        setPost(prev => ({ ...prev!, imageUrl: uploadedUrl }));
        setCurrentCoverImageUrl(uploadedUrl);
        setShowCoverImageCropper(false);
        toast.success("Cover image updated and uploaded!");
      } else {
        // Use the stored Tiptap callback to insert the image into the editor
        if (tiptapInsertImageCallback) {
          tiptapInsertImageCallback(uploadedUrl);
        }
        setShowContentImageCropper(false);
        toast.success("Image inserted into story!");
      }
    } catch (error) {
      console.error("Failed to process cropped image:", error);
      toast.error("Failed to upload cropped image.");
    } finally {
      setSaving(false);
      // Clean up file references and revoke Object URLs created for cropper
      if (isCoverImage && coverCropImageUrl) URL.revokeObjectURL(coverCropImageUrl);
      else if (!isCoverImage && contentCropImageUrl) URL.revokeObjectURL(contentCropImageUrl);

      if (isCoverImage) setCurrentCoverImageFile(null);
      else setCurrentContentImageFile(null);
      setTiptapInsertImageCallback(null);
    }
  }, [tiptapInsertImageCallback, uploadImageToCloud, coverCropImageUrl, contentCropImageUrl]); // Added image URLs to dependencies for revokeObjectURL

  const handleCropperCancel = useCallback((isCoverImage: boolean) => {
    if (isCoverImage) {
      setShowCoverImageCropper(false);
      if (coverCropImageUrl) URL.revokeObjectURL(coverCropImageUrl); // Revoke the object URL
      setCurrentCoverImageFile(null);
    } else {
      setShowContentImageCropper(false);
      if (contentCropImageUrl) URL.revokeObjectURL(contentCropImageUrl); // Revoke the object URL
      setCurrentContentImageFile(null);
      setTiptapInsertImageCallback(null); // Clear callback
    }
  }, [coverCropImageUrl, contentCropImageUrl]); // Dependencies for revoking URLs

  // --- End Image Handling Functions ---


  async function savePost(postToSave: PostData, targetStatus: "draft" | "published") {
    setSaving(true);
    setError(null);

    if (!postToSave.title.trim()) {
      setError("Please add a title to your story.");
      toast.error("Please add a title.");
      setSaving(false);
      return;
    }

    let url, method;
    const isNewPost = !postToSave._id || postToSave._id === "new";

    if (isNewPost) {
      url = "/api/writing";
      method = "POST";
    } else {
      url = `/api/writing?id=${postToSave._id}`;
      method = "PUT";
    }

    const body = {
      title: postToSave.title,
      content: postToSave.content,
      imageUrl: postToSave.imageUrl,
      status: targetStatus,
      tags: postToSave.tags,
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
        const textResponse = await res.text();
        try {
          responseData = JSON.parse(textResponse);
        } catch (e) {
          responseData = { message: textResponse || `Failed with status: ${res.status}` };
        }
      }

      if (!res.ok) {
        const errorMessage = typeof responseData === 'object' && responseData !== null && responseData.message
          ? responseData.message
          : typeof responseData === 'object' && responseData !== null && responseData.error
            ? responseData.error
            : typeof responseData === 'string'
              ? responseData
              : `Failed to save post with status: ${res.status}.`;

        throw new Error(errorMessage);
      }

      if (isNewPost && responseData.id) {
        toast.success(`Story ${targetStatus} successfully!`);
        router.replace(`/write/${responseData.id}`);
      } else {
        toast.success(`Story ${targetStatus} successfully!`);
      }
      setPost(prev => ({
        ...prev!,
        ...responseData,
        status: targetStatus,
        title: postToSave.title,
        updatedAt: new Date().toISOString(),
      }));
      setCurrentCoverImageUrl(postToSave.imageUrl || "");
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
    if (!post) return;

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = currentTagInput.trim().toLowerCase();
      if (newTag && !post.tags.includes(newTag)) {
        if (post.tags.length < 5) { // Max 5 tags
          setPost(prev => ({ ...prev!, tags: [...prev!.tags, newTag] }));
          setCurrentTagInput("");
        } else {
          toast.error("You can add a maximum of 5 tags.");
        }
      }
    } else if (e.key === 'Backspace' && currentTagInput === '' && post.tags.length > 0) {
      e.preventDefault();
      setPost(prev => ({ ...prev!, tags: prev!.tags.slice(0, -1) }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (post) {
      setPost(prev => ({ ...prev!, tags: prev!.tags.filter(tag => tag !== tagToRemove) }));
    }
  };

  // --- Render Loading/Error States ---
  if (authStatus === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-[var(--background-primary)] text-[var(--text-primary)] transition-colors duration-300`}>
        <div className="flex flex-col items-center">
          <div className="animate-pulse h-16 w-16 bg-[var(--accent-color)] rounded-full mb-4"></div>
          <div className="h-6 w-48 bg-[var(--background-secondary)] rounded-full"></div>
          <p className="mt-4 text-lg font-medium">Loading your creative canvas...</p>
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center bg-[var(--background-primary)] text-[var(--text-primary)] transition-colors duration-300`}>
        <div className={`max-w-md mx-auto text-center p-10 rounded-2xl shadow-2xl bg-[var(--background-secondary)] border-[var(--border-color)] border transition-colors duration-500`}>
          <h1 className="text-4xl font-extrabold mb-4 text-red-500">Oh No!</h1>
          <p className="text-lg mb-6 text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-[var(--accent-color)] text-white rounded-xl shadow-lg hover:bg-[var(--hover-bg)] transition-all duration-300 transform hover:scale-105"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center bg-[var(--background-primary)] text-[var(--text-primary)] transition-colors duration-300`}>
        <div className={`max-w-md mx-auto text-center p-10 rounded-2xl shadow-2xl bg-[var(--background-secondary)] border-[var(--border-color)] border transition-colors duration-500`}>
          <h1 className="text-4xl font-extrabold mb-4 text-[var(--text-primary)]">Editor Not Ready</h1>
          <p className="text-lg mb-6 text-[var(--text-secondary)]">There was an issue preparing the editor. Please try refreshing.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[var(--accent-color)] text-white rounded-xl shadow-lg hover:bg-[var(--hover-bg)] transition-all duration-300 transform hover:scale-105"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-[var(--background-primary)] text-[var(--text-primary)] transition-colors duration-300 font-sans`}>
      {/* Top Navigation - Adjusted for better responsiveness */}
      <nav className={`px-4 md:px-8 py-4 flex flex-wrap items-center justify-between sticky top-0 z-30 bg-[var(--background-secondary)] shadow-sm border-b border-[var(--border-color)] transition-colors duration-300`}>
        {/* Left section: Back button & Word Count */}
        <div className="flex items-center space-x-2 md:space-x-4 mb-2 sm:mb-0 w-full sm:w-auto justify-between sm:justify-start">
          <Link
            href="/dashboard"
            className={`p-2 rounded-full transition-colors duration-200 bg-[var(--background-tertiary)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] flex items-center justify-center group`}
            title="Back to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className={`text-sm md:text-base font-medium text-[var(--text-primary)] opacity-80`}>
            {wordCount > 0 ? `${wordCount} words` : "Start your story"}
          </div>
        </div>

        {/* Right section: Save/Publish buttons */}
        <div className="flex items-center space-x-2 md:space-x-4 w-full sm:w-auto justify-end">
          <div className="flex flex-1 sm:flex-none space-x-2 md:space-x-3 justify-end"> {/* Use flex-1 on smaller screens to take available width */}
            <button
              onClick={() => savePost(post, "draft")}
              disabled={saving}
              className={`flex-1 sm:flex-auto px-3 py-2 md:px-6 md:py-2.5 rounded-full text-sm md:text-md font-semibold text-center transition-all duration-300 shadow-md
                bg-[var(--background-tertiary)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]
                ${saving ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}`}
            >
              {saving && post.status === "draft" ? "Saving..." : "Save Draft"}
            </button>

            <button
              onClick={() => savePost(post, "published")}
              disabled={saving}
              className={`flex-1 sm:flex-auto px-3 py-2 md:px-6 md:py-2.5 rounded-full text-sm md:text-md font-semibold text-center transition-all duration-300 shadow-lg
                bg-[var(--accent-color)] text-white hover:bg-[var(--hover-bg)]
                ${saving ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}`}
            >
              {saving && post.status === "published" ? "Publishing..." : "Publish Story"}
            </button>
          </div>
        </div>
      </nav>

      {/* Error message */}
      {error && (
        <div className={`bg-red-500/20 text-red-200 p-3 text-sm flex items-center justify-center font-semibold`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Main unified writing area - The true "canvas" */}
      {/* Adjusted padding for smaller screens */}
      <main className="flex-1 flex justify-center py-6 sm:py-8 px-2 sm:px-4"> {/* Adjusted px for small screens */}
        <section className={`relative w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl
            p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl shadow-lg
            bg-[var(--background-secondary)] border border-[var(--border-color)] transition-all duration-300
            hover:border-[var(--accent-color)] hover:shadow-2xl focus-within:border-[var(--accent-color)] focus-within:shadow-2xl
            transform hover:scale-[1.005] transition-transform duration-300 ease-out
          `}>

          {/* Cover Image Button & Info - Integrated and subtle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={coverFileInputRef}
                onChange={handleCoverFileInputChange}
                id="coverImageUpload"
              />
              <button
                onClick={() => coverFileInputRef.current?.click()}
                className={`flex-shrink-0 inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 shadow-md bg-[var(--accent-color)] text-white hover:bg-[var(--hover-bg)] whitespace-nowrap`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {currentCoverImageUrl ? "Change Cover" : "Add Cover Photo"}
              </button>
              {currentCoverImageUrl && (
                  <button
                      onClick={() => {
                          setCurrentCoverImageUrl("");
                          setPost(prev => ({ ...prev!, imageUrl: "" }));
                          toast.success("Cover image removed.");
                      }}
                      className={`flex-shrink-0 inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold transition-colors duration-200 shadow-md bg-[var(--background-tertiary)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] whitespace-nowrap`}
                  >
                      Remove
                  </button>
              )}
            </div>
            <p className={`text-xs sm:text-sm text-[var(--text-secondary)] opacity-60 text-right w-full sm:w-auto`}>
              {currentCoverImageUrl ? "Cover image is set." : "No cover image."} (Recommended: 16:9 ratio, max 5MB)
            </p>
          </div>

          {/* Title Input */}
          <input
            ref={titleInputRef}
            type="text"
            id="storyTitle"
            value={post.title}
            onChange={(e) => setPost(prev => ({ ...prev!, title: e.target.value }))}
            placeholder="Title"
            className={`w-full text-3xl md:text-4xl lg:text-5xl font-extrabold pb-3 mb-6 md:mb-8
            border-b-2 border-transparent focus:border-[var(--accent-color)]
            text-[var(--text-primary)] placeholder-[var(--text-secondary)]
            bg-transparent outline-none transition-colors duration-200`}
            style={{ fontFamily: 'Georgia, serif' }}
          />

          {/* TipTap Editor for Content */}
          <div className={`
            prose prose-lg
            ${globalTheme === 'dark' ? 'prose-invert' : ''}
            max-w-none overflow-hidden pb-6 md:pb-8
            text-[var(--text-primary)]
            relative
            border border-[var(--border-color)] rounded-xl
            hover:border-[var(--accent-color)]
            focus-within:border-[var(--accent-color)] focus-within:ring-2 focus-within:ring-[var(--accent-color)] focus-within:ring-opacity-50
            transition-all duration-300 ease-in-out
            p-4 sm:p-6
          `.replace(/\s+/g, ' ').trim()}>
            <TiptapEditor
              content={post.content}
              onContentChange={(html) => {
                setPost(prev => ({ ...prev!, content: html }));
                parseContentForWordCount(html);
              }}
              onImageUpload={handleContentImageUploadRequest} // Pass the new handler
              theme={globalTheme}
            />
          </div>

          {/* Tags input */}
          <div className="mt-6 md:mt-8">
            <label className={`block text-xl font-bold mb-3 text-[var(--text-primary)] opacity-80`}>
              Tags
              <p className={`text-sm font-normal mt-1 text-[var(--text-secondary)] opacity-80`}>
                Categorize your story with relevant keywords (max 5 tags).
              </p>
            </label>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 w-full">
              {post.tags.map(tag => (
                <span key={tag} className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base font-medium transition-colors duration-200 shadow-sm
                  bg-[var(--accent-color-light)] text-[var(--accent-color-dark)] hover:bg-[var(--accent-color-dark)] hover:text-[var(--accent-color-light)]
                `}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full bg-current opacity-30 hover:opacity-50 transition-opacity"
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
                placeholder="Add a new tag..."
                className={`flex-grow min-w-[120px] px-3 py-2 sm:px-4 sm:py-3 rounded-lg
                  bg-[var(--background-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]
                border focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition-all duration-200 text-sm sm:text-base`}
              />
            </div>
            <p className={`text-xs sm:text-sm mt-1 text-[var(--text-secondary)] opacity-80`}>
              Press Enter or comma to add a tag.
            </p>
          </div>
        </section>
      </main>

      {/* Cover Image Cropper */}
      {showCoverImageCropper && coverCropImageUrl && (
        <ImageCropper
          imageUrl={coverCropImageUrl}
          onCroppedImage={(croppedFile, dataUrl) => handleCroppedImageUpload(croppedFile, dataUrl, true)}
          onCancel={() => handleCropperCancel(true)}
          aspectRatio={16 / 9}
          theme={globalTheme}
        />
      )}

      {/* Content Image Cropper (New) */}
      {showContentImageCropper && contentCropImageUrl && (
        <ImageCropper
          imageUrl={contentCropImageUrl}
          onCroppedImage={(croppedFile, dataUrl) => handleCroppedImageUpload(croppedFile, dataUrl, false)}
          onCancel={() => handleCropperCancel(false)}
          aspectRatio={4 / 3} // Common aspect ratio for content images, adjust as needed
          theme={globalTheme}
        />
      )}
      {/* Footer */}
      <footer className={`py-4 sm:py-6 border-[var(--border-color)] border-t text-[var(--text-secondary)] opacity-70 shadow-inner mt-auto`}>
        <div className="max-w-4xl mx-auto px-4 text-sm text-center">
          <p>Last updated: {post.updatedAt ? new Date(post.updatedAt).toLocaleString() : "N/A"}</p>
          <p className="mt-1">© {new Date().getFullYear()} Talesy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}