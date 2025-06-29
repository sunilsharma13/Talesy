// src/components/StoryCard.tsx (Final & Comprehensive Update with Theme and Loading States)
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  UserPlusIcon,
  UserMinusIcon,
  BookOpenIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { useCallback } from "react";

// --- Type Definitions ---
interface Author {
  _id: string;
  name: string;
  avatar?: string | null;
  isFollowing?: boolean;
  followers?: number;
}

interface StoryCardProps {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  className?: string;
  author: Author;
  createdAt: string;
  likes?: number;
  comments?: number;
  status?: "draft" | "published";
  isLikedByCurrentUser?: boolean;
  onDelete?: (storyId: string, storyImageUrl?: string | null) => void;
  onLike: (storyId: string, e: React.MouseEvent) => void;
  onComment: (storyId: string) => void;
  onEdit?: (storyId: string, e: React.MouseEvent) => void;
  onFollowToggle?: (userId: string, isCurrentlyFollowing: boolean, e: React.MouseEvent) => void;
  followLoading?: boolean;
  likeLoading?: boolean;
  deleteLoading?: boolean;
  currentUserId: string | null;
  formatDate: (dateString: string) => string;
  getExcerpt: (content: string, maxLength?: number) => string;
  showAuthorInfo?: boolean;
  showOwnerActions?: boolean;
  showAuthorFollowers?: boolean;
  defaultStoryImage: string;
  defaultAvatar: string;
  theme: "light" | "dark" | "talesy-accent";
}

