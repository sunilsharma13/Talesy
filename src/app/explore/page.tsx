// app/explore/page.tsx (Updated for better responsiveness and scroll fix)
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import StoryCard from "@/components/StoryCard";
import {
  SparklesIcon,
  UsersIcon,
  TagIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  UserPlusIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// --- Type Definitions ---
interface Author {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean;
  followers?: number;
  followingCount?: number;
  email?: string;
  coverImage?: string;
}

interface Story {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: Author;
  createdAt: string;
  likes: number;
  comments: number;
  status?: "draft" | "published";
  isLikedByCurrentUser?: boolean;
}

interface Tag {
  name: string;
  count: number;
}

// --- Default Images ---
const DEFAULT_AVATAR = "/default-avatar.png";
const DEFAULT_STORY_IMAGE = "/default-story-image.png";

// --- Framer Motion Variants ---
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
      when: "beforeChildren",
      staggerChildren: 0.1,
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
      stiffness: 100,
      damping: 17,
    },
  },
};

const cardItemVariants = {
  hidden: { y: 50, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 17,
    },
  },
};

const tagItemVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 20,
    },
  },
};

export default function ExplorePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [trendingStories, setTrendingStories] = useState<Story[]>([]);
  const [featuredWriters, setFeaturedWriters] = useState<Author[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [theme, setTheme] = useState<"light" | "dark" | "talesy-accent">("dark");

  const [likeLoadingState, setLikeLoadingState] = useState<Record<string, boolean>>({});
  const [followLoadingState, setFollowLoadingState] = useState<Record<string, boolean>>({});

  const formatDate = useCallback((dateString: string) => {
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

  const getExcerpt = useCallback((content: string, maxLength: number = 160) => {
    if (!content) return "";
    const plainText = content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/#+\s(.*?)(?:\n|$)/g, "$1 ")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/!\[(.*?)\]\(.*?\)/g, "");

    const parser = new DOMParser();
    const doc = parser.parseFromString(plainText, 'text/html');
    const finalPlainText = doc.body.textContent || "";

    if (finalPlainText.length <= maxLength) return finalPlainText;
    return finalPlainText.substring(0, maxLength) + "...";
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && ['light', 'dark', 'talesy-accent'].includes(storedTheme)) {
      setTheme(storedTheme as "light" | "dark" | "talesy-accent");
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      setTheme("dark");
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    async function fetchExploreData() {
      setLoading(true);

      try {
        const [storiesRes, writersRes, tagsRes] = await Promise.all([
          fetch("/api/posts/trending"),
          fetch("/api/users/featured"),
          fetch("/api/tags/popular"),
        ]);

        if (storiesRes.ok) {
          const storiesData: Story[] = await storiesRes.json();
          setTrendingStories(storiesData.map(story => ({
            ...story,
            likes: story.likes ?? 0,
            comments: story.comments ?? 0,
            isLikedByCurrentUser: story.isLikedByCurrentUser ?? false,
          })));
        } else {
          console.error("Failed to fetch trending stories:", storiesRes.status, storiesRes.statusText);
          toast.error("Failed to load trending stories.");
        }

        if (writersRes.ok) {
          const writersData: Author[] = await writersRes.json();
          setFeaturedWriters(writersData.map(writer => ({
            ...writer,
            followers: writer.followers ?? 0,
            isFollowing: writer.isFollowing ?? false,
          })));
        } else {
          console.error("Failed to fetch featured writers:", writersRes.status, writersRes.statusText);
          toast.error("Failed to load featured writers.");
        }

        if (tagsRes.ok) {
          const tagsData: Tag[] = await tagsRes.json();
          setTags(tagsData);
        } else {
          console.error("Failed to fetch popular tags:", tagsRes.status, tagsRes.statusText);
          toast.error("Failed to load popular topics.");
        }
      } catch (error) {
        console.error("Error fetching explore data:", error);
        toast.error("An unexpected error occurred while loading explore data.");
      } finally {
        setLoading(false);
      }
    }

    fetchExploreData();
  }, []);

  const handleLikeStory = useCallback(async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) {
      toast.error("Log in to like stories!");
      return;
    }

    setLikeLoadingState(prev => ({ ...prev, [storyId]: true }));

    setTrendingStories(prevStories =>
      prevStories.map(story =>
        story._id === storyId
          ? {
              ...story,
              isLikedByCurrentUser: !story.isLikedByCurrentUser,
              likes: story.isLikedByCurrentUser ? story.likes - 1 : story.likes + 1,
            }
          : story
      )
    );

    try {
      const res = await fetch(`/api/posts/${storyId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        setTrendingStories(prevStories =>
          prevStories.map(story =>
            story._id === storyId
              ? {
                  ...story,
                  isLikedByCurrentUser: !story.isLikedByCurrentUser,
                  likes: story.isLikedByCurrentUser ? story.likes + 1 : story.likes - 1,
                }
              : story
          )
        );
        toast.error("Failed to update like.");
      }
    } catch (error) {
      console.error("Error liking story:", error);
      toast.error("Failed to update like due to network error.");
      setTrendingStories(prevStories =>
        prevStories.map(story =>
          story._id === storyId
            ? {
                ...story,
                isLikedByCurrentUser: !story.isLikedByCurrentUser,
                likes: story.isLikedByCurrentUser ? story.likes + 1 : story.likes - 1,
              }
            : story
        )
      );
    } finally {
      setLikeLoadingState(prev => ({ ...prev, [storyId]: false }));
    }
  }, [session?.user?.id]);

  const handleCommentStory = useCallback((storyId: string) => {
    if (!session?.user?.id) {
        toast.error("Log in to comment!");
        return;
    }
    window.location.href = `/story/${storyId}?openComments=true`;
  }, [session?.user?.id]);


  const handleFollowToggle = useCallback(async (userId: string, isCurrentlyFollowing: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) {
      toast.error("Log in to follow writers!");
      return;
    }
    if (session.user.id === userId) {
      toast.error("You cannot follow yourself!");
      return;
    }

    setFollowLoadingState(prev => ({ ...prev, [userId]: true }));

    setFeaturedWriters(prevWriters =>
      prevWriters.map(writer =>
        writer._id === userId
          ? {
              ...writer,
              isFollowing: !isCurrentlyFollowing,
              followers: isCurrentlyFollowing ? (writer.followers ?? 0) - 1 : (writer.followers ?? 0) + 1,
            }
          : writer
      )
    );
    setTrendingStories(prevStories =>
        prevStories.map(story =>
            story.author._id === userId
                ? {
                    ...story,
                    author: {
                        ...story.author,
                        isFollowing: !isCurrentlyFollowing,
                        followers: isCurrentlyFollowing ? (story.author.followers ?? 0) - 1 : (story.author.followers ?? 0) + 1,
                    }
                }
                : story
        )
    );

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        setFeaturedWriters(prevWriters =>
          prevWriters.map(writer =>
            writer._id === userId
              ? {
                  ...writer,
                  isFollowing: isCurrentlyFollowing,
                  followers: isCurrentlyFollowing ? (writer.followers ?? 0) + 1 : (writer.followers ?? 0) - 1,
                }
              : writer
          )
        );
        setTrendingStories(prevStories =>
            prevStories.map(story =>
                story.author._id === userId
                    ? {
                        ...story,
                        author: {
                            ...story.author,
                            isFollowing: isCurrentlyFollowing,
                            followers: isCurrentlyFollowing ? (story.author.followers ?? 0) + 1 : (story.author.followers ?? 0) - 1,
                        }
                    }
                    : story
            )
        );
        toast.error(`Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} writer.`);
      } else {
        toast.success(`${isCurrentlyFollowing ? 'Unfollowed' : 'Followed'}!`);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error(`Network error: Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'}.`);
      setFeaturedWriters(prevWriters =>
        prevWriters.map(writer =>
          writer._id === userId
            ? {
                ...writer,
                isFollowing: isCurrentlyFollowing,
                followers: isCurrentlyFollowing ? (writer.followers ?? 0) + 1 : (writer.followers ?? 0) - 1,
              }
            : writer
        )
      );
      setTrendingStories(prevStories =>
          prevStories.map(story =>
              story.author._id === userId
                  ? {
                      ...story,
                      author: {
                          ...story.author,
                          isFollowing: isCurrentlyFollowing,
                          followers: isCurrentlyFollowing ? (story.author.followers ?? 0) + 1 : (story.author.followers ?? 0) - 1,
                      }
                  }
                  : story
          )
      );
    } finally {
      setFollowLoadingState(prev => ({ ...prev, [userId]: false }));
    }
  }, [session?.user?.id]);


  const placeholderTags = [
    { name: "Fiction", count: 243 },
    { name: "Poetry", count: 189 },
    { name: "Technology", count: 156 },
    { name: "Travel", count: 134 },
    { name: "Self-improvement", count: 112 },
    { name: "Health", count: 98 },
    { name: "Science", count: 87 },
    { name: "Art", count: 76 },
  ];

  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="text-4xl sm:text-5xl font-extrabold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text drop-shadow-md"
      >
        Explore Talesy
      </motion.h1>

      {loading ? (
        <div className="max-w-7xl mx-auto space-y-14 p-4 sm:p-6 lg:p-8">
          {/* Skeleton for Trending Stories */}
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--background-secondary)] rounded-md w-1/3 mb-6"></div>
            {/* Adjusted grid for skeleton to prevent overflow on very small screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-5 h-72 shadow-lg min-w-0" style={{ backgroundColor: 'var(--background-secondary)'}}>
                  <div className="h-40 rounded-lg mb-4 bg-[var(--border-color)] opacity-50"></div>
                  <div className="h-4 rounded w-3/4 mb-3 bg-[var(--border-color)] opacity-50"></div>
                  <div className="h-4 rounded w-full mb-2 bg-[var(--border-color)] opacity-50"></div>
                  <div className="h-4 rounded w-2/3 mb-4 bg-[var(--border-color)] opacity-50"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton for Featured Writers */}
          <div className="animate-pulse mt-12">
            <div className="h-8 bg-[var(--background-secondary)] rounded-md w-1/3 mb-6"></div>
            {/* Adjusted grid for skeleton to prevent overflow on very small screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-w-0">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl p-6 text-center shadow-lg min-w-0" style={{ backgroundColor: 'var(--background-secondary)'}}>
                  <div className="mx-auto h-20 w-20 rounded-full mb-4 bg-[var(--border-color)] opacity-50"></div>
                  <div className="h-4 rounded w-3/4 mx-auto mb-2 bg-[var(--border-color)] opacity-50"></div>
                  <div className="h-3 rounded w-1/2 mx-auto bg-[var(--border-color)] opacity-50"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton for Popular Topics */}
          <div className="animate-pulse mt-12">
            <div className="h-8 bg-[var(--background-secondary)] rounded-md w-1/3 mb-6"></div>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 w-28 rounded-full bg-[var(--background-secondary)] opacity-70"></div>
              ))}
            </div>
          </div>

          {/* Skeleton for Discover More Banner */}
          <div className="h-48 rounded-xl animate-pulse mt-12 shadow-lg" style={{ backgroundColor: 'var(--background-secondary)'}}></div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-14 p-4 sm:p-6 lg:p-8 overflow-hidden"> {/* Added overflow-hidden here */}
          {/* Trending Stories */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center" style={{ color: 'var(--text-primary)'}}>
              <SparklesIcon className="h-7 w-7 mr-3" style={{ color: 'var(--accent-color)'}} />
              Trending Stories
            </h2>
            <AnimatePresence mode="wait">
              {trendingStories.length > 0 ? (
                <motion.div
                  key="trending-stories-grid"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  // Changed to a more robust responsive grid
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0"
                >
                  {trendingStories.map((story) => (
                    <motion.div key={story._id} variants={cardItemVariants}>
                      <StoryCard
                        _id={story._id}
                        title={story.title}
                        content={story.content}
                        imageUrl={story.imageUrl}
                        author={story.author}
                        createdAt={story.createdAt}
                        likes={story.likes}
                        comments={story.comments}
                        isLikedByCurrentUser={story.isLikedByCurrentUser}
                        onLike={handleLikeStory}
                        onComment={handleCommentStory}
                        onFollowToggle={handleFollowToggle}
                        currentUserId={session?.user?.id || null}
                        formatDate={formatDate}
                        getExcerpt={getExcerpt}
                        showAuthorInfo={true}
                        showOwnerActions={false}
                        showAuthorFollowers={true}
                        defaultStoryImage={DEFAULT_STORY_IMAGE}
                        defaultAvatar={DEFAULT_AVATAR}
                        status={story.status}
                        likeLoading={likeLoadingState[story._id] || false}
                        theme={theme}
                        className="shadow-xl hover:shadow-2xl transition-all duration-300 min-w-0" // Added min-w-0
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="no-trending-stories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="col-span-full p-8 rounded-xl text-center shadow-lg transition-colors duration-500 border border-[var(--border-color)]"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                  }}
                >
                  <BookOpenIcon className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-secondary)'}} />
                  <p className="mb-6 text-lg" style={{ color: 'var(--text-secondary)'}}>No trending stories yet. Be the first to make waves!</p>
                  <Link
                    href="/write/new"
                    className="inline-block px-7 py-3 font-medium rounded-full transition-all transform hover:scale-105 shadow-md text-base"
                    style={{
                      backgroundColor: 'var(--accent-color)',
                      color: 'var(--active-text)',
                    }}
                  >
                    Start Writing
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Featured Writers */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="mt-12"
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center" style={{ color: 'var(--text-primary)'}}>
              <UsersIcon className="h-7 w-7 mr-3" style={{ color: 'var(--accent-color)'}} />
              Featured Writers
            </h2>
            <AnimatePresence mode="wait">
              {featuredWriters.length > 0 ? (
                <motion.div
                  key="featured-writers-grid"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  // Changed to a more robust responsive grid
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-w-0" // Added min-w-0
                >
                  {featuredWriters.map(writer => (
                    <motion.div key={writer._id} variants={cardItemVariants}>
                      <div className="rounded-xl p-6 text-center border border-[var(--border-color)] hover:border-[var(--accent-color)] transition-all duration-300 transform hover:scale-105 shadow-xl flex flex-col items-center h-full min-w-0"> {/* Added min-w-0 */}
                        <Link
                            href={`/profile/${writer._id}`}
                            className="flex flex-col items-center flex-grow w-full"
                        >
                            <Image
                              src={writer.avatar || DEFAULT_AVATAR}
                              alt={writer.name}
                              width={96}
                              height={96}
                              className="rounded-full object-cover border-4 mb-4 flex-shrink-0 w-24 h-24"
                              style={{ borderColor: 'var(--accent-color)'}}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = DEFAULT_AVATAR;
                              }}
                            />
                            <h3 className="font-semibold text-xl mb-1 line-clamp-1" style={{ color: 'var(--text-primary)'}}>{writer.name}</h3>
                            {writer.bio && (
                              <p className="text-sm line-clamp-2 mb-2 flex-grow" style={{ color: 'var(--text-secondary)'}}>{writer.bio}</p>
                            )}
                            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)'}}>
                                <span className="font-bold mr-1" style={{ color: 'var(--accent-color)'}}>{writer.followers ?? 0}</span>
                                Followers
                            </p>
                        </Link>
                        {session?.user?.id && session.user.id !== writer._id && (
                          <motion.button
                            onClick={(e) => handleFollowToggle(writer._id, writer.isFollowing ?? false, e)}
                            className={`mt-4 px-6 py-2.5 text-base rounded-full font-medium transition-colors duration-300 w-full max-w-[160px] ${
                              followLoadingState[writer._id] ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                            disabled={followLoadingState[writer._id]}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              backgroundColor: writer.isFollowing ? 'var(--background-primary)' : 'var(--accent-color)',
                              color: writer.isFollowing ? 'var(--text-secondary)' : 'var(--active-text)',
                              borderColor: writer.isFollowing ? 'var(--border-color)' : 'transparent',
                              borderWidth: writer.isFollowing ? '1px' : '0px',
                              boxShadow: writer.isFollowing ? 'none' : 'var(--shadow-md)',
                            }}
                          >
                            {followLoadingState[writer._id] ? (
                              <svg className="animate-spin -ml-1 mr-1 h-4 w-4" style={{ color: writer.isFollowing ? 'var(--text-primary)' : 'var(--active-text)'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : writer.isFollowing ? (
                                <span className="flex items-center justify-center">
                                    <UserMinusIcon className="w-5 h-5 mr-1" /> Following
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <UserPlusIcon className="w-5 h-5 mr-1" /> Follow
                                </span>
                            )}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="no-featured-writers"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="col-span-full p-8 rounded-xl text-center shadow-lg transition-colors duration-500 border border-[var(--border-color)]"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                  }}
                >
                  <UsersIcon className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-secondary)'}} />
                  <p className="text-lg" style={{ color: 'var(--text-secondary)'}}>Our featured writers will inspire you soon!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Popular Tags */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="mt-12"
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center" style={{ color: 'var(--text-primary)'}}>
              <TagIcon className="h-7 w-7 mr-3" style={{ color: 'var(--accent-color)'}} />
              Popular Topics
            </h2>
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start" // Added justify-center for small screens
            >
              {(tags.length > 0 ? tags : placeholderTags).map((tag, index) => (
                <motion.div key={tag.name || index} variants={tagItemVariants}>
                  <Link
                    href={`/search?q=${tag.name}`}
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full border border-[var(--border-color)] hover:border-[var(--accent-color)] transition-all duration-300 flex items-center group shadow-md text-base"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                    }}
                  >
                    <span className="group-hover:text-[var(--accent-color)] transition-colors font-medium" style={{ color: 'var(--text-primary)'}}>{tag.name}</span>
                    <span className="text-sm ml-2 group-hover:text-[var(--accent-color)] transition-colors" style={{ color: 'var(--text-secondary)'}}>
                      ({tag.count})
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* Discover More Banner */}
          <motion.section
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl overflow-hidden relative shadow-2xl group cursor-pointer mt-12"
            whileHover={{ scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <Link href="/feed" className="block">
                <div className="bg-gradient-to-br from-indigo-700 to-purple-800 p-8 md:p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('/pattern-dots.svg')", backgroundSize: "30px 30px" }}></div>
                <div className="relative z-10 max-w-3xl">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">Discover More Tales</h2>
                    <p className="text-indigo-200 mb-8 md:text-lg lg:text-xl">
                    Explore thousands of captivating stories from writers around the world.
                    Find inspiration, share your thoughts, and connect with a vibrant community.
                    </p>
                    <div
                    // THIS IS THE KEY CHANGE FOR THE BUTTON RESPONSIVENESS AND LOOK
                    className="inline-flex items-center px-8 sm:px-10 py-3.5 font-medium rounded-full shadow-lg transition-all duration-300 transform group-hover:scale-105 text-lg whitespace-nowrap" // Added whitespace-nowrap
                    style={{
                        backgroundColor: 'var(--background-primary)',
                        color: 'var(--accent-color)',
                        // You might want to define a hover background in your global CSS
                        // e.g., for the .group-hover:class or just :hover
                    }}
                    >
                        Explore Feed
                        <ArrowTopRightOnSquareIcon className="ml-3 h-6 w-6 transform -rotate-45" />
                    </div>
                </div>
                </div>
            </Link>
          </motion.section>
        </div>
      )}
    </div>
  );
}