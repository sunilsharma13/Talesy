// app/feed/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";
import FeedStoryCard from "@/components/FeedStoryCard"; // Import the new FeedStoryCard

// Update the User interface to include followers, etc.
// This interface reflects what the API should return when author info is populated
interface Author {
  _id: string;
  name: string;
  avatar?: string;
  isFollowing?: boolean; // indicates if current user is following this author
  followers?: number;
  followingCount?: number;
}

interface FeedWriting { // Renamed to FeedWriting to signify populated author
  _id: string;
  title: string;
  content: string;
  imageUrl?: string; // Optional image URL
  userId: string; // The ID of the user who owns the story
  createdAt: string;
  likes?: number;
  comments?: number;
  status?: "draft" | "published"; // Explicitly passed from HomeClient
  isLikedByCurrentUser?: boolean; // New: To indicate if current user liked it
  author: Author; // Populated author information
}

// Helper functions (moved here for direct use, or you can create a `lib/utils.ts`)
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  } else if (diffHours < 24 * 7) { // Less than 7 days
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

const getExcerpt = (content: string, maxLength: number = 160): string => {
  const plainText = content
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/#+\s(.*?)(?:\n|$)/g, "$1 ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/!\[(.*?)\]\(.*?\)/g, "");

  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + "...";
};

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Stagger effect for cards
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },
};

export default function FeedPage() {
  const { data: session, status } = useSession();
  const [feedStories, setFeedStories] = useState<FeedWriting[]>([]); // Renamed posts to feedStories
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<string | null>(null); // Keep track of specific post being liked

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch feed stories based on activeTab
  useEffect(() => {
    const fetchFeed = async () => {
      if (status !== "authenticated") return;

      setLoading(true);
      setError(null); // Clear previous errors
      setFeedStories([]); // Clear previous stories

      try {
        const queryParams = new URLSearchParams();
        queryParams.append("publishedOnly", "true");
        queryParams.append("sortOrder", "latest");
        queryParams.append("limit", "10"); // You can implement infinite scroll later

        if (activeTab === "following") {
          queryParams.append("following", "true");
        }

        // Call the general posts API, which will now handle 'following' parameter
        const res = await fetch(`/api/posts?${queryParams.toString()}`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch feed stories");
        }

        const data: FeedWriting[] = await res.json();
        setFeedStories(data);
      } catch (err: any) {
        console.error("Error fetching feed:", err);
        setError(err.message || "Could not load feed stories.");
        toast.error("Failed to load feed: " + (err.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [status, activeTab, session?.user?.id]); // Re-fetch when tab or auth status changes

  // Handle follow/unfollow (logic mostly unchanged, but now updates local state for feedStories)
  const handleFollowToggle = useCallback(async (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (userId === session.user.id) return;

    setFollowLoading(userId);

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();

        // Update the author's isFollowing and followers count in the current feedStories
        setFeedStories(prevStories =>
          prevStories.map(story => {
            if (story.author._id === userId) {
              return {
                ...story,
                author: {
                  ...story.author,
                  isFollowing: data.following,
                  followers: data.followers,
                  followingCount: data.followingCount
                }
              };
            }
            return story;
          })
        );

        // If on "Following" tab and unfollowed, filter out posts from that user
        if (activeTab === "following" && !data.following) {
          setFeedStories(prevStories => prevStories.filter(post => post.userId !== userId));
        }

        toast.success(data.following ? "Followed successfully!" : "Unfollowed successfully!");
      } else {
        const errorText = await res.text();
        console.error("Failed to follow/unfollow. Status:", res.status, "Error:", errorText);
        toast.error("Failed to update follow status");
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error("Something went wrong");
    } finally {
      setFollowLoading(null);
    }
  }, [session?.user, activeTab, router]);

  // Handle like (logic mostly unchanged, updates isLikedByCurrentUser)
  const handleLike = useCallback(async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (likeLoading === postId) return;
    setLikeLoading(postId);

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();

        setFeedStories(prev =>
          prev.map(post =>
            post._id === postId
              ? {
                ...post,
                likes: data.liked
                  ? (post.likes || 0) + 1
                  : Math.max((post.likes || 0) - 1, 0),
                isLikedByCurrentUser: data.liked // Update the liked status
              }
              : post
          )
        );
        toast.success(data.liked ? "Story liked!" : "Like removed!");
      } else {
        const errorText = await res.text();
        console.error("Failed to like:", errorText);
        toast.error("Failed to update like status");
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error("Failed to Like Post.");
    } finally {
      setLikeLoading(null);
    }
  }, [session?.user, likeLoading, router]);

  // Handle comment click
  const handleCommentClick = useCallback((postId: string) => {
    router.push(`/story/${postId}?openComments=true`);
  }, [router]);

  // Render loading state (skeleton)
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-8 mx-auto"></div> {/* For 'Stories' title */}
          <div className="h-10 bg-gray-700 rounded-full w-full mb-8"></div> {/* For tab buttons */}
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-6 bg-gray-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-2/5 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-48 bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              <div className="flex justify-between items-center mt-5">
                <div className="h-5 bg-gray-700 rounded w-1/5"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
                  <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error message
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p className="text-xl text-red-500">
          Error: {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-block text-indigo-500 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        variants={itemVariants}
        className="text-3xl sm:text-4xl font-extrabold mb-8 text-white text-center"
      >
        Your Feed
      </motion.h1>

      {/* Tab Navigation */}
      <motion.div
        variants={itemVariants}
        className="flex mb-8 bg-gray-800 rounded-full p-1 shadow-lg"
      >
        <button
          onClick={() => setActiveTab("forYou")}
          className={`flex-1 py-2 px-4 rounded-full text-center transition-all duration-300 ${activeTab === "forYou"
            ? "bg-indigo-600 text-white font-medium shadow-md"
            : "text-gray-400 hover:text-white"
            }`}
        >
          For You
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-2 px-4 rounded-full text-center transition-all duration-300 ${activeTab === "following"
            ? "bg-indigo-600 text-white font-medium shadow-md"
            : "text-gray-400 hover:text-white"
            }`}
        >
          Following
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {feedStories.length === 0 ? (
          <motion.div
            key="no-feed-stories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-gray-700 bg-gray-800 p-10 text-center shadow-lg"
          >
            <p className="text-5xl mb-4">🤔</p>
            <h2 className="text-2xl font-semibold text-white mb-3">
              {activeTab === "forYou"
                ? "No stories to show right now"
                : "No stories from people you follow yet."
              }
            </h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {activeTab === "forYou"
                ? "It looks like the well is a bit dry! Check back later or start writing your own amazing stories."
                : "Start following some fascinating authors to fill this feed with fresh tales. Or check out the 'For You' tab!"
              }
            </p>
            <Link
              href="/write/new"
              className="mt-6 inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ease-in-out transform hover:scale-105"
            >
              Write a Story
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="feed-stories-list"
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {feedStories.map((story) => (
                <motion.div
                  key={story._id}
                  layout // For smooth layout transitions (e.g., when a post is removed after unfollowing)
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden" // Ensure it animates out
                >
                  <FeedStoryCard
                    story={story}
                    formatDate={formatDate}
                    getExcerpt={getExcerpt}
                    onLike={handleLike}
                    onComment={handleCommentClick}
                    onFollowToggle={handleFollowToggle}
                    followLoading={followLoading === story.author._id}
                    likeLoading={likeLoading === story._id}
                    currentUserId={session?.user?.id || null}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}