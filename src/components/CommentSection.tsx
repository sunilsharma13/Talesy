"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="mt-8 bg-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Comments</h3>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitComment} className="mb-8">
        <div className="mb-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={session ? "Add your thoughts..." : "Sign in to comment"}
            disabled={!session || submitting}
            className="w-full p-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 border border-gray-600"
            rows={3}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!session || submitting || !newComment.trim()}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Post Comment
              </>
            )}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex space-x-4">
              <div className="rounded-full bg-gray-700 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-400">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment._id} className="flex p-4 rounded-lg bg-gray-700/50 border border-gray-600/30">
              <div className="flex-shrink-0 mr-4">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-600">
                  {comment.user?.avatar ? (
                    <Image
                      src={comment.user.avatar}
                      alt={comment.user.name || "User"}
                      width={40}
                      height={40}
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-avatar.png";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-lg font-bold">
                      {(comment.user?.name?.charAt(0) || "?").toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-indigo-300">{comment.user?.name || "Anonymous"}</h4>
                  <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-gray-200 text-sm whitespace-pre-line">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;