// --- Component Definition ---
const StoryCard = ({
  _id,
  title,
  content,
  imageUrl,
  author,
  className,
  createdAt,
  likes = 0,
  comments = 0,
  status,
  isLikedByCurrentUser = false,
  onDelete,
  onLike,
  onComment,
  onEdit,
  onFollowToggle,
  followLoading = false,
  likeLoading = false,
  deleteLoading = false,
  currentUserId,
  formatDate,
  getExcerpt,
  showAuthorInfo = true,
  showOwnerActions = false,
  showAuthorFollowers = true,
  defaultStoryImage,
  defaultAvatar,
  theme,
}: StoryCardProps) => {
  const isOwner = currentUserId === author._id;
  const isFollowing = author.isFollowing ?? false;

  // Helper to get CSS variable values
  const getDynamicThemeClass = useCallback((prop: string) => `var(--${prop})`, []);

  // --- Click Handlers (Memoized) ---
  const handleAuthorClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(_id, e);
  }, [onLike, _id]);

  const handleCommentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onComment(_id);
  }, [onComment, _id]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(_id, imageUrl);
  }, [onDelete, _id, imageUrl]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(_id, e);
  }, [onEdit, _id]);

  const handleFollowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFollowToggle) onFollowToggle(author._id, isFollowing, e);
  }, [onFollowToggle, author._id, isFollowing]);

  // --- Derived State ---
  const displayStatus = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : "Unknown";

  // ** REFINED FIX: Ensure image URLs are always valid strings **
  // Filter out null, undefined, and the string "undefined" or empty string ""
  const getSafeImageUrl = (url: string | null | undefined, fallback: string): string => {
    if (typeof url === 'string' && url.length > 0 && url !== "undefined") {
      return url;
    }
    return fallback;
  };

  const finalImageUrl = getSafeImageUrl(imageUrl, defaultStoryImage);
  const finalAuthorAvatar = getSafeImageUrl(author.avatar, defaultAvatar);

  return (
    <motion.div
      className={`rounded-xl shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer h-full border
        ${deleteLoading || likeLoading || followLoading ? 'opacity-70 pointer-events-none' : 'hover:shadow-lg hover:translate-y-[-5px]'}
        ${className || ''}`}
      style={{
        backgroundColor: getDynamicThemeClass('background-secondary'),
        color: getDynamicThemeClass('text-primary'),
        borderColor: getDynamicThemeClass('border-color'),
      }}
      onClick={() => window.location.href = `/story/${_id}`}
    >
      <div className="relative h-48 w-full">
        <Image
          src={finalImageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="rounded-t-xl"
          // ** ADDED sizes PROP for performance **
          // This tells Next.js how wide the image will be at different breakpoints
          // Adjust these values based on your actual CSS layout for the image
          // For a max-w-3xl (48rem) container on larger screens, and full width on mobile
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== defaultStoryImage) {
                target.src = defaultStoryImage;
            }
          }}
        />
        {/* Status Tag - Uses dynamic theme colors for published/draft, falls back to text-secondary */}
        <div
          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-md z-10 text-white`}
          style={{
            backgroundColor: status === "published"
              ? 'var(--green-color, #22c55e)'
              : status === "draft"
                ? 'var(--yellow-color, #f59e0b)'
                : getDynamicThemeClass('text-secondary'),
            color: status === "published" || status === "draft" ? 'white' : getDynamicThemeClass('background-primary'),
          }}
        >
          {status === "published" ? (
            <CheckCircleIcon className="w-3 h-3 mr-1" />
          ) : status === "draft" ? (
            <ClockIcon className="w-3 h-3 mr-1" />
          ) : (
            <BookOpenIcon className="w-3 h-3 mr-1" />
          )}
          <span>{displayStatus}</span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        {showAuthorInfo && (
          <div className="flex items-center mb-4 cursor-pointer" onClick={handleAuthorClick}>
            <Link href={`/profile/${author._id}`} className="flex items-center group">
              <div
                className={`relative w-10 h-10 rounded-full overflow-hidden mr-3`}
                style={{ backgroundColor: getDynamicThemeClass('border-color') }}
              >
                <Image
                  src={finalAuthorAvatar} // <-- Using the ensured valid avatar URL
                  alt={author.name}
                  layout="fill"
                  objectFit="cover"
                  // ** ADDED sizes PROP for performance **
                  sizes="40px" // A fixed size for the avatar
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== defaultAvatar) {
                        target.src = defaultAvatar;
                    }
                  }}
                />
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold group-hover:text-[var(--accent-color)] transition-colors`}
                  style={{ color: getDynamicThemeClass('text-primary') }}
                >
                  {author.name}
                </p>
                {showAuthorFollowers && author.followers !== undefined && (
                  <p
                    className={`text-xs`}
                    style={{ color: getDynamicThemeClass('text-secondary') }}
                  >
                    {author.followers} Followers
                  </p>
                )}
              </div>
            </Link>
            {!isOwner && currentUserId && (
              <motion.button
                onClick={handleFollowClick}
                className={`ml-auto px-3 py-1 text-xs rounded-full flex items-center transition-all duration-300 border
                  ${followLoading ? 'opacity-70 cursor-not-allowed' : ''}
                  ${isFollowing ? 'hover:bg-[var(--hover-bg)] hover:text-[var(--accent-color)]' : 'hover:opacity-80'}`}
                style={{
                  backgroundColor: isFollowing ? getDynamicThemeClass('background-secondary') : getDynamicThemeClass('accent-color'),
                  color: isFollowing ? getDynamicThemeClass('text-primary') : 'white',
                  borderColor: isFollowing ? getDynamicThemeClass('border-color') : getDynamicThemeClass('accent-color'),
                }}
                disabled={followLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {followLoading ? (
                  <svg className={`animate-spin -ml-1 mr-1 h-3 w-3`} style={{ color: isFollowing ? getDynamicThemeClass('text-primary') : 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isFollowing ? (
                  <>
                    <UserMinusIcon className="w-3 h-3 mr-1" /> Unfollow
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-3 h-3 mr-1" /> Follow
                  </>
                )}
              </motion.button>
            )}
          </div>
        )}

        <h3
          className={`text-xl font-bold mb-2 leading-tight line-clamp-2`}
          style={{ color: getDynamicThemeClass('text-primary') }}
        >
          <Link
            href={`/story/${_id}`}
            className="hover:text-[var(--accent-color)] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {title}
          </Link>
        </h3>
        <p
          className={`text-sm mb-4 line-clamp-3 flex-grow overflow-hidden`}
          style={{ color: getDynamicThemeClass('text-secondary') }}
        >
          {getExcerpt(content, 120)}
        </p>

        <div
          className={`mt-auto flex items-center justify-between text-sm pt-4 border-t`}
          style={{
            color: getDynamicThemeClass('text-secondary'),
            borderColor: getDynamicThemeClass('border-color'),
          }}
        >
          <div className="flex items-center space-x-2">
            <span>{formatDate(createdAt)}</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Like Button */}
            <motion.button
              onClick={handleLikeClick}
              className={`flex items-center group ${likeLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={likeLoading}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {likeLoading ? (
                <svg className={`animate-spin h-4 w-4`} style={{ color: getDynamicThemeClass('accent-color') }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isLikedByCurrentUser ? (
                <HeartSolidIcon className={`w-5 h-5`} style={{ color: getDynamicThemeClass('red-color') }} />
              ) : (
                <HeartIcon className={`w-5 h-5 group-hover:text-[var(--accent-color)] transition-colors`} style={{ color: getDynamicThemeClass('text-secondary') }} />
              )}
              <span className={`ml-1`} style={{ color: getDynamicThemeClass('text-primary') }}>{likes ?? 0}</span>
            </motion.button>

            {/* Comment Button */}
            <motion.button
              onClick={handleCommentClick}
              className="flex items-center group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChatBubbleLeftIcon className={`w-5 h-5 group-hover:text-[var(--accent-color)] transition-colors`} style={{ color: getDynamicThemeClass('text-secondary') }} />
              <span className={`ml-1`} style={{ color: getDynamicThemeClass('text-primary') }}>{comments ?? 0}</span>
            </motion.button>

            {/* Owner Actions (Edit & Delete) */}
            {showOwnerActions && isOwner && (
              <>
                <motion.button
                  onClick={handleEditClick}
                  className="group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <PencilSquareIcon className={`w-5 h-5 group-hover:text-[var(--accent-color)] transition-colors`} style={{ color: getDynamicThemeClass('text-secondary') }} />
                </motion.button>
                <motion.button
                  onClick={handleDeleteClick}
                  className="group"
                  disabled={deleteLoading}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {deleteLoading ? (
                    <svg className={`animate-spin h-5 w-5`} style={{ color: getDynamicThemeClass('red-color') }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <TrashIcon className={`w-5 h-5 group-hover:text-[var(--red-color)] transition-colors`} style={{ color: getDynamicThemeClass('text-secondary') }} />
                  )}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StoryCard;