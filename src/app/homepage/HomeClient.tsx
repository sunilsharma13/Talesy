// homepage/HomeClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // Import AnimatePresence

// Heroicons Import
import {
  BookOpenIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  ArrowLongUpIcon,
  ArrowLongDownIcon,
  AdjustmentsHorizontalIcon, // Added for settings icon if needed, or simply use Edit Profile
} from "@heroicons/react/24/outline";

// Type Definitions
type User = {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  email?: string;
  coverImage?: string;
};

type Story = {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  published: boolean;
};

// Animation Variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Slightly increased stagger for smoother reveal
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
      stiffness: 120, // Slightly stiffer for more responsiveness
      damping: 18,
    },
  },
};

const profileCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 25,
      delay: 0.1, // Delay profile card animation slightly
    },
  },
};

const storyGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3, // Delay story cards slightly after profile loads
    },
  },
};

const statItemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 180,
      damping: 20,
    },
  },
};

const buttonHover = {
  scale: 1.02,
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  transition: { duration: 0.2 },
};

export default function HomeClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeFilter, setActiveFilter] = useState<"all" | "published" | "drafts">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"createdAt" | "title">("createdAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Helper function to format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Helper function to get excerpt from content (handles HTML and Markdown)
  const getExcerpt = useCallback((content: string, maxLength: number = 150) => {
    let plainText = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    plainText = plainText
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/#+\s(.*?)(?:\n|$)/g, "$1 ")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/!\[(.*?)\]\(.*?\)/g, "[Image]")
      .replace(/```[\s\S]*?```/g, "[Code Block]")
      .replace(/`.*?`/g, "")
      .replace(/>\s*(.*)/g, "$1")
      .replace(/\n\s*\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  }, []);

  // Get current theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  // Load user data and stories based on session status
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.id) {
      const currentUserId = session.user.id;

      async function loadUserData() {
        try {
          setLoadingData(true);

          // Fetch user profile
          const userRes = await fetch("/api/users/profile");
          if (userRes.ok) {
            const userData = await userRes.json();
            const fetchedUser: User = { ...userData.user, _id: userData.user._id || currentUserId };
            setUser(fetchedUser);

            // Fetch user's stories
            const storiesRes = await fetch(`/api/posts/user/${currentUserId}`);
            if (storiesRes.ok) {
              const storiesData: Story[] = await storiesRes.json();
              setAllStories(storiesData);
            } else {
              console.error("Failed to fetch stories:", storiesRes.statusText);
            }

            // Fetch follower count
            const followerRes = await fetch(`/api/users/${currentUserId}/followers/count`);
            if (followerRes.ok) {
              const followerData = await followerRes.json();
              setFollowerCount(followerData.count);
            } else {
              console.error("Failed to fetch follower count:", followerRes.statusText);
            }

            // Fetch following count
            const followingRes = await fetch(`/api/users/${currentUserId}/following/count`);
            if (followingRes.ok) {
              const followingData = await followingRes.json();
              setFollowingCount(followingData.count);
            } else {
              console.error("Failed to fetch following count:", followingRes.statusText);
            }
          } else {
            console.error("Failed to fetch user profile:", userRes.statusText);
            setUser(null);
          }
        } catch (error) {
          console.error("Error loading profile or stories:", error);
          setUser(null);
        } finally {
          setLoadingData(false);
        }
      }
      loadUserData();
    }
  }, [session, status, router]);

  useEffect(() => {
    let tempStories = [...allStories];

    if (activeFilter === "published") {
      tempStories = tempStories.filter((story) => story.published);
    } else if (activeFilter === "drafts") {
      tempStories = tempStories.filter((story) => !story.published);
    }

    tempStories.sort((a, b) => {
      if (sortBy === "createdAt") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else if (sortBy === "title") {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (titleA < titleB) return sortOrder === "asc" ? -1 : 1;
        if (titleA > titleB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
      return 0;
    });

    setFilteredStories(tempStories);
  }, [allStories, activeFilter, sortBy, sortOrder]);

  const handleDeleteStory = useCallback(async (storyId: string, storyImageUrl?: string) => {
    if (confirm("Are you sure you want to delete this story?")) {
      try {
        const res = await fetch(`/api/posts/${storyId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setAllStories(prevStories => prevStories.filter(story => story._id !== storyId));
          alert("Story deleted successfully!");
        } else {
          const errorData = await res.json();
          alert(`Failed to delete story: ${errorData.message || res.statusText}`);
        }
      } catch (error) {
        console.error("Error deleting story:", error);
        alert("An error occurred while deleting the story.");
      }
    }
  }, []);

  const handleLikeStory = useCallback(async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${storyId}/like`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setAllStories(prevStories =>
          prevStories.map(story =>
            story._id === storyId ? { ...story, likes: data.likesCount } : story
          )
        );
      } else {
        const errorData = await res.json();
        console.error("Failed to like story:", errorData.message || res.statusText);
        alert(errorData.message || "Failed to like story.");
      }
    } catch (error) {
      console.error("Error liking story:", error);
      alert("An error occurred while liking the story.");
    }
  }, []);

  const handleCommentStory = useCallback((storyId: string) => {
    router.push(`/story/${storyId}#comments`);
  }, [router]);

  if (status === "loading" || loadingData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse flex flex-col md:flex-row gap-8">
          {/* Profile section skeleton */}
          <div className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-xl p-6 w-full md:w-1/3 lg:w-1/4`}>
            {/* Skeleton for cover area */}
            <div className="h-40 w-full rounded-t-lg bg-gray-700/50 mb-4"></div>
            {/* Skeleton for avatar */}
            <div className="flex justify-center -mt-20 mb-4">
              <div className="w-32 h-32 rounded-full bg-gray-600/50 border-4 border-white"></div>
            </div>
            {/* Skeleton for name and email */}
            <div className="h-6 bg-gray-600/50 rounded w-3/4 mx-auto mb-3"></div>
            <div className="h-4 bg-gray-600/50 rounded w-1/2 mx-auto mb-6"></div>
            {/* Skeleton for bio */}
            <div className="h-4 bg-gray-600/50 rounded w-11/12 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-600/50 rounded w-10/12 mx-auto mb-6"></div>
            {/* Skeleton for stats */}
            <div className="flex justify-center space-x-8 border-t border-b py-4 px-2">
              <div className="h-8 w-1/4 bg-gray-600/50 rounded"></div>
              <div className="h-8 w-1/4 bg-gray-600/50 rounded"></div>
              <div className="h-8 w-1/4 bg-gray-600/50 rounded"></div>
            </div>
            {/* Skeleton for edit profile button */}
            <div className="h-10 bg-gray-600/50 rounded-full w-2/3 mx-auto mt-6"></div>
            {/* Skeleton for quick links */}
            <div className="mt-8 space-y-3">
              <div className="h-8 bg-gray-600/50 rounded"></div>
              <div className="h-8 bg-gray-600/50 rounded"></div>
              <div className="h-8 bg-gray-600/50 rounded"></div>
            </div>
          </div>

          {/* Stories section skeleton */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <div className={`h-10 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-200/50'} rounded w-1/3 mb-6`}></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={`${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-xl p-5 h-40`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user && status === "authenticated" && !loadingData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Failed to load your profile data. Please try again.
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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile section */}
        <motion.div
          variants={profileCardVariants} // Use specific profile card variant
          className="w-full md:w-1/3 lg:w-1/4"
        >
          <div
            className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg relative overflow-hidden transform transition-all duration-300 hover:shadow-xl`}
          >
            {/* Cover image container */}
            <div className="h-48 w-full relative"> {/* Increased height to h-48 for better visual */}
              {user?.coverImage ? (
                <img
                  src={user.coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                // Default background with Talesy logo or gradient
                <div
                  className="w-full h-full bg-cover bg-center flex items-center justify-center"
                  style={{
                    backgroundImage: "url('/talesy-background-logo.png')", // Ensure this path is correct
                    backgroundColor: theme === 'dark' ? '#2d3748' : '#e2e8f0',
                    backgroundSize: '30%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Optional: Add text overlay if needed, e.g., "Talesy" */}
                </div>
              )}
               {/* Subtle gradient overlay to enhance profile image visibility */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>

            {/* Profile picture - positioned relative to the parent, with negative margin to overlap cover */}
            <div className="flex justify-center -mt-20 z-10 relative"> {/* Adjusted -mt-20 for h-48 cover */}
              <motion.img
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 10, delay: 0.3 }}
                src={user?.avatar || "/default-avatar.png"}
                alt={user?.name || "User Avatar"}
                className="w-36 h-36 rounded-full border-4 border-white object-cover bg-white shadow-lg transform transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/default-avatar.png";
                }}
              />
            </div>

            {/* User info */}
            <div className="text-center px-6 py-4 mt-[-1rem]">
              <motion.h2
                variants={itemVariants}
                className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}
              >
                {user?.name}
              </motion.h2>
              {user?.email && (
                <motion.p
                  variants={itemVariants}
                  className="text-gray-500 text-sm mb-3"
                >
                  {user.email}
                </motion.p>
              )}

              {user?.bio && (
                <motion.p
                  variants={itemVariants}
                  className={`mt-2 text-md ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {user.bio}
                </motion.p>
              )}

              {/* Stats - NOW CLICKABLE */}
              <motion.div
                variants={containerVariants} // Using container variants for stagger effect on stats
                initial="hidden"
                animate="visible"
                className="mt-8 flex justify-around items-center border-y py-4 px-2
                transition-colors duration-300
                "
              >
                <motion.div variants={statItemVariants} className="text-center">
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {allStories.length}
                  </div>
                  <div className="text-sm text-gray-500">Stories</div>
                </motion.div>

                <motion.div variants={statItemVariants} className="text-center">
                  {user?._id && (
                    <Link href={`/profile/${user._id}/followers`} className="group cursor-pointer">
                      <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white group-hover:text-indigo-300' : 'text-gray-800 group-hover:text-indigo-600'} transition-colors`}>
                        {followerCount}
                      </div>
                      <div className="text-sm text-gray-500 group-hover:text-indigo-400 transition-colors">Followers</div>
                    </Link>
                  )}
                  {!user?._id && ( // Fallback if user ID is not available
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        {followerCount}
                      </div>
                      <div className="text-sm text-gray-500">Followers</div>
                    </div>
                  )}
                </motion.div>

                <motion.div variants={statItemVariants} className="text-center">
                  {user?._id && (
                    <Link href={`/profile/${user._id}/following`} className="group cursor-pointer">
                      <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white group-hover:text-indigo-300' : 'text-gray-800 group-hover:text-indigo-600'} transition-colors`}>
                        {followingCount}
                      </div>
                      <div className="text-sm text-gray-500 group-hover:text-indigo-400 transition-colors">Following</div>
                    </Link>
                  )}
                  {!user?._id && ( // Fallback if user ID is not available
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        {followingCount}
                      </div>
                      <div className="text-sm text-gray-500">Following</div>
                    </div>
                  )}
                </motion.div>
              </motion.div>

              {/* Actions */}
              <motion.div variants={itemVariants} className="mt-6 mb-4">
                <Link
                  href="/settings"
                  className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm ${
                    theme === 'dark'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  } transition duration-300 ease-in-out transform hover:scale-105`}
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2 -ml-1" />
                  Edit Profile
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Quick Links section */}
          <motion.div
            variants={itemVariants}
            className={`mt-6 rounded-xl shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} transform transition-all duration-300 hover:shadow-xl`}
          >
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Quick Actions
              </h3>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                <motion.li variants={itemVariants}>
                  <Link
                    href="/write/new"
                    className={`flex items-center px-4 py-3 rounded-lg ${
                      theme === 'dark'
                        ? 'hover:bg-gray-700 text-indigo-400'
                        : 'hover:bg-gray-100 text-indigo-600'
                    } transition duration-200 transform hover:translate-x-1`}
                  >
                    <PencilSquareIcon className="w-5 h-5 mr-3" />
                    Write New Story
                  </Link>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <Link
                    href="/dashboard"
                    className={`flex items-center px-4 py-3 rounded-lg ${
                      theme === 'dark'
                        ? 'hover:bg-gray-700 text-indigo-400'
                        : 'hover:bg-gray-100 text-indigo-600'
                    } transition duration-200 transform hover:translate-x-1`}
                  >
                    <Squares2X2Icon className="w-5 h-5 mr-3" />
                    Dashboard
                  </Link>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <Link
                    href="/explore"
                    className={`flex items-center px-4 py-3 rounded-lg ${
                      theme === 'dark'
                        ? 'hover:bg-gray-700 text-indigo-400'
                        : 'hover:bg-gray-100 text-indigo-600'
                    } transition duration-200 transform hover:translate-x-1`}
                  >
                    <MagnifyingGlassIcon className="w-5 h-5 mr-3" />
                    Explore Stories
                  </Link>
                </motion.li>
              </ul>
            </div>
          </motion.div>
        </motion.div>

        {/* Stories section */}
        <div className="w-full md:w-2/3 lg:w-3/4">
          <motion.h2
            variants={itemVariants}
            className={`text-3xl font-extrabold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
          >
            Your Stories
          </motion.h2>

          <AnimatePresence mode="wait">
            {allStories.length === 0 && !loadingData ? (
              <motion.div
                key="no-stories" // Key for AnimatePresence
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-10 text-center shadow-sm`}
              >
                <BookOpenIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className={`mt-4 text-lg font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  You haven't published any stories yet. Start writing your first masterpiece!
                </p>
                <Link
                  href="/write/new"
                  className="mt-6 inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ease-in-out transform hover:scale-105"
                >
                  <PencilSquareIcon className="w-5 h-5 mr-2" />
                  Start Writing
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="stories-content" // Key for AnimatePresence
                variants={storyGridVariants} // Apply stagger to stories grid
                initial="hidden"
                animate="visible"
                exit="hidden" // Exit animation
                className="space-y-6"
              >
                {/* Filter and Sort options */}
                <motion.div
                  variants={itemVariants}
                  className={`flex flex-col sm:flex-row rounded-lg overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}
                >
                  {/* Filter Tabs */}
                  <div className="flex flex-1 border-b sm:border-b-0 sm:border-r border-gray-700/50">
                    <button
                      onClick={() => setActiveFilter("all")}
                      className={`flex-1 py-3 px-4 text-sm font-medium ${
                        activeFilter === "all"
                          ? theme === 'dark' ? 'bg-indigo-700 text-white shadow-inner' : 'bg-indigo-600 text-white shadow-inner'
                          : theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      } transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                    >
                      All Stories
                    </button>
                    <button
                      onClick={() => setActiveFilter("published")}
                      className={`flex-1 py-3 px-4 text-sm font-medium ${
                        activeFilter === "published"
                          ? theme === 'dark' ? 'bg-indigo-700 text-white shadow-inner' : 'bg-indigo-600 text-white shadow-inner'
                          : theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      } transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                    >
                      Published
                    </button>
                    <button
                      onClick={() => setActiveFilter("drafts")}
                      className={`flex-1 py-3 px-4 text-sm font-medium ${
                        activeFilter === "drafts"
                          ? theme === 'dark' ? 'bg-indigo-700 text-white shadow-inner' : 'bg-indigo-600 text-white shadow-inner'
                          : theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      } transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                    >
                      Drafts
                    </button>
                  </div>

                  {/* Sort Dropdowns */}
                  <div className="flex items-center p-3 sm:p-2 border-t sm:border-t-0 sm:border-l border-gray-700/50">
                    <label htmlFor="sort-by" className={`text-sm font-medium mr-2 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Sort by:
                    </label>
                    <select
                      id="sort-by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "createdAt" | "title")}
                      className={`block w-full rounded-md border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-800'
                      } focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm`}
                    >
                      <option value="createdAt">Date Created</option>
                      <option value="title">Title</option>
                    </select>
                    <motion.button
                      whileHover={buttonHover}
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className={`ml-2 p-2 rounded-md ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors duration-200`}
                      title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
                    >
                      {sortOrder === "asc" ? (
                        <ArrowLongUpIcon className="w-5 h-5" />
                      ) : (
                        <ArrowLongDownIcon className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Story cards grid */}
                <motion.div
                  variants={containerVariants} // Stagger children for each story card
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {filteredStories.length > 0 ? (
                    <AnimatePresence> {/* For individual story card animations on filter change */}
                      {filteredStories.map((story) => (
                        <motion.div
                          key={story._id}
                          layout // Enable layout animation for smooth reordering/filtering
                          initial={{ opacity: 0, y: 50, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.8 }}
                          transition={{ duration: 0.3, type: "spring", stiffness: 100, damping: 15 }}
                        >
                          <StoryCard
                            _id={story._id}
                            title={story.title}
                            content={story.content}
                            imageUrl={story.imageUrl}
                            userId={story.userId || (session?.user?.id as string) || ""}
                            createdAt={story.createdAt}
                            status={story.published ? "published" : "draft"}
                            likes={story.likes}
                            comments={story.comments}
                            onDelete={handleDeleteStory}
                            onLike={handleLikeStory}
                            onComment={handleCommentStory}
                            formatDate={formatDate}
                            getExcerpt={getExcerpt}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <motion.div
                      key="no-filtered-stories"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`col-span-full rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-10 text-center shadow-sm`}
                    >
                      <p className={`mt-4 text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        No {activeFilter === 'published' ? 'published' : activeFilter === 'drafts' ? 'draft' : ''} stories found.
                      </p>
                      {activeFilter !== 'all' && (
                        <button
                          onClick={() => setActiveFilter('all')}
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                        >
                          Show All Stories
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* Create New Story Card - always visible */}
                  <motion.div variants={itemVariants}>
                    <Link
                      href="/write/new"
                      className={`block rounded-xl border-2 border-dashed p-8 text-center h-full flex flex-col justify-center items-center ${
                        theme === 'dark'
                          ? 'border-gray-700 hover:border-indigo-500/50 bg-gray-800 text-gray-300'
                          : 'border-gray-300 hover:border-indigo-500/50 bg-white text-gray-600'
                      } transition duration-300 ease-in-out hover:shadow-lg transform hover:scale-[1.01]`}
                    >
                      <PencilSquareIcon
                        className={`mx-auto h-14 w-14 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}
                      />
                      <p className={`mt-4 text-lg font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Create a new story
                      </p>
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}