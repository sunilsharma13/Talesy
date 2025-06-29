// src/app/feed/page.tsx (Updated for consistent theming and type safety)
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";
import StoryCard from "@/components/StoryCard";

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
  createdAt: string;
  likes?: number;
  comments?: number;
  status?: "draft" | "published";
  isLikedByCurrentUser?: boolean;
  author: Author;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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
  const [feedStories, setFeedStories] = useState<FeedWriting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  // --- FIX FOR THEME TYPE ERROR AND CONSISTENCY ---
  // Theme state: Aligned with HomeClient.tsx and StoryCard.tsx
  const [theme, setTheme] = useState<"light" | "dark" | "talesy-accent">("dark");

  // Helper to get CSS variables
  const getDynamicThemeClass = (prop: string) => `var(--${prop})`;

  // Theme-related colors/styles are now primarily handled via CSS variables
  // in your global CSS (e.g., globals.css) which are then consumed by these `var(--...)`
  // calls. This object mostly defines logical mappings for loading/error states.
  const themeStyles = {
    loadingBg: getDynamicThemeClass('background-secondary'), // Using a consistent background for loading
    loadingText: getDynamicThemeClass('border-color'), // Using border-color for a subtle pulse effect
    errorBg: getDynamicThemeClass('background-secondary'),
    errorText: getDynamicThemeClass('red-color'), // Assuming a red-color CSS variable for errors
  };
  // --- END FIX ---

  // Helper function to format date
  const formatDate = useCallback((dateString: string): string => {
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
    } else if (diffHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }, []);

  // Helper function to get excerpt from content
  const getExcerpt = useCallback((content: string, maxLength: number = 160): string => {
    if (!content) return "";
    const plainText = content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/#+\s(.*?)(?:\n|$)/g, "$1 ")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/!\[(.*?)\]\(.*?\)/g, "");

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = plainText;
    const finalPlainText = tempDiv.textContent || tempDiv.innerText || "";

    if (finalPlainText.length <= maxLength) return finalPlainText;
    return finalPlainText.substring(0, maxLength) + "...";
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // Retrieve theme from localStorage, assuming a global theme switcher sets it.
    const storedTheme = localStorage.getItem('theme');
    // --- FIX: Check against the correct union type for validation ---
    if (storedTheme && ['light', 'dark', 'talesy-accent'].includes(storedTheme)) {
      setTheme(storedTheme as "light" | "dark" | "talesy-accent");
      document.documentElement.setAttribute('data-theme', storedTheme); // Ensure HTML tag attribute is set
    } else {
      // Default to 'dark' if no theme or invalid theme found
      setTheme("dark");
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchFeed = async () => {
      if (status !== "authenticated") {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setFeedStories([]);

      try {
        const queryParams = new URLSearchParams();
        queryParams.append("publishedOnly", "true");
        queryParams.append("sortOrder", "latest");
        queryParams.append("limit", "10");

        if (activeTab === "following") {
          queryParams.append("following", "true");
        }

        const res = await fetch(`/api/posts?${queryParams.toString()}`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch feed stories");
        }

        const data: FeedWriting[] = await res.json();

        // If "For You" tab is empty, and user has following, switch to "Following" tab
        if (activeTab === "forYou" && data.length === 0 && session?.user?.id) {
          const followingRes = await fetch(`/api/posts?publishedOnly=true&sortOrder=latest&limit=10&following=true`);
          if (followingRes.ok) {
            const followingData: FeedWriting[] = await followingRes.json();
            if (followingData.length > 0) {
              setFeedStories(followingData);
              setActiveTab("following");
              return; // Exit after setting feed and tab
            }
          }
        }

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
  }, [status, activeTab, session?.user?.id]);

  const handleFollowToggle = useCallback(async (userId: string, isCurrentlyFollowing: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (userId === session.user.id) {
      return;
    }

    if (followLoading) return;
    setFollowLoading(userId);

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();

        setFeedStories(prevStories =>
          prevStories.map(story => {
            if (story.author._id === userId) {
              return {
                ...story,
                author: {
                  ...story.author,
                  isFollowing: data.following,
                  followers: data.followers,
                }
              };
            }
            return story;
          })
            .filter(story => !(activeTab === "following" && !data.following && story.author._id === userId))
        );

        toast.success(data.following ? "Followed successfully!" : "Unfollowed successfully!");
      } else {
        const errorText = await res.text();
        console.error("Failed to follow/unfollow. Status:", res.status, "Error:", errorText);
        let message = "Failed to update follow status.";
        try {
          const errorJson = JSON.parse(errorText);
          message = errorJson.message || message;
        } catch (parseError) {
          console.warn("Failed to parse error response as JSON:", parseError);
        }
        toast.error(message);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error("Something went wrong with follow/unfollow.");
    } finally {
      setFollowLoading(null);
    }
  }, [session?.user, activeTab, router, followLoading]);

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

      if (!res.ok) {
        const errorBody = await res.text();
        let errorMessage = `Failed to like: ${res.statusText}`;
        try {
          const errorData = JSON.parse(errorBody);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.warn("Failed to parse error response as JSON:", parseError);
          errorMessage = `Failed to like: ${res.statusText}. Response: ${errorBody.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      setFeedStories(prev =>
        prev.map(post =>
          post._id === postId
            ? {
              ...post,
              likes: data.likesCount,
              isLikedByCurrentUser: data.liked
            }
            : post
        )
      );
      toast.success(data.liked ? "Story liked!" : "Like removed!");
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error(`Failed to update like status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLikeLoading(null);
    }
  }, [session?.user, likeLoading, router]);

  const handleCommentClick = useCallback((postId: string) => {
    router.push(`/story/${postId}?openComments=true`);
  }, [router]);

  // Loading state with theme
  if (loading) {
    return (
      <div className={`min-h-screen py-10 px-6`} style={{ backgroundColor: getDynamicThemeClass('background-primary') }}>
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 ${themeStyles.loadingBg} rounded w-1/3 mb-8 mx-auto`}></div>
            <div className={`h-10 ${themeStyles.loadingBg} rounded-full w-full mb-8`}></div>
            {[1, 2, 3].map(i => (
              <div key={i} className={`mb-6 rounded-xl p-5 shadow-lg`}
                style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 rounded-full overflow-hidden mr-3 ${themeStyles.loadingBg}`}></div>
                  <div className="flex-1">
                    <div className={`h-4 ${themeStyles.loadingText} rounded w-2/5 mb-2`}></div>
                    <div className={`h-3 ${themeStyles.loadingText} rounded w-1/4`}></div>
                  </div>
                </div>
                <div className={`h-48 ${themeStyles.loadingBg} rounded-lg mb-4`}></div>
                <div className={`h-6 ${themeStyles.loadingText} rounded w-3/4 mb-3`}></div>
                <div className={`h-4 ${themeStyles.loadingText} rounded w-full mb-2`}></div>
                <div className={`h-4 ${themeStyles.loadingText} rounded w-5/6`}></div>
                <div className="flex justify-between items-center mt-5">
                  <div className={`h-5 ${themeStyles.loadingText} rounded w-1/5`}></div>
                  <div className="flex gap-2">
                    <div className={`h-8 w-8 ${themeStyles.loadingText} rounded-full`}></div>
                    <div className={`h-8 w-8 ${themeStyles.loadingText} rounded-full`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state with theme
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6`}
        style={{
          backgroundColor: getDynamicThemeClass('background-primary'),
          color: getDynamicThemeClass('text-primary')
        }}
      >
        <div className={`text-center p-8 rounded-xl shadow-lg border`}
          style={{
            backgroundColor: themeStyles.errorBg,
            borderColor: getDynamicThemeClass('border-color')
          }}
        >
          <h2 className={`text-2xl font-semibold mb-4`} style={{ color: themeStyles.errorText }}>Error Loading Feed</h2>
          <p className={`mb-6`} style={{ color: getDynamicThemeClass('text-primary') }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`px-6 py-3 text-white rounded-lg transition-colors`}
            style={{
              backgroundColor: getDynamicThemeClass('accent-color'),
              color: getDynamicThemeClass('active-text'), // Assuming a variable for active button text
              // The hover background will be handled by the direct class in your global CSS
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen`}
      style={{
        backgroundColor: getDynamicThemeClass('background-primary'),
        color: getDynamicThemeClass('text-primary')
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        variants={itemVariants}
        className={`text-3xl sm:text-4xl font-extrabold mb-8 text-center`}
        style={{ color: getDynamicThemeClass('text-primary') }}
      >
        Your Feed
      </motion.h1>

      <motion.div
        variants={itemVariants}
        className={`flex mb-8 rounded-full p-1 shadow-lg`}
        style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}
      >
        <button
          onClick={() => setActiveTab("forYou")}
          className={`flex-1 py-2 px-4 rounded-full text-center transition-all duration-300 ${activeTab === "forYou"
            ? 'font-medium shadow-md'
            : ''
            }`}
          style={{
            backgroundColor: activeTab === "forYou" ? getDynamicThemeClass('accent-color') : 'transparent',
            color: activeTab === "forYou" ? getDynamicThemeClass('active-text') : getDynamicThemeClass('text-secondary'),
          }}
        >
          For You
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-2 px-4 rounded-full text-center transition-all duration-300 ${activeTab === "following"
            ? 'font-medium shadow-md'
            : ''
            }`}
          style={{
            backgroundColor: activeTab === "following" ? getDynamicThemeClass('accent-color') : 'transparent',
            color: activeTab === "following" ? getDynamicThemeClass('active-text') : getDynamicThemeClass('text-secondary'),
          }}
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
            className={`rounded-xl border p-10 text-center shadow-lg`}
            style={{
              backgroundColor: getDynamicThemeClass('background-secondary'),
              borderColor: getDynamicThemeClass('border-color'),
              color: getDynamicThemeClass('text-primary')
            }}
          >
            <p className="text-5xl mb-4">🤔</p>
            <h2 className={`text-2xl font-semibold mb-3`}
              style={{ color: getDynamicThemeClass('text-primary') }}
            >
              {activeTab === "forYou"
                ? "No stories to show right now"
                : "No stories from people you follow yet."
              }
            </h2>
            <p className={`mb-6 max-w-md mx-auto`}
              style={{ color: getDynamicThemeClass('text-secondary') }}
            >
              {activeTab === "forYou"
                ? "It looks like the well is a bit dry! Check back later or start writing your own amazing stories."
                : "Start following some fascinating authors to fill this feed with fresh tales. Or check out the 'For You' tab!"
              }
            </p>
            <Link
              href="/write/new"
              className={`mt-6 inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white transition duration-300 ease-in-out transform hover:scale-105`}
              style={{
                backgroundColor: getDynamicThemeClass('accent-color'),
                color: getDynamicThemeClass('active-text'),
              }}
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
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <StoryCard
                    _id={story._id}
                    title={story.title}
                    content={story.content}
                    imageUrl={story.imageUrl}
                    author={story.author}
                    createdAt={story.createdAt}
                    likes={story.likes}
                    comments={story.comments}
                    status={story.status}
                    isLikedByCurrentUser={story.isLikedByCurrentUser}
                    onLike={handleLike}
                    onComment={handleCommentClick}
                    onFollowToggle={handleFollowToggle}
                    followLoading={followLoading === story.author?._id}
                    likeLoading={likeLoading === story._id}
                    currentUserId={session?.user?.id || null}
                    formatDate={formatDate}
                    getExcerpt={getExcerpt}
                    showAuthorInfo={true}
                    showOwnerActions={false}
                    defaultStoryImage="/default-story-image.png"
                    defaultAvatar="/default-avatar.png" 
                    theme={theme} // This prop is now correctly typed and passed
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