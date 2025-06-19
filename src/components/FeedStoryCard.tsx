// components/FeedStoryCard.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeartIcon as HeartIconOutline, ChatBubbleLeftRightIcon, ShareIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid"; // For liked state
import { useState, useEffect } from "react"; // For theme

// Re-defining types here for clarity, but you could import them from app/feed/page.tsx if preferred
interface Author {
  _id: string;
  name: string;
  avatar?: string;
  isFollowing?: boolean;
  followers?: number;
  followingCount?: number;
}

interface FeedWriting {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  isLikedByCurrentUser?: boolean; // Added for like status
  author: Author; // Populated author information
}

interface FeedStoryCardProps {
  story: FeedWriting;
  formatDate: (dateString: string) => string;
  getExcerpt: (content: string, maxLength?: number) => string;
  onLike: (storyId: string, e: React.MouseEvent) => void;
  onComment: (storyId: string) => void;
  onFollowToggle: (userId: string, e: React.MouseEvent) => void; // New prop for follow toggle
  followLoading: boolean;
  likeLoading: boolean;
  currentUserId: string | null; // Pass current user ID to determine if follow button should show
}

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 18 } },
  hover: {
    scale: 1.01,
    boxShadow: "0px 12px 25px rgba(0, 0, 0, 0.25)", // More pronounced shadow on hover
    transition: { duration: 0.2 }
  }
};

export default function FeedStoryCard({
  story,
  formatDate,
  getExcerpt,
  onLike,
  onComment,
  onFollowToggle,
  followLoading,
  likeLoading,
  currentUserId,
}: FeedStoryCardProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark"); // Assuming theme management

  useEffect(() => {
    // This is a placeholder for actual theme context/localStorage retrieval
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  const isDark = theme === 'dark';
  const isCurrentUserAuthor = currentUserId === story.author._id;

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}
      transition-all duration-300 cursor-pointer flex flex-col`}
    >
      {/* Author Info & Follow Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${story.author._id}`}>
            <img
              src={story.author.avatar || "/default-avatar.png"}
              alt={story.author.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 hover:border-indigo-400 transition-colors"
            />
          </Link>
          <div>
            <Link href={`/profile/${story.author._id}`} className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'} hover:text-indigo-600 ${isDark ? 'dark:hover:text-indigo-400' : ''} transition-colors`}>
              {story.author.name}
            </Link>
            <p className="text-sm text-gray-500">
              <span>{formatDate(story.createdAt)}</span>
              {story.author.followers !== undefined && (
                <>
                  <span className="w-1 h-1 bg-gray-500 rounded-full mx-2 inline-block"></span>
                  <span>{story.author.followers} follower{story.author.followers !== 1 ? 's' : ''}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {!isCurrentUserAuthor && (
          <button
            onClick={(e) => onFollowToggle(story.author._id, e)}
            disabled={followLoading}
            className={`px-4 py-2 text-sm rounded-full transition-colors duration-300 transform hover:scale-105
              ${story.author.isFollowing
                ? "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {followLoading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : story.author.isFollowing ? (
              "Following"
            ) : (
              "Follow"
            )}
          </button>
        )}
      </div>

      {/* Story Image */}
      {story.imageUrl && (
        <Link href={`/story/${story._id}`}>
          <div className="relative w-full h-56 sm:h-64 overflow-hidden rounded-lg mb-4">
            <img
              src={story.imageUrl}
              alt={story.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => { e.currentTarget.src = "/placeholder-image.jpg"; }}
            />
          </div>
        </Link>
      )}

      {/* Story Content */}
      <div className="flex-grow"> {/* Allows content area to grow and push actions to bottom */}
        <h3 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-tight mb-2`}>
          <Link href={`/story/${story._id}`} className={`hover:text-indigo-600 ${isDark ? 'dark:hover:text-indigo-400' : ''} transition-colors`}>
            {story.title}
          </Link>
        </h3>
        <p className={`text-base mb-4 line-clamp-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {getExcerpt(story.content, 200)}
        </p>
        <Link href={`/story/${story._id}`} className={`text-indigo-600 ${isDark ? 'dark:text-indigo-400' : ''} hover:underline text-sm font-medium`}>
          Read Full Story &rarr;
        </Link>
      </div>

      {/* Interactions */}
      <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} mt-4 pt-4 flex items-center justify-between`}>
        <div className="flex space-x-4">
          <button
            onClick={(e) => onLike(story._id, e)}
            disabled={likeLoading}
            className={`flex items-center ${isDark ? 'text-gray-400' : 'text-gray-600'} hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Like"
          >
            {likeLoading ? (
              <svg className="animate-spin h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : story.isLikedByCurrentUser ? (
              <HeartIconSolid className="w-5 h-5 mr-1 text-red-500" />
            ) : (
              <HeartIconOutline className="w-5 h-5 mr-1" />
            )}
            <span>{story.likes || 0}</span>
          </button>
          <button
            onClick={() => onComment(story._id)}
            className={`flex items-center ${isDark ? 'text-gray-400' : 'text-gray-600'} hover:text-blue-500 transition-colors`}
            title="Comments"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-1" />
            <span>{story.comments || 0}</span>
          </button>
        </div>
        <button className={`text-gray-600 ${isDark ? 'dark:text-gray-400' : ''} hover:text-indigo-500 transition-colors`} title="Share">
          <ShareIcon className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}