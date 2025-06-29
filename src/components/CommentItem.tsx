// src/components/CommentItem.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

import {
  HeartIcon as HeartIconOutline,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { Spinner } from './Spinner';

// --- Interfaces ---
interface CommentUser {
  _id: string;
  name: string;
  image?: string; // Corresponds to user.image from providers
  avatar?: string; // Corresponds to user.avatar if you have a custom avatar field
}

export interface CommentNode { // Exported for use in CommentSection
  _id: string;
  content: string;
  userId: string;
  postId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt?: string;
  likesCount: number;
  user: CommentUser;
  isLikedByCurrentUser?: boolean;
  replies?: CommentNode[];
}

interface CommentItemProps {
  comment: CommentNode;
  postId: string;
  onNewReply: (content: string, parentId: string) => Promise<void>;
  onLikeToggle: (commentId: string, currentLikedStatus: boolean) => Promise<void>;
  onEditComment: (commentId: string, newContent: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  likeLoadingState: string | null;
  replyLoadingState: string | null;
  editLoadingState: string | null;
  deleteLoadingState: string | null;
  theme?: 'light' | 'dark' | 'talesy-accent';
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true });
  } catch (e) {
    console.error('Error formatting date:', e);
    return new Date(dateString).toLocaleDateString(); // Fallback
  }
};

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  onNewReply,
  onLikeToggle,
  onEditComment,
  onDeleteComment,
  likeLoadingState,
  replyLoadingState,
  editLoadingState,
  deleteLoadingState, // Correctly destructured prop
  theme = 'dark',
}) => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const isLiked = comment.isLikedByCurrentUser;
  const isLoadingLike = likeLoadingState === comment._id;
  const isLoadingReply = replyLoadingState === comment._id;
  const isLoadingEdit = editLoadingState === comment._id;
  // Fix: Use the correctly destructured prop 'deleteLoadingState' here
  const isLoadingDelete = deleteLoadingState === comment._id; 
  const isAuthor = currentUserId === comment.userId;

  // Helper function to get dynamic CSS variables
  const getDynamicThemeClass = (prop: string) => `var(--${prop})`;


  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty.');
      return;
    }
    await onNewReply(replyText, comment._id);
    setReplyText('');
    setShowReplyInput(false);
    setExpandedReplies(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedContent.trim()) {
      toast.error('Edited content cannot be empty.');
      return;
    }
    await onEditComment(comment._id, editedContent);
    setIsEditing(false);
  };

  const handleDeleteClick = async () => {
    await onDeleteComment(comment._id);
  };

  useEffect(() => {
    if (showReplyInput && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyInput]);

  // Determine which avatar URL to use: `image` from providers or `avatar` for custom
  const userAvatarSrc = comment.user?.image || comment.user?.avatar;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 my-4 p-4 rounded-lg shadow-md border"
      style={{
        backgroundColor: getDynamicThemeClass('background-tertiary'), // Darker background for nested comments
        borderColor: getDynamicThemeClass('border-color'),
      }}
    >
      {/* User Avatar */}
      <Link href={`/profile/${comment.user._id}`} className="flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full overflow-hidden border flex items-center justify-center"
          style={{
            backgroundColor: getDynamicThemeClass('background-secondary'), // Even darker for avatar bg
            borderColor: getDynamicThemeClass('border-color'),
          }}
        >
          {userAvatarSrc ? (
            <Image
              src={userAvatarSrc}
              alt={comment.user.name || "User Avatar"}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <UserCircleIcon className="w-9 h-9" style={{ color: getDynamicThemeClass('text-secondary-faded') }} />
          )}
        </div>
      </Link>

      <div className="flex-grow">
        {/* Comment Header */}
        <div className="flex justify-between items-center mb-1">
          <Link
            href={`/profile/${comment.user._id}`}
            className="font-semibold transition-colors text-base"
            style={{ color: getDynamicThemeClass('accent-color') }}
            onMouseEnter={(e) => { e.currentTarget.style.color = getDynamicThemeClass('accent-color-hover'); }}
            onMouseLeave={(e) => { e.currentTarget.style.color = getDynamicThemeClass('accent-color'); }}
          >
            {comment.user?.name || "Anonymous"}
          </Link>
          <div className="text-xs flex items-center gap-1" style={{ color: getDynamicThemeClass('text-secondary') }}>
            <span>{formatDate(comment.createdAt)}</span>
            {comment.updatedAt && new Date(comment.createdAt).getTime() !== new Date(comment.updatedAt).getTime() && (
              <span className="italic" style={{ color: getDynamicThemeClass('text-secondary-faded') }}>(edited)</span>
            )}
          </div>
        </div>

        {/* Comment Content or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="mt-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 text-sm rounded-md border focus:outline-none focus:ring-1 placeholder-gray-400 resize-y min-h-[60px]"
              style={{
                backgroundColor: getDynamicThemeClass('input-background'),
                color: getDynamicThemeClass('text-primary'),
                borderColor: getDynamicThemeClass('input-border'),
                '--tw-ring-color': getDynamicThemeClass('accent-color'),
              } as React.CSSProperties}
              rows={3}
              disabled={isLoadingEdit}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-md text-sm transition-colors"
                style={{
                  backgroundColor: getDynamicThemeClass('button-secondary-bg'),
                  color: getDynamicThemeClass('button-secondary-text'),
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = getDynamicThemeClass('button-secondary-hover-bg'); }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getDynamicThemeClass('button-secondary-bg'); }}
                disabled={isLoadingEdit}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                style={{
                  backgroundColor: getDynamicThemeClass('accent-color'),
                  color: getDynamicThemeClass('active-text'),
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg'); }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color'); }}
                disabled={isLoadingEdit || !editedContent.trim()}
              >
                {isLoadingEdit ? <Spinner className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />} Save
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm whitespace-pre-line leading-relaxed" style={{ color: getDynamicThemeClass('text-primary') }}>{comment.content}</p>
        )}

        {/* Actions (Like, Reply, Edit, Delete) */}
        <div className="flex items-center gap-4 mt-3 ml-1 text-sm font-medium">
          {/* Like Button */}
          {currentUserId && (
            <button
              onClick={() => onLikeToggle(comment._id, !!isLiked)}
              disabled={isLoadingLike}
              className={`flex items-center gap-1 transition-colors ${
                isLiked ? 'text-red-400' : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ color: isLiked ? getDynamicThemeClass('liked-color') : getDynamicThemeClass('text-secondary') }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isLiked ? getDynamicThemeClass('liked-color-hover') : getDynamicThemeClass('accent-color');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isLiked ? getDynamicThemeClass('liked-color') : getDynamicThemeClass('text-secondary');
              }}
            >
              {isLoadingLike ? (
                <Spinner className="w-4 h-4" />
              ) : isLiked ? (
                <HeartIconSolid className="h-4 w-4" />
              ) : (
                <HeartIconOutline className="h-4 w-4" />
              )}
              <span className="text-xs">{comment.likesCount}</span>
            </button>
          )}

          {/* Reply Button */}
          {currentUserId && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="transition-colors"
              style={{ color: getDynamicThemeClass('text-secondary') }}
              onMouseEnter={(e) => { e.currentTarget.style.color = getDynamicThemeClass('accent-color'); }}
              onMouseLeave={(e) => { e.currentTarget.style.color = getDynamicThemeClass('text-secondary'); }}
            >
              Reply
            </button>
          )}

          {/* Edit/Delete Buttons for Author */}
          {isAuthor && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 transition-colors"
                style={{ color: getDynamicThemeClass('text-secondary') }}
                onMouseEnter={(e) => { e.currentTarget.style.color = getDynamicThemeClass('success-color'); }}
                onMouseLeave={(e) => { e.currentTarget.style.color = getDynamicThemeClass('text-secondary'); }}
              >
                <PencilIcon className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isLoadingDelete}
                className="flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: getDynamicThemeClass('text-secondary') }}
                onMouseEnter={(e) => { e.currentTarget.style.color = getDynamicThemeClass('danger-color'); }}
                onMouseLeave={(e) => { e.currentTarget.style.color = getDynamicThemeClass('text-secondary'); }}
              >
                {isLoadingDelete ? <Spinner className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />} Delete
              </button>
            </>
          )}

          {/* Show/Hide Replies Button */}
          {comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => setExpandedReplies(!expandedReplies)}
              className="transition-colors ml-auto"
              style={{ color: getDynamicThemeClass('text-secondary') }}
              onMouseEnter={(e) => { e.currentTarget.style.color = getDynamicThemeClass('accent-color'); }}
              onMouseLeave={(e) => { e.currentTarget.style.color = getDynamicThemeClass('text-secondary'); }}
            >
              {expandedReplies ? 'Hide replies' : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>

        {/* Reply Input Form */}
        <AnimatePresence>
          {showReplyInput && currentUserId && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleReplySubmit}
              className="flex gap-3 mt-4 p-3 rounded-lg shadow-inner"
              style={{
                backgroundColor: getDynamicThemeClass('background-secondary'), // Even darker background for reply form
                borderColor: getDynamicThemeClass('border-color'),
              }}
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Replying to ${comment.user.name}...`}
                rows={2}
                className="flex-grow p-2 text-sm rounded-md border focus:outline-none focus:ring-1 placeholder-gray-400 resize-y min-h-[60px]"
                style={{
                  backgroundColor: getDynamicThemeClass('input-background'),
                  color: getDynamicThemeClass('text-primary'),
                  borderColor: getDynamicThemeClass('input-border'),
                  '--tw-ring-color': getDynamicThemeClass('accent-color'),
                } as React.CSSProperties}
                disabled={isLoadingReply}
                ref={replyInputRef}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center gap-1"
                style={{
                  backgroundColor: getDynamicThemeClass('accent-color'),
                  color: getDynamicThemeClass('active-text'),
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg'); }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color'); }}
                disabled={isLoadingReply || !replyText.trim()}
              >
                {isLoadingReply ? <Spinner className="w-4 h-4" /> : 'Post'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Nested Replies */}
        <AnimatePresence>
          {expandedReplies && comment.replies && comment.replies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="ml-6 border-l-2 pl-4 mt-4 space-y-4"
              style={{ borderColor: getDynamicThemeClass('border-color') }} // Border for nested replies
            >
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  onNewReply={onNewReply}
                  onLikeToggle={onLikeToggle}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                  likeLoadingState={likeLoadingState}
                  replyLoadingState={replyLoadingState}
                  editLoadingState={editLoadingState}
                  deleteLoadingState={deleteLoadingState} // Pass down the corrected prop
                  theme={theme}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CommentItem;