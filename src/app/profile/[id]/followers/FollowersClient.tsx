// app/profile/[id]/followers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { ArrowLeftIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline'; // Outline icons for general state

// User interface (should match your User model from backend)
interface User {
  _id: string;
  name: string;
  bio?: string;
  avatar?: string;
  isFollowing?: boolean; // If your API indicates if current user follows this person (from backend)
}

const DEFAULT_AVATAR = "/default-avatar.png"; // Path in your public folder

export default function UserFollowersPage() {
  const { id } = useParams();
  // Ensure userId is always a string, handling potential array cases
  const userId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  const router = useRouter();
  const { data: session, status } = useSession();
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("User");

  // --- Theme Management ---
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
    if (status === "loading") return; // Wait for session status to be determined

    if (status === "unauthenticated") {
      toast.error("You need to be logged in to view this page.");
      router.push("/login");
      return;
    }

    if (!userId) {
      setLoading(false);
      setError("User ID is missing.");
      return;
    }

    const fetchFollowers = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch the user's name
        const userRes = await fetch(`/api/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${session?.accessToken}` } // Pass accessToken
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserName(userData.name || "User");
        } else {
          // If fetching user name fails, still try to load followers
          console.warn("Could not fetch user name for ID:", userId);
        }

        // Fetch the followers list - Make sure your backend provides `isFollowing` for each follower
        // This 'isFollowing' should indicate if the *current logged-in user* is following *this specific follower*
        const res = await fetch(`/api/users/${userId}/followers`, {
          headers: { 'Authorization': `Bearer ${session?.accessToken}` } // Pass accessToken
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch followers.");
        }
        const data: User[] = await res.json();
        setFollowers(data);
      } catch (err: any) {
        console.error("Error fetching followers:", err);
        setError(err.message || "Failed to load followers.");
        toast.error(err.message || "Failed to load followers.");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [userId, router, status, session?.accessToken]); // Add session.accessToken to dependencies

  const handleFollowToggle = async (targetUserId: string, currentIsFollowing: boolean) => {
    if (status !== "authenticated" || !session?.user) {
      toast.error("Please log in to follow/unfollow users.");
      router.push('/login');
      return;
    }
    if (session.user.id === targetUserId) {
      toast.error("You cannot follow/unfollow yourself!");
      return;
    }

    // Optimistic UI update
    const originalFollowers = [...followers];
    setFollowers(prev => prev.map(f =>
      f._id === targetUserId ? { ...f, isFollowing: !currentIsFollowing } : f
    ));

    try {
      // Send accessToken with the request
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ userId: session.user.id }), // Backend might need current user ID
      });

      if (!res.ok) {
        setFollowers(originalFollowers); // Revert on error
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${currentIsFollowing ? 'unfollow' : 'follow'}.`);
      }
      
      const data = await res.json(); // Backend should return updated isFollowing status
      setFollowers(prev => prev.map(f =>
        f._id === targetUserId ? { ...f, isFollowing: data.isFollowing } : f
      ));
      toast.success(data.message || `Successfully ${currentIsFollowing ? 'unfollowed' : 'followed'}.`);
    } catch (err: any) {
      console.error("Error toggling follow:", err);
      toast.error(err.message);
      setFollowers(originalFollowers); // Revert on error
    }
  };

  // --- Loading State Skeleton (with shimmer) ---
  if (loading || status === "loading") { // Also show loading if session is loading
    return (
      <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl bg-[var(--background-secondary)] rounded-2xl shadow-xl p-6 border border-[var(--border-color)] animate-fade-in-up">
          <div className="flex items-center mb-6 pb-4 border-b border-[var(--border-color)]">
            <div className="w-8 h-8 rounded-full bg-[var(--hover-bg)] mr-3 animate-shimmer"></div>
            <div className="h-8 bg-[var(--hover-bg)] rounded w-1/2 animate-shimmer"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-4 p-4 rounded-xl bg-[var(--border-color)] animate-shimmer">
                <div className="w-14 h-14 rounded-full bg-[var(--hover-bg)] shrink-0"></div>
                <div className="flex-1">
                  <div className="h-5 bg-[var(--hover-bg)] rounded w-3/4 mb-1"></div>
                  <div className="h-4 bg-[var(--hover-bg)] rounded w-1/2"></div>
                </div>
                <div className="h-10 w-24 rounded-lg bg-[var(--hover-bg)] shrink-0"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 animate-fade-in-up">
        <div className="text-xl font-bold mb-4 text-[var(--error-text)]">{error}</div>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-[var(--accent-color)] text-[var(--active-text)] rounded-lg hover:bg-[var(--accent-color)]/90 transition-all duration-200 shadow-lg active:animate-button-press"
        >
          Go Back
        </button>
      </div>
    );
  }

  // --- Main Followers Content ---
  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] py-10 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
      <div className="max-w-xl mx-auto bg-[var(--background-secondary)] rounded-2xl shadow-xl p-6 border border-[var(--border-color)]">
        {/* Header with back button */}
        <div className="flex items-center mb-6 pb-4 border-b border-[var(--border-color)]">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors duration-200 mr-3 text-[var(--text-secondary)] active:animate-button-press"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {userName}&apos;s Followers
          </h1>
        </div>

        {followers.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-secondary)] animate-scale-in">
            <p className="text-lg">
              {userId === session?.user?.id ? "You don't have any followers yet." : `${userName} doesn't have any followers yet.`}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {followers.map((follower, index) => (
              <li key={follower._id}>
                <div
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-[var(--hover-bg)] transition-colors duration-200 border border-[var(--border-color)] animate-slide-in-right"
                  style={{ animationDelay: `${index * 0.05}s` }} // Staggered animation
                >
                  <Link
                    href={`/profile/${follower._id}`}
                    className="flex items-center flex-grow group"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden mr-4 relative shrink-0 border border-[var(--border-color)] group-hover:scale-105 transition-transform duration-200">
                      <Image
                        src={follower.avatar || DEFAULT_AVATAR}
                        alt={follower.name || "User Avatar"}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_AVATAR;
                        }}
                      />
                    </div>
                    <div className="flex-grow">
                      <h2 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors duration-200">{follower.name}</h2>
                      {follower.bio && (
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-1">{follower.bio}</p>
                      )}
                    </div>
                  </Link>

                  {/* Follow/Unfollow Button */}
                  {session?.user?.id && session.user.id !== follower._id && (
                    <button
                      onClick={() => handleFollowToggle(follower._id, follower.isFollowing || false)}
                      className={`ml-4 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm shrink-0 flex items-center justify-center space-x-1 whitespace-nowrap active:animate-button-press ${
                        follower.isFollowing
                          ? "border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                          : "bg-[var(--accent-color)] text-[var(--active-text)] hover:bg-[var(--accent-color)]/90"
                      }`}
                    >
                      {follower.isFollowing ? (
                        <>
                          <UserMinusIcon className="w-4 h-4" />
                          <span>Unfollow</span>
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="w-4 h-4" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}