"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import Image from "next/image";

interface StoryCardProps {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  status?: "draft" | "published";
  deleteLoading?: boolean;
  likeLoading?: boolean;
  onDelete: (storyId: string, storyImageUrl?: string) => Promise<void>;
  onLike: (id: string, e: React.MouseEvent) => void;
  onComment: (id: string) => void;
  formatDate: (dateString: string) => string;
  getExcerpt: (content: string, maxWords?: number) => string;
}

const StoryCard: React.FC<StoryCardProps> = ({
  _id,
  title,
  content,
  imageUrl,
  userId,
  createdAt,
  status,
  likes = 0,
  comments = 0,
  deleteLoading,
  likeLoading,
  onDelete,
  onLike,
  onComment,
  formatDate,
  getExcerpt,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const parsedImageUrl = imageUrl || "/placeholder-image.jpg";
  
  // Content excerpt
  const excerpt = mounted ? getExcerpt(content, 25) : "";

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOwner = session?.user?.id === userId;

  return (
    <div className="bg-gray-800 border border-gray-700/50 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl shadow-lg flex flex-col">
      {/* Card Header with Image */}
      <div className="relative">
        {imageUrl && (
          <div className="relative w-full h-56 overflow-hidden">
            <Image
              src={parsedImageUrl}
              alt={title}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="transition-transform duration-500 hover:scale-105"
            />
            
            {/* Status Badge - Overlay on image */}
            <div className="absolute top-3 right-3">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  status === "published"
                    ? "bg-green-600/90 text-white"
                    : "bg-amber-500/90 text-white"
                }`}
              >
                {status === "published" ? "Published" : "Draft"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-xs">{formatDate(createdAt)}</span>
          
          {/* Like Counter at top right */}
          <div className="flex items-center">
            <span className="text-red-400 text-xs flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              {likes}
            </span>
          </div>
        </div>

        {/* Title with Link */}
        <Link href={`/story/${_id}`} className="group">
          <h3 className="font-bold text-xl mb-3 text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        {/* Story Excerpt */}
        <p className="text-gray-300 line-clamp-3 text-sm flex-grow mb-4">
          {excerpt}
        </p>

        {/* Actions Bar */}
        <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center">
          {/* Comments count */}
          <button
            onClick={() => onComment(_id)}
            className="text-gray-400 hover:text-blue-400 transition flex items-center gap-1 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {comments} comments
          </button>

          {/* Action Buttons */}
          <div className="flex gap-2 items-center">
            {/* Like Button */}
            <button
              disabled={likeLoading}
              onClick={(e) => onLike(_id, e)}
              title="Like"
              className="flex items-center justify-center p-1.5 rounded-full text-white bg-gray-700 hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {likeLoading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Edit Button - only show if user owns the story */}
            {isOwner && (
              <button
                onClick={() => router.push(`/write/${_id}`)}
                title="Edit"
                className="flex items-center justify-center p-1.5 rounded-full text-white bg-gray-700 hover:bg-amber-500 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}

            {/* Delete Button - only show if user owns the story */}
            {isOwner && (
              <button
                onClick={() => onDelete(_id, imageUrl)}
                disabled={deleteLoading}
                title="Delete"
                className="flex items-center justify-center p-1.5 rounded-full text-white bg-gray-700 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;