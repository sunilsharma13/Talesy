// src/homepage/HomeClient.tsx (FINAL & Comprehensive Update with Animations and UI Polish - Corrected Theme Naming and Type Error + Improved Responsive Design for 1256px issue)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from 'react-hot-toast';
import StoryCard from "@/components/StoryCard";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// Heroicons Import
import {
  BookOpenIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  ArrowLongUpIcon,
  ArrowLongDownIcon,
  AdjustmentsHorizontalIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

// Type Definitions (No change here, already good)
interface Author {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  email?: string;
  coverImage?: string;
  isFollowing?: boolean;
  followers?: number;
  followingCount?: number;
}

type Story = {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: Author;
  createdAt: string;
  likes?: number;
  comments?: number;
  status?: "draft" | "published";
  isLikedByCurrentUser?: boolean;
};

// Default Image Paths (Make sure these exist in your /public folder)
const DEFAULT_AVATAR = "/default-avatar.png";
const DEFAULT_STORY_IMAGE = "/default-story-image.png";
const DEFAULT_COVER_IMAGE = "/default-cover-image.png"; // Make sure this file exists in /public

// Animation Variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
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
      stiffness: 120,
      damping: 18,
    },
  },
};

const profileCardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 25,
      delay: 0.1,
    },
  },
};

const storyGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
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
  const [user, setUser] = useState<Author | null>(null);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  // Corrected theme state type and default
  const [theme, setTheme] = useState<"dark" | "light" | "talesy-accent">("dark");
  const [activeFilter, setActiveFilter] = useState<"all" | "published" | "drafts">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"createdAt" | "title">("createdAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Helper function to format date
  const formatDate = useCallback((dateString: string) => {
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

  // Helper function to get excerpt from content (handles HTML and Markdown)
  const getExcerpt = useCallback((content: string, maxLength: number = 160) => {
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

  // --- THEME MANAGEMENT ---
  // Get current theme from localStorage and apply as data-theme attribute
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    let initialTheme: "dark" | "light" | "talesy-accent" = "dark"; // Default theme

    if (savedTheme === "light") {
      initialTheme = "light";
    } else if (savedTheme === "dark") {
      initialTheme = "dark";
    } else if (savedTheme === "talesy-accent") {
      initialTheme = "talesy-accent";
    }

    setTheme(initialTheme); // Set the validated theme
    document.documentElement.setAttribute('data-theme', initialTheme); // Apply to HTML
    localStorage.setItem("theme", initialTheme); // Ensure localStorage always has a valid theme
  }, []);
  // --- END THEME MANAGEMENT ---

  // Helper function to get theme-dependent CSS variables
  const getDynamicThemeClass = (prop: string) => `var(--${prop})`;

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
            setUser({
              _id: userData.user._id || currentUserId,
              name: userData.user.name || "",
              avatar: userData.user.avatar || DEFAULT_AVATAR,
              bio: userData.user.bio || "",
              email: userData.user.email || "",
              coverImage: userData.user.coverImage || "",
              followers: userData.user.followersCount || 0,
              followingCount: userData.user.followingCount || 0,
            });
            setFollowerCount(userData.user.followersCount || 0);
            setFollowingCount(userData.user.followingCount || 0);

            // Fetch user's stories
            const storiesRes = await fetch(`/api/posts/user/${currentUserId}`);
            if (storiesRes.ok) {
              const storiesData: Story[] = await storiesRes.json();
              console.log("Fetched stories:", storiesData);
              setAllStories(storiesData);
            } else {
              console.error("Failed to fetch stories:", storiesRes.status, storiesRes.statusText);
              const errorBody = await storiesRes.text();
              console.error("Stories API Error Response:", errorBody);
              toast.error("Failed to load your stories.");
            }
          } else {
            console.error("Failed to fetch user profile:", userRes.status, userRes.statusText);
            const errorBody = await userRes.text();
            console.error("Profile API Error Response:", errorBody);
            toast.error("Failed to load user profile.");
            setUser(null);
          }
        } catch (error) {
          console.error("Error loading profile or stories:", error);
          toast.error("An unexpected error occurred while loading data.");
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
      tempStories = tempStories.filter((story) => story.status === "published");
    } else if (activeFilter === "drafts") {
      tempStories = tempStories.filter((story) => story.status === "draft");
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
    if (confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
      try {
        const res = await fetch(`/api/posts/${storyId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setAllStories(prevStories => prevStories.filter(story => story._id !== storyId));
          toast.success("Story deleted successfully!");
        } else {
          const errorData = await res.json();
          toast.error(`Failed to delete story: ${errorData.message || res.statusText}`);
        }
      } catch (error) {
        console.error("Error deleting story:", error);
        toast.error("An error occurred while deleting the story.");
      }
    }
  }, []);

  const handleLikeStory = useCallback(async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) {
      toast.error("You need to be logged in to like stories!");
      router.push('/login');
      return;
    }
    try {
      const res = await fetch(`/api/posts/${storyId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorBody = await res.text();
        let errorMessage = `Failed to like story: ${res.statusText}`;
        try {
          const errorData = JSON.parse(errorBody);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.warn("Failed to parse error response as JSON:", parseError);
          errorMessage = `Failed to like story: ${res.statusText}. Response: ${errorBody.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setAllStories(prevStories =>
        prevStories.map(story =>
          story._id === storyId ? {
            ...story,
            likes: data.likesCount,
            isLikedByCurrentUser: data.liked
          } : story
        )
      );
      toast.success(data.liked ? "Story liked!" : "Like removed!");

    } catch (error) {
      console.error("Error liking story:", error);
      toast.error(`Failed to update like status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [session?.user?.id, router]);

  const handleCommentStory = useCallback((storyId: string) => {
    router.push(`/story/${storyId}?openComments=true`);
  }, [router]);

  const handleEditStory = useCallback((storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/write/${storyId}`);
  }, [router]);

  const handleFollowToggle = useCallback(async (userId: string, isCurrentlyFollowing: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Attempting to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user ${userId}`);
  }, []);


  if (status === "loading" || loadingData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: getDynamicThemeClass('background-primary') }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"> {/* Added padding for skeleton */}
          <div className="animate-pulse flex flex-col lg:flex-row gap-8"> {/* Changed md:flex-row to lg:flex-row */}
            {/* Profile section skeleton */}
            <div
              className={`rounded-xl p-6 w-full lg:w-1/4`}
              style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}
            >
              <div className="h-48 w-full rounded-t-lg" style={{ backgroundColor: getDynamicThemeClass('border-color') }}></div>
              <div className="flex justify-center -mt-20 mb-4">
                <div
                  className="w-36 h-36 rounded-full border-4"
                  style={{ backgroundColor: getDynamicThemeClass('text-secondary'), borderColor: getDynamicThemeClass('background-primary') }}
                ></div>
              </div>
              <div className="h-8 rounded w-3/4 mx-auto mb-3" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
              <div className="h-4 rounded w-1/2 mx-auto mb-6" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
              <div className="h-4 rounded w-11/12 mx-auto mb-2" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
              <div className="h-4 rounded w-10/12 mx-auto mb-6" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
              <div
                className="flex justify-center space-x-8 border-t border-b py-4 px-2"
                style={{ borderColor: getDynamicThemeClass('border-color') }}
              >
                <div className="h-8 w-1/4 rounded" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
                <div className="h-8 w-1/4 rounded" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
                <div className="h-8 w-1/4 rounded" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
              </div>
              <div className="h-10 rounded-full w-2/3 mx-auto mt-6" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
              <div className="mt-8 space-y-3">
                <div className="h-8 rounded" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
                <div className="h-8 rounded" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
                <div className="h-8 rounded" style={{ backgroundColor: getDynamicThemeClass('text-secondary') }}></div>
              </div>
            </div>

            {/* Stories section skeleton */}
            <div className="w-full lg:w-3/4"> {/* Changed md:w-2/3 to w-full, added lg:w-3/4 */}
              <div
                className={`h-10 rounded w-1/3 mb-6`}
                style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}
              ></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"> {/* Removed lg:grid-cols-2 */}
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={`rounded-xl p-5 h-64`}
                    style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user && status === "authenticated" && !loadingData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          backgroundColor: getDynamicThemeClass('background-primary'),
          color: getDynamicThemeClass('text-primary'),
        }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: getDynamicThemeClass('red-color') }}>Error Loading Profile</h2>
          <p className="mb-6" style={{ color: getDynamicThemeClass('text-secondary') }}>Failed to load your profile data. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg transition-colors"
            style={{
              backgroundColor: getDynamicThemeClass('accent-color'),
              color: getDynamicThemeClass('active-text'),
              // Hover effects will need to be handled via CSS classes or CSS modules
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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      // Main container background based on theme
      style={{ backgroundColor: getDynamicThemeClass('background-primary') }}
    >
      {/* Changed md:flex-row to lg:flex-row. This is the crucial change. */}
      {/* Now, on medium screens, profile and stories will stack (flex-col by default). */}
      {/* They will go side-by-side only on large screens (1024px and up). */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Profile section */}
        <motion.div
          variants={profileCardVariants}
          // Responsive width and sticky behavior:
          // w-full on small and medium screens (stacked)
          // lg:w-1/4 on large screens (side-by-side)
          // md:sticky, md:top-10, md:self-start are also changed to lg:sticky etc.
          // This means sticky behavior also kicks in only on large screens when side-by-side.
          className="w-full lg:w-1/4 lg:sticky lg:top-10 lg:self-start"
        >
          <div
            className={`rounded-xl shadow-lg relative overflow-hidden transform transition-all duration-300 hover:shadow-xl`}
            style={{ backgroundColor: getDynamicThemeClass('background-secondary') }} // Profile card background
          >
            {/* Cover image container */}
            <div className="h-48 w-full relative">
              {user?.coverImage ? (
                <Image
                  src={user.coverImage}
                  alt="Cover"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-t-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_COVER_IMAGE;
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center text-center p-4"
                  style={{ backgroundColor: getDynamicThemeClass('border-color') }} // Default cover background
                >
                  <Image
                    src={DEFAULT_COVER_IMAGE} // Your actual default cover image
                    alt="Default Cover"
                    width={80}
                    height={80}
                    className="opacity-50 mb-2"
                  />
                  <p className="text-sm italic" style={{ color: getDynamicThemeClass('text-secondary') }}>Add a cover image</p>
                </div>
              )}
              {/* This gradient overlay can remain, it's typically dark on dark/light themes */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>

            {/* Profile picture */}
            <div className="flex justify-center -mt-20 z-10 relative">
              <motion.img
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 10, delay: 0.3 }}
                src={user?.avatar || DEFAULT_AVATAR}
                alt={user?.name || "User Avatar"}
                className="w-36 h-36 rounded-full border-4 object-cover shadow-lg transform transition-transform duration-300 hover:scale-105"
                // Avatar border and background
                style={{ borderColor: getDynamicThemeClass('background-primary'), backgroundColor: getDynamicThemeClass('background-primary') }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_AVATAR;
                }}
              />
            </div>

            {/* User info - Adjusted for better spacing and animation */}
            <div className="text-center px-6 py-4 relative z-20 -mt-16">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className={`text-3xl sm:text-4xl font-extrabold mb-1 pt-16
                  bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text
                  drop-shadow-lg`}
              // Keeping the gradient for name as it's a stylistic choice, not theme-dependent background
              >
                {user?.name}
              </motion.h2>
              {user?.email && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                  className="text-sm mb-3 w-fit mx-auto break-all"
                  style={{ color: getDynamicThemeClass('text-secondary') }}
                >
                  {user.email}
                </motion.p>
              )}

              {user?.bio && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
                  className={`mt-2 text-md mb-6`}
                  style={{ color: getDynamicThemeClass('text-primary') }}
                >
                  {user.bio}
                </motion.p>
              )}

              {/* Stats - NOW CLICKABLE and with icon */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`flex justify-around items-center border-y py-4 px-2`}
                style={{ borderColor: getDynamicThemeClass('border-color') }}
              >
                {/* Stories Count - Added Icon */}
                <motion.div variants={statItemVariants} className="text-center flex flex-col items-center">
                  <BookOpenIcon className={`w-5 h-5 mb-1`} style={{ color: getDynamicThemeClass('text-secondary') }} />
                  <div className={`text-xl font-bold`} style={{ color: getDynamicThemeClass('accent-color') }}>
                    {allStories.length}
                  </div>
                  <div className="text-xs" style={{ color: getDynamicThemeClass('text-secondary') }}>Stories</div>
                </motion.div>

                <motion.div variants={statItemVariants} className="text-center">
                  {user?._id && (
                    <Link
                      href={`/profile/${user._id}/followers`}
                      // Underline classes removed. Only group-hover:text-[var(--accent-color)] remains
                      className="group cursor-pointer flex flex-col items-center"
                    >
                      <UserGroupIcon
                        className={`w-5 h-5 mb-1 group-hover:text-[var(--accent-color)] transition-colors`}
                        style={{ color: getDynamicThemeClass('text-secondary') }}
                      />
                      <div
                        className={`text-xl font-bold group-hover:text-[var(--accent-color)] transition-colors`}
                        style={{ color: getDynamicThemeClass('text-primary') }}
                      >
                        {followerCount}
                      </div>
                      <div
                        className="text-xs group-hover:text-[var(--accent-color)] transition-colors"
                        style={{ color: getDynamicThemeClass('text-secondary') }}
                      >
                        Followers
                      </div>
                    </Link>
                  )}
                  {!user?._id && (
                    <div className="text-center flex flex-col items-center">
                      <UserGroupIcon
                        className={`w-5 h-5 mb-1`}
                        style={{ color: getDynamicThemeClass('text-secondary') }}
                      />
                      <div
                        className="text-xl font-bold"
                        style={{ color: getDynamicThemeClass('text-primary') }}
                      >
                        {followerCount}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: getDynamicThemeClass('text-secondary') }}
                      >
                        Followers
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div variants={statItemVariants} className="text-center">
                  {user?._id && (
                    <Link
                      href={`/profile/${user._id}/following`}
                      // Underline classes removed. Only group-hover:text-[var(--accent-color)] remains
                      className="group cursor-pointer flex flex-col items-center"
                    >
                      <UserGroupIcon
                        className={`w-5 h-5 mb-1 group-hover:text-[var(--accent-color)] transition-colors`}
                        style={{ color: getDynamicThemeClass('text-secondary') }}
                      />
                      <div
                        className={`text-xl font-bold group-hover:text-[var(--accent-color)] transition-colors`}
                        style={{ color: getDynamicThemeClass('text-primary') }}
                      >
                        {followingCount}
                      </div>
                      <div
                        className="text-xs group-hover:text-[var(--accent-color)] transition-colors"
                        style={{ color: getDynamicThemeClass('text-secondary') }}
                      >
                        Following
                      </div>
                    </Link>
                  )}
                  {!user?._id && (
                    <div className="text-center flex flex-col items-center">
                      <UserGroupIcon
                        className={`w-5 h-5 mb-1`}
                        style={{ color: getDynamicThemeClass('text-secondary') }}
                      />
                      <div
                        className="text-xl font-bold"
                        style={{ color: getDynamicThemeClass('text-primary') }}
                      >
                        {followingCount}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: getDynamicThemeClass('text-secondary') }}
                      >
                        Following
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
                className="mt-6 mb-4"
              >
                <Link
                  href="/settings"
                  className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm transition duration-300 ease-in-out transform hover:scale-105`}
                  style={{
                    backgroundColor: getDynamicThemeClass('accent-color'),
                    color: getDynamicThemeClass('active-text'),
                    // Hover effects will need to be handled via CSS classes or CSS modules
                  }}
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2 -ml-1" />
                  Edit Profile
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Quick Links section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
            className={`mt-6 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl`}
            style={{ backgroundColor: getDynamicThemeClass('background-secondary') }} // Quick links card background
          >
            <div className={`px-6 py-4 border-b`} style={{ borderColor: getDynamicThemeClass('border-color') }}>
              <h3 className={`text-xl font-semibold`} style={{ color: getDynamicThemeClass('text-primary') }}>
                Quick Actions
              </h3>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                <motion.li variants={itemVariants}>
                  <Link
                    href="/write/new"
                    className={`flex items-center px-4 py-3 rounded-lg transition duration-200 transform hover:translate-x-1`}
                    style={{
                      color: getDynamicThemeClass('accent-color'), // Hover background needs CSS class or module
                      // Make sure you have appropriate CSS for hover on this Link component
                      // For example, in global.css: .hover-bg-theme:hover { background-color: var(--hover-bg); }
                      // And then add className="hover-bg-theme"
                    }}
                  >
                    <PencilSquareIcon className="w-5 h-5 mr-3" />
                    Write New Story
                  </Link>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <Link
                    href="/dashboard"
                    className={`flex items-center px-4 py-3 rounded-lg transition duration-200 transform hover:translate-x-1`}
                    style={{
                      color: getDynamicThemeClass('accent-color'), // Hover background needs CSS class or module
                    }}
                  >
                    <Squares2X2Icon className="w-5 h-5 mr-3" />
                    Dashboard
                  </Link>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <Link
                    href="/explore"
                    className={`flex items-center px-4 py-3 rounded-lg transition duration-200 transform hover:translate-x-1`}
                    style={{
                      color: getDynamicThemeClass('accent-color'), // Hover background needs CSS class or module
                    }}
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
        <div className="w-full lg:w-3/4"> {/* Changed md:w-2/3 to w-full, added lg:w-3/4 */}
          <motion.h2
            variants={itemVariants}
            className={`text-3xl font-extrabold mb-6`}
            style={{ color: getDynamicThemeClass('text-primary') }}
          >
            Your Stories
          </motion.h2>

          <AnimatePresence mode="wait">
            {allStories.length === 0 && !loadingData ? (
              <motion.div
                key="no-stories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`rounded-xl border p-10 text-center shadow-sm`}
                style={{
                  backgroundColor: getDynamicThemeClass('background-secondary'),
                  borderColor: getDynamicThemeClass('border-color'),
                }}
              >
                <BookOpenIcon className="mx-auto h-16 w-16 mb-4" style={{ color: getDynamicThemeClass('text-secondary') }} />
                <p className={`mt-4 text-lg font-medium`} style={{ color: getDynamicThemeClass('text-primary') }}>
                  You haven't published any stories yet. Start writing your first masterpiece!
                </p>
                <Link
                  href="/write/new"
                  className="mt-6 inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-md text-white transition duration-300 ease-in-out transform hover:scale-105"
                  style={{
                    backgroundColor: getDynamicThemeClass('accent-color'),
                    color: getDynamicThemeClass('active-text'),
                    // Hover effects will need to be handled via CSS classes or CSS modules
                  }}
                >
                  <PencilSquareIcon className="w-5 h-5 mr-2" />
                  Start Writing
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="stories-content"
                variants={storyGridVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-6"
              >
                {/* Filter and Sort options */}
                <motion.div
                  variants={itemVariants}
                  className={`flex flex-col sm:flex-row rounded-lg overflow-hidden border shadow-sm`}
                  style={{
                    backgroundColor: getDynamicThemeClass('background-secondary'),
                    borderColor: getDynamicThemeClass('border-color'),
                  }}
                >
                  {/* Filter Tabs */}
                  <div className={`flex flex-1 border-b sm:border-b-0 sm:border-r`} style={{ borderColor: getDynamicThemeClass('border-color') }}>
                    <button
                      onClick={() => setActiveFilter("all")}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:z-10`}
                      style={{
                        backgroundColor: activeFilter === "all" ? getDynamicThemeClass('accent-color') : getDynamicThemeClass('background-secondary'),
                        color: activeFilter === "all" ? getDynamicThemeClass('active-text') : getDynamicThemeClass('text-primary'),
                        boxShadow: activeFilter === "all" ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' : 'none',
                        outlineColor: getDynamicThemeClass('accent-color'),
                      }}
                    >
                      All Stories ({allStories.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter("published")}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:z-10`}
                      style={{
                        backgroundColor: activeFilter === "published" ? getDynamicThemeClass('accent-color') : getDynamicThemeClass('background-secondary'),
                        color: activeFilter === "published" ? getDynamicThemeClass('active-text') : getDynamicThemeClass('text-primary'),
                        boxShadow: activeFilter === "published" ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' : 'none',
                        outlineColor: getDynamicThemeClass('accent-color'),
                      }}
                    >
                      Published ({allStories.filter(s => s.status === 'published').length})
                    </button>
                    <button
                      onClick={() => setActiveFilter("drafts")}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:z-10`}
                      style={{
                        backgroundColor: activeFilter === "drafts" ? getDynamicThemeClass('accent-color') : getDynamicThemeClass('background-secondary'),
                        color: activeFilter === "drafts" ? getDynamicThemeClass('active-text') : getDynamicThemeClass('text-primary'),
                        boxShadow: activeFilter === "drafts" ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' : 'none',
                        outlineColor: getDynamicThemeClass('accent-color'),
                      }}
                    >
                      Drafts ({allStories.filter(s => s.status === 'draft').length})
                    </button>
                  </div>

                  {/* Sort Dropdowns */}
                  <div className={`flex items-center p-3 sm:p-2 border-t sm:border-t-0 sm:border-l`} style={{ borderColor: getDynamicThemeClass('border-color') }}>
                    <label htmlFor="sort-by" className={`text-sm font-medium mr-2 whitespace-nowrap`} style={{ color: getDynamicThemeClass('text-primary') }}>
                      Sort by:
                    </label>
                    <select
                      id="sort-by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "createdAt" | "title")}
                      className={`block w-full rounded-md border shadow-sm`}
                      style={{
                        backgroundColor: getDynamicThemeClass('background-secondary'),
                        borderColor: getDynamicThemeClass('border-color'),
                        color: getDynamicThemeClass('text-primary'),
                        outlineColor: getDynamicThemeClass('accent-color'),
                      }}
                    >
                      <option value="createdAt">Date Created</option>
                      <option value="title">Title</option>
                    </select>
                    <motion.button
                      whileHover={buttonHover}
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="ml-2 p-2 rounded-md transition-colors"
                      style={{
                        backgroundColor: getDynamicThemeClass('background-secondary'),
                        color: getDynamicThemeClass('text-primary'),
                        borderColor: getDynamicThemeClass('border-color'),
                      }}
                    >
                      {sortOrder === "asc" ? (
                        <ArrowLongUpIcon className="w-5 h-5" />
                      ) : (
                        <ArrowLongDownIcon className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Story Grid */}
                {/* Changed lg:grid-cols-2 to just sm:grid-cols-2. */}
                {/* Now it will be 1 column on extra-small, 2 columns on small and up. */}
                {/* Since the profile sidebar only appears on 'lg' screens, the stories section */}
                {/* will have full width on 'md' screens and can comfortably fit 2 columns. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {filteredStories.map((story) => (
                      <motion.div
                        key={story._id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        <StoryCard
                          {...story}
                          onDelete={handleDeleteStory}
                          onLike={handleLikeStory}
                          onComment={handleCommentStory}
                          onEdit={handleEditStory}
                          formatDate={formatDate}
                          getExcerpt={getExcerpt}
                          currentUserId={session?.user?.id || ''}
                          defaultStoryImage={DEFAULT_STORY_IMAGE}
                          defaultAvatar={DEFAULT_AVATAR}
                          theme={theme}
                          showOwnerActions={true}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {filteredStories.length === 0 && (
                  <motion.div
                    key="no-filtered-stories"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl border p-10 text-center shadow-sm`}
                    style={{
                      backgroundColor: getDynamicThemeClass('background-secondary'),
                      borderColor: getDynamicThemeClass('border-color'),
                    }}
                  >
                    <p className={`mt-4 text-lg font-medium`} style={{ color: getDynamicThemeClass('text-primary') }}>
                      No stories found for the current filter.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}