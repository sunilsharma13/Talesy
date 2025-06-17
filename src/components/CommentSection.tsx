"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  avatar?: string;
}

interface Reply {
  _id: string;
  content: string;
  userId: string;
  commentId: string;
  postId: string;
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
}

interface Comment {
  _id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: string;
  likes?: number;
  user: {
    name: string;
    avatar?: string;
  };
  replies?: Reply[];
}

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For replies
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  
  // For likes
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching comments for post:", postId);
        const res = await fetch(`/api/posts/${postId}/comments`);
        
        if (!res.ok) {
          console.error("Failed to fetch comments:", res.status, res.statusText);
          const errorText = await res.text();
          setError(`Failed to fetch comments: ${res.status} - ${errorText}`);
          return;
        }
        
        const data = await res.json();
        if (Array.isArray(data)) {
          setComments(data);
          console.log(`Loaded ${data.length} comments`);
        } else {
          console.error("Unexpected comments data format:", data);
          setComments([]);
        }
      } catch (error: any) {
        console.error("Error fetching comments:", error);
        setError(`Error fetching comments: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (!newComment.trim()) return;
    
    setSubmitting(true);
    setError(null);
    try {
      console.log("Submitting comment for post:", postId);
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!res.ok) {
        console.error("Failed to submit comment:", res.status, res.statusText);
        const errorText = await res.text();
        setError(`Failed to submit comment: ${res.status} - ${errorText}`);
        return;
      }

      const data = await res.json();
      console.log("Comment submitted successfully:", data);
      setComments([...comments, data]);
      setNewComment('');
      toast.success('Comment posted successfully!');
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      setError(`Error submitting comment: ${error.message}`);
      toast.error('Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (!replyText.trim()) return;
    
    setReplyLoading(commentId);
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyText }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const reply = await res.json();
      
      // Update the comments state with the new reply
      setComments(prevComments => 
        prevComments.map(comment => 
          comment._id === commentId 
            ? {
                ...comment,
                replies: [...(comment.replies || []), reply]
              }
            : comment
        )
      );
      
      setReplyText('');
      setActiveReplyId(null);
      
      // Auto-expand replies for the comment
      setExpandedComments(prev => ({
        ...prev,
        [commentId]: true
      }));
      
      toast.success('Reply posted successfully!');
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      toast.error('Failed to post reply.');
    } finally {
      setReplyLoading(null);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    setLikeLoading(commentId);
    try {
      // Toggle like status in UI immediately for better UX
      const currentLiked = likedComments[commentId] || false;
      setLikedComments(prev => ({
        ...prev,
        [commentId]: !currentLiked
      }));
      
      // Update the like count in UI
      setComments(prevComments => 
        prevComments.map(comment => 
          comment._id === commentId 
            ? {
                ...comment,
                likes: (comment.likes || 0) + (currentLiked ? -1 : 1)
              }
            : comment
        )
      );
      
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!res.ok) {
        // If the API call fails, revert the UI changes
        setLikedComments(prev => ({
          ...prev,
          [commentId]: currentLiked
        }));
        
        setComments(prevComments => 
          prevComments.map(comment => 
            comment._id === commentId 
              ? {
                  ...comment,
                  likes: (comment.likes || 0) + (currentLiked ? 0 : -1)
                }
              : comment
          )
        );
        
        throw new Error('Failed to like comment');
      }
      
      // No need to show success toast for likes
    } catch (error: any) {
      console.error("Error liking comment:", error);
      toast.error('Failed to update like.');
    } finally {
      setLikeLoading(null);
    }
  };
  
  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  return (
    <div className="bg-gray-800 border border-gray-700/50 rounded-xl p-6 shadow-lg mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Comments</h3>

      {/* Comment form */}
      <div className="mb-8">
        {!session ? (
          <div className="p-4 bg-gray-700/40 rounded-lg text-center">
            <p className="text-gray-300 mb-3">Sign in to join the conversation</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitComment} className="flex gap-4">
            <div className="w-10 h-10 flex-shrink-0">
            // In CommentSection.tsx - replace the section with the user image:

<div className="rounded-full overflow-hidden w-10 h-10 bg-gray-700">
  {session.user?.image ? (
    <img
      src={session.user.image}
      alt="Your avatar"
      className="object-cover w-full h-full" 
    />
  ) : (
    <img
      src="/logo.png"
      alt="Talesy Logo"
      className="w-full h-full object-cover"
    />
  )}
</div>
            </div>
            
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                disabled={submitting}
                className="w-full p-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400 border border-gray-600 mb-2"
                rows={3}
              />
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex gap-4">
              <div className="rounded-full bg-gray-700 h-10 w-10 flex-shrink-0"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-16 bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-400">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {comments.map((comment) => (
            <div key={comment._id} className="mb-6">
              {/* Main comment */}
              <div className="flex gap-4">
                {/* User avatar */}
                <Link href={`/profile/${comment.userId}`} className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                    {comment.user?.avatar ? (
                      <Image
                        src={comment.user.avatar}
                        alt={comment.user.name || "User"}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <img 
                        src="/logo.png" 
                        alt="Talesy Logo"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </Link>
                
                {/* Comment content */}
                <div className="flex-grow">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Link 
                        href={`/profile/${comment.userId}`}
                        className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {comment.user?.name || "Anonymous"}
                      </Link>
                      <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-200 mb-2 whitespace-pre-line">{comment.content}</p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-4 mt-2 ml-1 text-sm">
                    <button 
                      onClick={() => handleLikeComment(comment._id)}
                      disabled={likeLoading === comment._id}
                      className={`flex items-center gap-1 hover:text-indigo-400 transition ${
                        likedComments[comment._id] ? 'text-indigo-400' : 'text-gray-500'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span>{comment.likes || 0}</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}
                      className="text-gray-500 hover:text-indigo-400 transition"
                    >
                      Reply
                    </button>
                    
                    {comment.replies && comment.replies.length > 0 && (
                      <button 
                        onClick={() => toggleReplies(comment._id)}
                        className="text-gray-500 hover:text-indigo-400 transition ml-auto"
                      >
                        {expandedComments[comment._id] ? 'Hide replies' : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                      </button>
                    )}
                  </div>
                  
                  {/* Reply form */}
                  {activeReplyId === comment._id && session && (
                    <div className="mt-3 ml-2">
                      <form onSubmit={(e) => handleSubmitReply(comment._id, e)} className="flex gap-3">
                        <div className="w-8 h-8 flex-shrink-0">
                          <div className="rounded-full overflow-hidden w-8 h-8 bg-gray-700">
                            {session.user?.image ? (
                              <Image
                                src={session.user.image}
                                width={32}
                                height={32}
                                alt="Your avatar"
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <img 
                                src="/logo.png" 
                                alt="Talesy Logo"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-grow">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-400 border border-gray-600 mb-2"
                            rows={2}
                          />
                          
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveReplyId(null)}
                              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={replyLoading === comment._id || !replyText.trim()}
                              className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                              {replyLoading === comment._id ? 'Posting...' : 'Reply'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Replies */}
                  {expandedComments[comment._id] && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 ml-5 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply._id} className="flex gap-3">
                        <Link href={`/profile/${reply.userId}`} className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                            {reply.user?.avatar ? (
                              <img
                                src={reply.user.avatar} // Fixed: was using user.avatar instead of reply.user.avatar
                                alt={reply.user?.name || "User"} // Fixed: was using user.name instead of reply.user.name
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  e.currentTarget.src = "/logo.png";
                                }}
                              />
                            ) : (
                              <img 
                                src="/logo.png" 
                                alt="Talesy Logo"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </Link>
                        
                        <div className="flex-grow">
                          <div className="bg-gray-700/30 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <Link 
                                href={`/profile/${reply.userId}`}
                                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
                              >
                                {reply.user?.name || "Anonymous"}
                              </Link>
                              <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                            </div>
                            <p className="text-gray-200 text-sm whitespace-pre-line">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;