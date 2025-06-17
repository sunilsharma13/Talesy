"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { storage } from "@/lib/firebase";
import { deleteObject, ref } from "firebase/storage";
import Image from "next/image";
import CommentSection from "@/components/CommentSection";
import { toast } from "react-hot-toast";
import Link from "next/link";

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
  user?: {
    name: string;
    avatar?: string;
  };
}

interface User {
  _id: string;
  name: string;
  avatar?: string;
  isFollowing?: boolean;
  followers?: number;
  following?: number;
  bio?: string;
}

export default function StoryDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const openComments = searchParams?.get("openComments") === "true";

  const [story, setStory] = useState<Story | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [showComments, setShowComments] = useState(openComments);

  const storyId = params.id as string;

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/posts/${storyId}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch story: ${res.statusText}`);
        }
        
        const data = await res.json();
        setStory(data);

        // Fetch author info
        if (data.userId) {
          const authorRes = await fetch(`/api/users/${data.userId}`);
          if (authorRes.ok) {
            const authorData = await authorRes.json();
            setAuthor(authorData);

            // Check if current user is following the author
            if (session?.user?.id && session.user.id !== data.userId) {
              const followRes = await fetch(`/api/users/${data.userId}/follow`);
              if (followRes.ok) {
                const followData = await followRes.json();
                setAuthor(prev => {
                  if (!prev) return null;
                  return {...prev, isFollowing: followData.following};
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching story:", error);
        toast.error("Failed to load story");
      } finally {
        setLoading(false);
      }
    };

    if (storyId) fetchStory();
  }, [storyId, session?.user?.id]);

  const toggleComments = () => {
    setShowComments((prev) => !prev);
  };

  // Format the story content as HTML (sanitize if needed)
  const formatContent = (content: string) => {
    if (!content) return "";

    // Convert markdown-like formatting to HTML
    let formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
      .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
      .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
      .replace(/^- (.*?)$/gm, "<li>$1</li>")
      .replace(/\n/g, "<br>");

    return formattedContent;
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
      toast.error("Failed to update like status");
    } finally {
      setLikeLoading(null);
    }
  };
  
  const handleFollow = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    if (!author || author._id === session.user.id || followLoading) return;
    
    setFollowLoading(true);
    
    try {
      const res = await fetch(`/api/users/${author._id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Failed to update follow status');
      }

      const data = await res.json();
      
      // Update the author with new following status and follower count
      setAuthor(prev => {
        if (!prev) return null;
        return {
          ...prev,
          isFollowing: data.following,
          followers: data.following 
            ? (prev.followers || 0) + 1 
            : Math.max((prev.followers || 0) - 1, 0)
        };
      });
      
      toast.success(data.following ? "Author followed successfully!" : "Unfollowed author");
    } catch (error) {
      console.error("Error following author:", error);
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-10 px-6">
        <div className="max-w-4xl mx-auto">
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
      <div className="max-w-4xl mx-auto">
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
        </div>
        
        {/* Story header with author info */}
        <div className="bg-gray-800 border border-gray-700/50 rounded-xl overflow-hidden shadow-lg mb-8">
          {/* Author info */}
          <div className="p-5 border-b border-gray-700/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link 
                href={`/profile/${story.userId}`}
                className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden"
              >
                {author?.avatar ? (
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src="/logo.png" 
                    alt="Talesy Logo"
                    className="w-full h-full object-cover"
                  />
                )}
              </Link>
              
              <div>
                <Link 
                  href={`/profile/${story.userId}`}
                  className="font-medium text-white hover:text-indigo-300 transition-colors"
                >
                  {author?.name || "Unknown Author"}
                </Link>
                <p className="text-gray-400 text-xs flex items-center gap-1">
                  <span>{formatDate(story.createdAt)}</span>
                  {author?.followers !== undefined && (
                    <span className="mx-2 text-gray-500">•</span>
                  )}
                  {author?.followers !== undefined && (
                    <span>{author.followers} followers</span>
                  )}
                </p>
              </div>
            </div>
          
            {session?.user && author && session.user.id !== author._id && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  author.isFollowing
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                } ${followLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {followLoading ? "Loading..." : author.isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
          
          {/* Story Title */}
          <div className="p-5">
            <h1 className="text-3xl font-bold text-white mb-4">{story.title}</h1>

            {/* Story Cover Image */}
            {story.imageUrl && (
              <div className="mb-6 w-full">
                <img 
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full max-h-[500px] object-cover rounded-lg"
                />
              </div>
            )}

            {/* Full Story Content */}
            <div className="prose prose-invert prose-lg max-w-none">
              <div 
                className="text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatContent(story.content) }}
              />
            </div>

            {/* Action buttons */}
            <div className="mt-8 pt-4 border-t border-gray-700/50 flex justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={(e) => handleLike(story._id, e)}
                  disabled={likeLoading === story._id}
                  className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {story.likes || 0} Like{(story.likes || 0) !== 1 ? 's' : ''}
                </button>
                
                <button
                  onClick={toggleComments}
                  className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {story.comments || 0} Comment{(story.comments || 0) !== 1 ? 's' : ''}
                </button>
              </div>
              
              {session?.user?.id === story.userId && (
                <div className="flex gap-3">
                  <Link
                    href={`/write/${story._id}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Edit
                  </Link>
                  
                  <button
                    onClick={() => handleDelete(story._id, story.imageUrl)}
                    disabled={deleteLoading === story._id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {deleteLoading === story._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Comment Section */}
        {showComments && <CommentSection postId={story._id} />}
      </div>
    </div>
  );
}