// app/profile/[id]/followers/FollowersClient.tsx
"use client"; // This file MUST be a client component

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlusIcon, UserMinusIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

// Type Definitions (Ensure these match your backend API responses)
type UserProfile = {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean;
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
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
      damping: 20,
    },
  },
};

// Define props for this Client component
interface FollowersClientProps {
  profileUserId: string; // Now directly passed as a prop
}

export default function FollowersClient({ profileUserId }: FollowersClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  const fetchFollowers = useCallback(async () => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (!profileUserId) { // profileUserId is now a prop, ensure it's not empty
      setError("User ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/${profileUserId}/followers`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to fetch followers: ${res.statusText}`);
      }
      const data = await res.json();
      setFollowers(data);
    } catch (err) {
      console.error("Error fetching followers:", err);
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [profileUserId, router, status]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  const handleFollowToggle = async (targetUserId: string, currentStatus: boolean) => {
    if (session?.user?.id === targetUserId) {
      alert("You cannot follow/unfollow yourself.");
      return;
    }
    if (status !== "authenticated") {
        alert("Please log in to follow/unfollow users.");
        router.push("/login");
        return;
    }

    try {
      const method = currentStatus ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update follow status.");
      }

      setFollowers(prevFollowers =>
        prevFollowers.map(follower =>
          follower._id === targetUserId
            ? { ...follower, isFollowing: !currentStatus }
            : follower
        )
      );

    } catch (err) {
      console.error("Error toggling follow status:", err);
      alert((err as Error).message || "An error occurred while updating follow status.");
    }
  };


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className={`flex items-center mb-6 animate-pulse ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          <div className={`h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} mr-3`}></div>
          <div className={`h-8 w-48 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex items-center p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm animate-pulse`}>
              <div className={`w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} mr-4`}></div>
              <div className="flex-1">
                <div className={`h-5 w-3/4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} mb-2`}></div>
                <div className={`h-4 w-1/2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
              <div className={`h-9 w-24 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p className={`text-xl ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Error: {error}</p>
        <button
          onClick={() => fetchFollowers()}
          className="mt-4 inline-block text-indigo-500 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className={`flex items-center mb-8 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
        <button
          onClick={() => router.back()}
          className={`mr-3 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition`}
          title="Go back"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold">Followers</h1>
      </motion.div>

      {followers.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className={`rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-10 text-center shadow-sm`}
        >
          <p className={`mt-4 text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            No followers found for this user yet.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {followers.map((follower) => (
            <motion.div
              key={follower._id}
              variants={itemVariants}
              className={`flex items-center justify-between p-4 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} transition-colors duration-200`}
            >
              <Link href={`/profile/${follower._id}`} className="flex items-center flex-grow min-w-0">
                <img
                  src={follower.avatar || "/default-avatar.png"}
                  alt={follower.name}
                  className="w-12 h-12 rounded-full object-cover mr-4 border border-gray-600"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/default-avatar.png";
                  }}
                />
                <div className="flex flex-col min-w-0">
                  <h2 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'} truncate`}>{follower.name}</h2>
                  {follower.bio && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>{follower.bio}</p>
                  )}
                </div>
              </Link>
              {session?.user?.id !== follower._id && (
                <button
                  onClick={() => handleFollowToggle(follower._id, follower.isFollowing || false)}
                  className={`ml-4 px-4 py-2 rounded-full text-sm font-medium transition duration-200
                    ${follower.isFollowing
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    } flex items-center justify-center`}
                >
                  {follower.isFollowing ? (
                    <>
                      <UserMinusIcon className="w-4 h-4 mr-1" /> Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-4 h-4 mr-1" /> Follow
                    </>
                  )}
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}