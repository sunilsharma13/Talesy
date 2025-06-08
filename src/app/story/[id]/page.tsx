// app/story/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from 'react-hot-toast';

interface Story {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  comments: number;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface User {
  _id: string;
  name: string;
  avatar?: string;
}

interface Comment {
  _id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
}

export default function StoryPage({ params }: { params: any }) {
  // Extract the ID from params
  const id = params?.id;
  
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpenComments = searchParams.get("openComments") === "true";
  
  const [story, setStory] = useState<Story | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  
  // Comments
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Open comments section if URL param is set
    if (shouldOpenComments) {
      setShowComments(true);
    }
  }, [shouldOpenComments]);

  useEffect(() => {
    // Guard against undefined ID
    if (!id) {
      setError("Missing story ID");
      setLoading(false);
      return;
    }
    
    const fetchStory = async () => {
      try {
        setLoading(true);
        
        // Fetch story data
        const storyRes = await fetch(`/api/posts/${id}`);
        
        if (!storyRes.ok) {
          console.error(`Failed to fetch story with status: ${storyRes.status}`);
          toast.error("Failed to load story");
          throw new Error("Failed to fetch story");
        }
        
        const storyData = await storyRes.json();
        setStory(storyData);
        
        // Set initial counts
        setLikeCount(storyData.likes || 0);
        setCommentCount(storyData.comments || 0);
        
        // Fetch author data
        if (storyData.userId) {
          const authorRes = await fetch(`/api/users/${storyData.userId}`);
          if (authorRes.ok) {
            const authorData = await authorRes.json();
            setAuthor(authorData);
          }
        }
        
        // Check if user has liked this post
        if (session?.user?.id) {
          try {
            const likeStatusRes = await fetch(`/api/posts/${id}/like/status`);
            if (likeStatusRes.ok) {
              const likeData = await likeStatusRes.json();
              setLiked(likeData.liked);
            }
          } catch (likeError) {
            console.error("Error checking like status:", likeError);
            // Continue even if like check fails
          }
        }
        
      } catch (err) {
        console.error("Error fetching story:", err);
        setError("Failed to load story. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStory();
  }, [id, session?.user?.id]);
  
  // Fetch comments when comments section is opened
  useEffect(() => {
    // Guard against undefined ID or when comments aren't shown
    if (!id || !showComments) return;
    
    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        
        const res = await fetch(`/api/posts/${id}/comments`);
        
        if (!res.ok) {
          console.error(`Failed to fetch comments with status: ${res.status}`);
          toast.error("Failed to load comments");
          throw new Error("Failed to fetch comments");
        }
        
        const data = await res.json();
        setComments(data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setCommentsLoading(false);
      }
    };
    
    fetchComments();
  }, [showComments, id]);

  // For the handleLike function in story/[id]/page.tsx
const handleLike = async () => {
  if (!session?.user) {
    router.push('/login');
    return;
  }
  
  if (!id) return;
  
  setLikeLoading(true);
  
  // Store current state before optimistic update
  const wasLiked = liked;
  const currentCount = likeCount;
  
  try {
    // Optimistic update
    setLiked(!wasLiked);
    setLikeCount(wasLiked ? currentCount - 1 : currentCount + 1);
    
    const res = await fetch(`/api/posts/${id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.count);
    } else {
      // Revert optimistic update on error
      setLiked(wasLiked);
      setLikeCount(currentCount);
      console.error("Failed to like post");
    }
  } catch (error) {
    // Revert optimistic update on error
    setLiked(wasLiked);
    setLikeCount(currentCount);
    console.error('Error liking post:', error);
  } finally {
    setLikeLoading(false);
  }
};
  
  const toggleComments = () => {
    setShowComments(prev => !prev);
    // Focus the comment input when opening comments
    if (!showComments && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 100);
    }
  };
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    if (!commentText.trim() || !id) return;
    
    setCommentSubmitting(true);
    
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText })
      });
      
      if (res.ok) {
        const newComment = await res.json();
        
        // Add the new comment to the list
        setComments(prevComments => [newComment, ...prevComments]);
        
        // Clear the input
        setCommentText("");
        
        // Update comment count
        setCommentCount(prev => prev + 1);
        
        toast.success("Comment added");
      } else {
        toast.error("Failed to add comment");
        console.error("Failed to add comment");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Something went wrong");
    } finally {
      setCommentSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Format comment date
  const formatCommentDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(dateString);
  };

  // Process HTML content for rendering
  const processContent = (content: string) => {
    if (!content) return '';
    
    // If content is already in HTML format (contains tags), return as is
    if (/<\/?[a-z][\s\S]*>/i.test(content)) {
      return content;
    }
    
    // Convert markdown headings
    let formattedContent = content
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-10 mb-4">$1</h1>')
      
      // Convert markdown paragraphs and line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      
      // Convert bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Convert links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Convert images
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="my-4 max-w-full h-auto rounded" />');
    
    return `<p class="mb-4">${formattedContent}</p>`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-3/4 mb-6"></div>
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-gray-700 rounded-full mr-3"></div>
          <div className="h-4 bg-gray-700 rounded w-32"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-48 bg-gray-700 rounded w-full mt-6"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-900/20 text-red-300 p-4 rounded-lg">
          {error || "Story not found"}
        </div>
        <div className="mt-6 text-center">
          <Link 
            href="/feed"
            className="text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* Story header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {story.title}
        </h1>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {author && (
              <Link 
                href={`/profile/${author._id}`}
                className="flex items-center hover:opacity-90 transition-opacity"
              >
                <img
                  src={author.avatar || "/default-avatar.png"}
                  alt={author.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-700"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/default-avatar.png";
                  }}
                />
                <div className="ml-3">
                  <p className="font-medium text-white hover:underline">{author.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(story.createdAt)}</p>
                </div>
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
                liked ? "bg-red-900/30 text-red-400" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 ${liked ? "text-red-500" : "text-gray-500"}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span>{likeCount}</span>
            </button>
            
            <button
              onClick={toggleComments}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
                showComments ? "bg-blue-900/30 text-blue-400" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 ${showComments ? "text-blue-500" : "text-gray-500"}`}
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span>{commentCount}</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Featured Image */}
      {story.imageUrl && (
        <div className="mb-8">
          <img
            src={story.imageUrl}
            alt={story.title}
            className="w-full h-auto max-h-[500px] object-cover rounded-xl border border-gray-700"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-image.jpg";
              target.classList.add("hidden");
            }}
          />
        </div>
      )}
      
      {/* Story Content */}
      <article className="prose prose-invert lg:prose-lg max-w-none mb-10">
        <div dangerouslySetInnerHTML={{ __html: processContent(story.content) }} />
      </article>
      
      {/* Comments Section */}
      {showComments && (
        <section className="mt-10 border-t border-gray-700 pt-6">
          <h2 className="text-2xl font-bold text-white mb-6">Comments {commentCount > 0 && `(${commentCount})`}</h2>
          
          {session?.user ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex items-start gap-3">
                <img
                  src={session.user.avatar || session.user.image || "/default-avatar.png"}
                  alt={session.user.name || "User"}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/default-avatar.png";
                  }}
                />
                <div className="flex-1">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    rows={3}
                    required
                  ></textarea>
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={commentSubmitting || !commentText.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      {commentSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-800 rounded-lg text-center">
              <p className="text-gray-400 mb-2">Please sign in to post a comment</p>
              <Link
                href="/login"
                className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Sign In
              </Link>
            </div>
          )}
          
          {/* Comment List */}
          {commentsLoading ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-20 mb-3"></div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 bg-gray-800 rounded-lg">
              <p className="text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map(comment => (
                <div key={comment._id} className="flex gap-3">
                  <Link
                    href={`/profile/${comment.userId}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={comment.user?.avatar || "/default-avatar.png"}
                      alt={comment.user?.name || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-avatar.png";
                      }}
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <Link
                        href={`/profile/${comment.userId}`}
                        className="font-medium text-white hover:underline"
                      >
                        {comment.user?.name || "Anonymous"}
                      </Link>
                      <span className="text-xs text-gray-500">
                        {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}