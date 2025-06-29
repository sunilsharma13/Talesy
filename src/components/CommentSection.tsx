// src/components/CommentSection.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Spinner } from './Spinner';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import CommentItem, { CommentNode } from './CommentItem'; // Import CommentNode interface
import { ChevronDownIcon } from '@heroicons/react/24/outline'; // For collapsing/expanding - though not directly used in the final version of this file.

interface CommentSectionProps {
  postId: string;
  theme?: 'light' | 'dark' | 'talesy-accent'; // Added theme prop
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, theme = 'dark' }) => { // Default theme for safety
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [comments, setComments] = useState<CommentNode[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Loading states for individual comment actions
  const [likeLoadingId, setLikeLoadingId] = useState<string | null>(null);
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  // Helper function to get dynamic CSS variables
  const getDynamicThemeClass = (prop: string) => `var(--${prop})`;

  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) {
        throw new Error(`Failed to fetch comments: ${res.statusText}`);
      }
      const data: CommentNode[] = await res.json();
      setComments(data);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error(`Failed to load comments: ${error.message}`);
    } finally {
      setIsLoadingComments(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Helper to update comment tree immutably
  const updateCommentInTree = useCallback((
    commentList: CommentNode[],
    targetId: string,
    updateFn: (comment: CommentNode) => CommentNode | null // null for deletion
  ): CommentNode[] => {
    return commentList
      .map(comment => {
        if (comment._id === targetId) {
          return updateFn(comment);
        }
        if (comment.replies && comment.replies.length > 0) {
          const updatedReplies = updateCommentInTree(comment.replies, targetId, updateFn);
          if (updatedReplies !== comment.replies) { // Only update if replies actually changed
            return { ...comment, replies: updatedReplies };
          }
        }
        return comment;
      })
      .filter((comment): comment is CommentNode => comment !== null); // Filter out nulls (deleted comments)
  }, []);

  const handleNewComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) {
      toast.error('Comment cannot be empty.');
      return;
    }
    if (!isAuthenticated) {
      toast.error('You must be logged in to comment.');
      return;
    }

    setIsPostingComment(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newCommentText }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }

      const newComment = await res.json();
      setComments(prev => [newComment, ...prev]); // Add new top-level comment to the top
      setNewCommentText('');
      toast.success('Comment posted!');
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast.error(`Failed to post comment: ${error.message}`);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleNewReply = async (content: string, parentId: string) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to reply.');
      return;
    }
    setReplyLoadingId(parentId);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to post reply');
      }

      const newReply = await res.json();
      setComments(prevComments =>
        updateCommentInTree(prevComments, parentId, (comment) => {
          const updatedReplies = comment.replies ? [...comment.replies, newReply] : [newReply];
          return { ...comment, replies: updatedReplies };
        })
      );
      toast.success('Reply posted!');
    } catch (error: any) {
      console.error('Error posting reply:', error);
      toast.error(`Failed to post reply: ${error.message}`);
    } finally {
      setReplyLoadingId(null);
    }
  };

  const handleLikeToggle = async (commentId: string, currentLikedStatus: boolean) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to like comments.');
      return;
    }
    setLikeLoadingId(commentId);
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to toggle like');
      }

      const { liked, likesCount } = await res.json();
      setComments(prevComments =>
        updateCommentInTree(prevComments, commentId, (comment) => ({
          ...comment,
          isLikedByCurrentUser: liked,
          likesCount: likesCount,
        }))
      );
      toast.success(liked ? 'Comment liked!' : 'Comment unliked!');
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast.error(`Failed to toggle like: ${error.message}`);
    } finally {
      setLikeLoadingId(null);
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to edit comments.');
      return;
    }
    setEditLoadingId(commentId);
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to edit comment');
      }

      const { updatedContent, updatedAt } = await res.json();
      setComments(prevComments =>
        updateCommentInTree(prevComments, commentId, (comment) => ({
          ...comment,
          content: updatedContent,
          updatedAt: updatedAt,
        }))
      );
      toast.success('Comment updated!');
    } catch (error: any) {
      console.error('Error editing comment:', error);
      toast.error(`Failed to edit comment: ${error.message}`);
    } finally {
      setEditLoadingId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to delete comments.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this comment and all its replies?')) {
      return;
    }

    setDeleteLoadingId(commentId);
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete comment');
      }

      setComments(prevComments =>
        updateCommentInTree(prevComments, commentId, () => null) // Filter out the deleted comment
      );
      toast.success('Comment deleted!');
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error(`Failed to delete comment: ${error.message}`);
    } finally {
      setDeleteLoadingId(null);
    }
  };


  const totalCommentsCount = useMemo(() => {
    const countReplies = (cmts: CommentNode[]): number => {
      return cmts.reduce((acc, cmt) => acc + 1 + (cmt.replies ? countReplies(cmt.replies) : 0), 0);
    };
    return countReplies(comments);
  }, [comments]);


  return (
    <div
      className="mt-8 p-6 rounded-lg shadow-xl border"
      style={{
        backgroundColor: getDynamicThemeClass('background-secondary'),
        borderColor: getDynamicThemeClass('border-color'),
      }}
    >
      <h2
        className="text-2xl font-bold mb-6 border-b pb-4"
        style={{
          color: getDynamicThemeClass('text-primary'),
          borderColor: getDynamicThemeClass('border-color'),
        }}
      >
        Comments ({totalCommentsCount})
      </h2>

      {/* New Comment Input */}
      {isAuthenticated ? (
        <form
          onSubmit={handleNewComment}
          className="mb-8 p-4 rounded-lg shadow-inner border"
          style={{
            backgroundColor: getDynamicThemeClass('background-tertiary'),
            borderColor: getDynamicThemeClass('border-color'),
          }}
        >
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write your comment..."
            rows={4}
            className="w-full p-3 text-base rounded-md border focus:outline-none focus:ring-2 placeholder-gray-400 resize-y min-h-[100px]"
            style={{
              backgroundColor: getDynamicThemeClass('input-background'),
              color: getDynamicThemeClass('text-primary'),
              borderColor: getDynamicThemeClass('input-border'),
              '--tw-ring-color': getDynamicThemeClass('accent-color'), // For ring color
            } as React.CSSProperties} // Cast to React.CSSProperties to allow custom CSS properties
            disabled={isPostingComment}
          />
          <button
            type="submit"
            className="mt-3 px-6 py-2 font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              backgroundColor: getDynamicThemeClass('accent-color'),
              color: getDynamicThemeClass('active-text'),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
              e.currentTarget.style.color = getDynamicThemeClass('text-primary');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
              e.currentTarget.style.color = getDynamicThemeClass('active-text');
            }}
            disabled={isPostingComment || !newCommentText.trim()}
          >
            {isPostingComment ? <Spinner className="w-5 h-5" /> : null}
            Post Comment
          </button>
        </form>
      ) : (
        <p
          className="mb-8 text-center p-4 rounded-lg"
          style={{
            color: getDynamicThemeClass('text-secondary'),
            backgroundColor: getDynamicThemeClass('background-tertiary'),
          }}
        >
          Please <Link href="/login" style={{ color: getDynamicThemeClass('accent-color') }} className="hover:underline">log in</Link> to post comments.
        </p>
      )}

      {/* Comments List */}
      {isLoadingComments ? (
        <div className="flex justify-center items-center h-40" style={{ color: getDynamicThemeClass('text-secondary') }}>
          <Spinner className="w-8 h-8 mr-2" /> Loading Comments...
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center mt-10" style={{ color: getDynamicThemeClass('text-secondary') }}>No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                postId={postId}
                onNewReply={handleNewReply}
                onLikeToggle={handleLikeToggle}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                likeLoadingState={likeLoadingId}
                replyLoadingState={replyLoadingId}
                editLoadingState={editLoadingId}
                deleteLoadingState={deleteLoadingId}
                theme={theme} // Pass the theme down to CommentItem
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CommentSection;