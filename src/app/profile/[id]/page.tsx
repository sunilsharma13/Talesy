// app/profile/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion"; // Make sure this is imported if you use it
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from 'next/image';
import { UserPlusIcon, UserMinusIcon, PencilSquareIcon, HeartIcon, ChatBubbleOvalLeftIcon, AdjustmentsHorizontalIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'; // For liked state

// User interface (ensure this matches your backend User model)
interface User {
  _id: string;
  name: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  isFollowing?: boolean;
  followers?: number;
  followingCount?: number;
}

// Writing interface (ensure this matches your backend Post/Writing model)
interface Writing {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  isLiked?: boolean; // Added for current user's like status
}

const DEFAULT_AVATAR = "/default-avatar.png";
const DEFAULT_COVER_IMAGE = "/default-cover-image.png";

export default function UserProfilePage() {
  const { id } = useParams();
  const userId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Writing[]>([]); // This will now include isLiked
  const [isLoading, setIsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isCurrentUser = session?.user?.id === userId;

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Fetch user data
        const userRes = await fetch(`/api/users/${userId}`);
        if (!userRes.ok) {
          const errorData = await userRes.json();
          throw new Error(errorData.error || "Failed to load user profile");
        }
        const userData: User = await userRes.json();
        setUser(userData);
        setIsFollowing(userData.isFollowing ?? false);
        setFollowerCount(userData.followers ?? 0);
        setFollowingCount(userData.followingCount ?? 0);

        // Fetch user's posts - IMPORTANT: Modify your API to return `isLiked` for current user!
        // Your /api/posts endpoint should check if the current logged-in user has liked each post.
        const postsRes = await fetch(`/api/posts?userId=${userId}&publishedOnly=true&sortOrder=latest`, {
          headers: {
            // If your API needs authorization for isLiked status, pass it here
            'Authorization': `Bearer ${session?.accessToken || ''}` // Assuming next-auth provides accessToken
          }
        });
        if (!postsRes.ok) {
          console.error("Failed to fetch user's posts");
          setPosts([]);
        } else {
          const postsData: Writing[] = await postsRes.json();
          setPosts(postsData);
        }

      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to load profile");
        toast.error(err.message || "Failed to load profile");
        setUser(null);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch profile only if userId is available and session status is not loading or unauthenticated
    if (userId && status !== "unauthenticated" && status !== "loading") {
      fetchProfile();
    }
  }, [userId, status, session?.accessToken]); // Added session.accessToken to dependency array

  const handleFollowToggle = async () => {
    if (!session?.user) {
      toast.error("Log in to follow writers!");
      router.push('/login');
      return;
    }

    if (isCurrentUser) {
      toast.error("You cannot follow/unfollow yourself!");
      return;
    }

    setFollowLoading(true);
    const prevIsFollowing = isFollowing;
    const prevFollowerCount = followerCount;

    setIsFollowing(prev => !prev);
    setFollowerCount(prev => prevIsFollowing ? Math.max(0, prev - 1) : prev + 1);

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken || ''}` // Ensure auth header if required
        },
        body: JSON.stringify({ targetUserId: userId }) // Example body, adjust as per your API
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followers);
        setFollowingCount(data.followingCount);
        toast.success(data.message);
      } else {
        setIsFollowing(prevIsFollowing);
        setFollowerCount(prevFollowerCount);
        const errorData = await res.json();
        toast.error(errorData.message || `Failed to ${prevIsFollowing ? 'unfollow' : 'follow'}.`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowing(prevIsFollowing);
      setFollowerCount(prevFollowerCount);
      toast.error(`Network error: Failed to ${prevIsFollowing ? 'unfollow' : 'follow'}.`);
    } finally {
      setFollowLoading(false);
    }
  };

  // --- NEW: Handle Like Toggle for Posts ---
  const handleLikeToggle = async (
    e: React.MouseEvent<HTMLButtonElement>, // Event type for button click
    postId: string,
    currentIsLiked: boolean
  ) => {
    e.preventDefault(); // IMPORTANT: Prevent the Link from navigating!
    e.stopPropagation(); // Stop event from bubbling up to the Link

    if (!session?.user) {
      toast.error("Log in to like stories!");
      router.push('/login');
      return;
    }

    // Optimistic UI update
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId
          ? {
              ...post,
              isLiked: !currentIsLiked,
              likes: currentIsLiked ? Math.max(0, (post.likes || 0) - 1) : (post.likes || 0) + 1,
            }
          : post
      )
    );

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST', // Or PUT/DELETE based on your API design
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken || ''}` // Auth header needed
        },
        // body: JSON.stringify({ userId: session.user.id }) // Might not need body for toggle
      });

      if (!res.ok) {
        // Revert UI on error
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? {
                  ...post,
                  isLiked: currentIsLiked, // Revert to original state
                  likes: currentIsLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1), // Revert count
                }
              : post
          )
        );
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${currentIsLiked ? 'unlike' : 'like'} story.`);
      }

      const data = await res.json();
      // Optionally update with fresh data from backend if it sends updated counts/status
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, isLiked: data.isLiked, likes: data.likes }
            : post
        )
      );
      toast.success(data.message || `Story ${currentIsLiked ? 'unliked' : 'liked'}!`);
    } catch (err: any) {
      console.error("Error toggling like:", err);
      toast.error(err.message);
    }
  };

  const handleCommentClick = (e: React.MouseEvent<HTMLButtonElement>, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Option 1: Redirect to story page with a hash/query param to open comments
    router.push(`/story/${postId}#comments`);
    // Option 2: Open a modal for commenting (requires building a modal component)
    // console.log(`Open comment modal for post: ${postId}`);
    // showCommentModal(postId);
  };


  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getExcerpt = (content: string, maxLength: number = 160) => {
    const plainText = content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/#+\s(.*?)(?:\n|$)/g, "$1 ")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/!\[(.*?)\]\(.*?\)/g, "");
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  };


  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] flex items-center justify-center p-6">
        <div className="w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden bg-[var(--background-secondary)] border border-[var(--border-color)] animate-fade-in-up">
          {/* Cover Image Placeholder */}
          <div className="relative h-48 w-full bg-[var(--hover-bg)] animate-shimmer">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--border-color)]/20 to-transparent"></div>
          </div>
          {/* Avatar & Info Placeholder */}
          <div className="p-6 relative -mt-20 flex flex-col items-center md:items-start md:flex-row md:justify-between">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[var(--background-secondary)] shadow-lg bg-[var(--hover-bg)] animate-shimmer relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--border-color)]/20 to-transparent"></div>
            </div>
            <div className="mt-4 md:mt-10 md:ml-6 text-center md:text-left flex-grow w-full md:w-auto">
              <div className="h-8 rounded w-2/3 mx-auto md:mx-0 mb-3 bg-[var(--hover-bg)] animate-shimmer"></div>
              <div className="h-5 rounded w-full mb-2 bg-[var(--hover-bg)] animate-shimmer"></div>
              <div className="h-5 rounded w-3/4 mx-auto md:mx-0 mb-4 bg-[var(--hover-bg)] animate-shimmer"></div>
              <div className="flex items-center justify-center md:justify-start text-sm mt-3">
                <div className="h-4 rounded w-24 mr-3 bg-[var(--hover-bg)] animate-shimmer"></div>
                <div className="h-4 rounded w-20 bg-[var(--hover-bg)] animate-shimmer"></div>
              </div>
            </div>
            <div className="mt-6 md:mt-10 w-full md:w-auto flex justify-center md:justify-end">
              <div className="h-10 w-32 rounded-lg bg-[var(--hover-bg)] animate-shimmer"></div>
            </div>
          </div>
          {/* Posts Placeholder */}
          <div className="p-6 pt-0 mt-8 md:mt-0">
            <div className="h-6 rounded w-1/3 mb-5 pb-3 bg-[var(--hover-bg)] animate-shimmer"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-6 bg-[var(--background-secondary)] border border-[var(--border-color)] animate-fade-in">
                  <div className="h-6 rounded w-3/4 mb-2 bg-[var(--hover-bg)] animate-shimmer"></div>
                  <div className="h-4 rounded w-1/2 mb-3 bg-[var(--hover-bg)] animate-shimmer"></div>
                  <div className="h-20 rounded mb-4 bg-[var(--hover-bg)] animate-shimmer"></div>
                  <div className="flex space-x-4">
                    <div className="h-4 w-16 rounded bg-[var(--hover-bg)] animate-shimmer"></div>
                    <div className="h-4 w-16 rounded bg-[var(--hover-bg)] animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 animate-fade-in-up">
        <div className="text-xl font-bold mb-4 text-[var(--error-text)]">{error || "User not found"}</div>
        <p className="mb-6 text-[var(--text-secondary)] text-center">
          Could not load the profile. Please check the user ID or try again later.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-[var(--accent-color)] text-[var(--active-text)] rounded-lg hover:bg-[var(--accent-color)]/90 transition-all duration-300 shadow-lg active:scale-95"
        >
          Go to Feed
        </button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] py-10 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
      <div className="max-w-3xl mx-auto rounded-2xl shadow-xl overflow-hidden bg-[var(--background-secondary)] border border-[var(--border-color)]">

        {/* --- Cover Image Section --- */}
        <div className="relative h-48 w-full bg-[var(--border-color)] flex items-center justify-center overflow-hidden">
          {user.coverImage ? (
            <Image
              src={user.coverImage}
              alt={`${user.name}'s Cover`}
              fill
              priority
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = DEFAULT_COVER_IMAGE;
              }}
            />
          ) : (
            <div className="text-[var(--text-secondary)] text-sm italic flex flex-col items-center">
              <Image
                src={DEFAULT_COVER_IMAGE}
                alt="Default Cover"
                width={80}
                height={80}
                className="opacity-50 mb-2"
              />
              No cover image
            </div>
          )}
        </div>

        {/* --- Profile Info Section --- */}
        <div className="p-6 relative -mt-8 flex flex-col items-center md:items-start md:flex-row md:justify-between">
          <div className="flex flex-col items-center md:flex-row md:items-start z-10 w-full md:w-auto">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[var(--background-secondary)] shadow-lg relative shrink-0 transform transition-transform duration-300 hover:scale-105">
              <Image
                src={user.avatar || DEFAULT_AVATAR}
                alt={user.name + "'s Avatar"}
                fill
                priority
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_AVATAR;
                }}
              />
            </div>
            {/* Name, Bio, Follower Counts */}
            <div className="mt-4 md:mt-10 md:ml-6 text-center md:text-left flex-grow">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                {user.name}
              </h1>
              {user.bio && (
                <p className="mt-2 text-md leading-relaxed text-[var(--text-secondary)]">
                  {user.bio}
                </p>
              )}
              <div className="flex items-center text-sm mt-3 text-[var(--text-secondary)] justify-center md:justify-start space-x-4">
                <Link href={`/profile/${userId}/followers`} className="hover:text-[var(--accent-color)] transition-colors duration-200">
                  <span className="font-semibold">{followerCount}</span> Follower{followerCount !== 1 ? 's' : ''}
                </Link>
                <Link href={`/profile/${userId}/following`} className="hover:text-[var(--accent-color)] transition-colors duration-200">
                  <span className="font-semibold">{followingCount}</span> Following
                </Link>
              </div>
            </div>
          </div>

          {/* Follow/Edit Button */}
          <div className="mt-6 md:mt-10 w-full md:w-auto flex justify-center md:justify-end">
            {isCurrentUser ? (
              // EDIT PROFILE BUTTON
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
                className="mt-6 md:mt-0"
              >
                <Link
                  href="/settings"
                  className="px-5 py-2.5 rounded-lg font-medium transition duration-200 shadow-md flex items-center justify-center active:scale-95
                             bg-[var(--accent-color)] text-[var(--active-text)] hover:bg-[var(--accent-color)]/90"
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5 inline-block mr-2" /> Edit Profile
                </Link>
              </motion.div>
            ) : (
              // FOLLOW / UNFOLLOW BUTTON
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`relative overflow-hidden px-5 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md flex items-center justify-center group
                  ${followLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}
                  ${isFollowing
                    ? "border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                    : "bg-[var(--accent-color)] text-[var(--active-text)] hover:bg-[var(--accent-color)]/90"
                  }`}
              >
                {followLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    {isFollowing ? (
                      <>
                        <UserMinusIcon className="w-5 h-5 inline-block mr-2" />
                        <span className="hidden group-hover:inline-block">Unfollow</span>
                        <span className="inline-block group-hover:hidden">Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="w-5 h-5 inline-block mr-2" /> Follow
                      </>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* --- User's Stories Section --- */}
        <div className="p-6 pt-0 mt-8 md:mt-0">
          <h2 className="text-2xl font-bold mb-5 pb-3 border-b border-[var(--border-color)] text-[var(--text-primary)] animate-fade-in-up">
            {isCurrentUser ? "Your Stories" : `${user.name}'s Stories`}
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-12 rounded-xl shadow-md bg-[var(--background-secondary)] border border-[var(--border-color)] animate-scale-in">
              <p className="text-lg mb-6 text-[var(--text-secondary)]">
                {isCurrentUser
                  ? "You haven't published any stories yet."
                  : "This user hasn't published any stories yet."}
              </p>
              {isCurrentUser && (
                <Link
                  href="/write/new"
                  className="inline-block px-6 py-3 font-semibold rounded-lg transition-all duration-200 shadow-md bg-[var(--accent-color)] text-[var(--active-text)] hover:bg-[var(--accent-color)]/90 active:scale-95"
                >
                  Write Your First Story
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map(post => (
                <Link
                  key={post._id}
                  href={`/story/${post._id}`}
                  className="block rounded-xl p-6 transition-all duration-200 shadow-md transform hover:-translate-y-1 hover:shadow-lg bg-[var(--background-secondary)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] animate-fade-in-up"
                  style={{ animationDelay: `${posts.indexOf(post) * 0.1}s` }}
                >
                  <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">{post.title}</h3>
                  <p className="text-sm mb-3 text-[var(--text-secondary)]">{formatDate(post.createdAt)}</p>
                  <p className="line-clamp-3 mb-4 leading-relaxed text-[var(--text-secondary)]">
                    {getExcerpt(post.content)}
                  </p>

                  <div className="flex items-center text-sm text-[var(--text-secondary)] space-x-4">
                    {/* Like Button */}
                    <button
                      onClick={(e) => handleLikeToggle(e, post._id, post.isLiked || false)}
                      className="flex items-center p-2 -ml-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors duration-200 active:scale-95"
                      aria-label={post.isLiked ? "Unlike story" : "Like story"}
                    >
                      {post.isLiked ? (
                        <HeartSolidIcon className="h-5 w-5 mr-1 text-[var(--red-color)]" />
                      ) : (
                        <HeartIcon className="h-5 w-5 mr-1 text-[var(--red-color)]" />
                      )}
                      <span>{post.likes || 0}</span>
                    </button>

                    {/* Comment Button */}
                    <button
                      onClick={(e) => handleCommentClick(e, post._id)}
                      className="flex items-center p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors duration-200 active:scale-95"
                      aria-label="View comments"
                    >
                      <ChatBubbleOvalLeftIcon className="h-5 w-5 mr-1 text-[var(--accent-color)]" />
                      <span>{post.comments || 0}</span>
                    </button>

                    {/* Optional: Bookmark Button */}
                    {/* You'd need a handleBookmarkToggle function and isBookmarked state for this */}
                    {/* <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.success("Bookmark clicked!"); }}
                      className="flex items-center p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors duration-200 active:scale-95"
                      aria-label="Bookmark story"
                    >
                      <BookmarkIcon className="h-5 w-5 mr-1 text-[var(--text-secondary)]" />
                    </button> */}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}