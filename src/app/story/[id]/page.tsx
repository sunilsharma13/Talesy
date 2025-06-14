"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { storage } from "@/lib/firebase";
import { deleteObject, ref } from "firebase/storage";
import StoryCard from "@/components/StoryCard";
import CommentSection from "@/components/CommentSection";
import { toast } from "react-hot-toast";

interface Story {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  status: "draft" | "published";
  createdAt: string;
  likes?: number;
  comments?: number;
  userId: string;
}

export default function StoryDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams(); // Use this hook instead of prop destructuring
  const openComments = searchParams?.get("openComments") === "true";

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(openComments);

  // Use the params from the useParams hook
  const storyId = params.id as string;

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/posts/${storyId}`);
        if (!res.ok) throw new Error(`Failed to fetch story: ${res.statusText}`);
        const data = await res.json();
        setStory(data);
      } catch (error) {
        console.error("Error fetching story:", error);
        toast.error("Failed to load story.");
      } finally {
        setLoading(false);
      }
    };

    if (storyId) fetchStory();
  }, [storyId]);

  const toggleComments = () => {
    setShowComments((prev) => !prev);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getExcerpt = (content: string, maxWords: number = 30): string => {
    if (!content) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    const words = plainText.trim().split(/\s+/);
    return words.length <= maxWords ? plainText : words.slice(0, maxWords).join(" ") + "…";
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;

    try {
      setDeleteLoading(id);
      console.log(`Deleting story with ID: ${id}`);

      // Delete image
      if (imageUrl) {
        try {
          if (imageUrl.startsWith("/uploads/")) {
            const imgRes = await fetch("/api/upload/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filePath: imageUrl }),
            });
            console.log("Image deletion result:", imgRes.ok ? "Success" : "Failed");
          } else if (imageUrl.includes("firebase")) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            console.log("Firebase image deleted");
          }
        } catch (imageError) {
          console.error("Image delete error:", imageError);
        }
      }

      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        console.error("Error parsing response:", e);
      }

      if (!res.ok) {
        throw new Error((data as any).error || (data as any).details || "Failed to delete post");
      }

      toast.success("Story deleted successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    if (likeLoading) return;
    setLikeLoading(id);
    
    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Failed to like story: ${res.statusText}`);
      }

      const data = await res.json();
      
      // Update the story's like count based on server response
      setStory(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          likes: data.liked ? (prev.likes || 0) + 1 : Math.max((prev.likes || 0) - 1, 0)
        };
      });
      
      if (data.liked) {
        toast.success("Story liked!");
      } else {
        toast.success("Like removed!");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to update like status.");
    } finally {
      setLikeLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-700 rounded w-3/4 mb-6"></div>
            <div className="h-64 bg-gray-800 rounded-lg mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-900 py-10 px-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Story Not Found</h2>
          <p className="text-gray-400 mb-6">The story you're looking for doesn't seem to exist.</p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-10 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => router.push("/dashboard")} 
            className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-white">{story.title}</h1>
        </div>

        <StoryCard
          _id={story._id}
          title={story.title}
          content={story.content}
          imageUrl={story.imageUrl}
          userId={story.userId}
          createdAt={story.createdAt}
          likes={story.likes}
          comments={story.comments}
          status={story.status}
          deleteLoading={deleteLoading === story._id}
          likeLoading={likeLoading === story._id}
          onDelete={(id, imgUrl) => handleDelete(id, imgUrl!)}
          onLike={handleLike}
          onComment={toggleComments}
          formatDate={formatDate}
          getExcerpt={getExcerpt}
        />

        <div className="mt-6">
          <button
            onClick={toggleComments}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d={showComments 
                  ? "M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" 
                  : "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                } 
                clipRule="evenodd" 
              />
            </svg>
            {showComments ? "Hide Comments" : "Show Comments"}
          </button>
        </div>

        {showComments && <CommentSection postId={story._id} />}
      </div>
    </div>
  );
}