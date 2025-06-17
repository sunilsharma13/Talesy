// app/profile/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface User {
  _id: string;
  name: string;
  bio?: string;
  avatar?: string;
  isFollowing?: boolean;
}

interface Writing {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  userId: string;
  createdAt: string;
  likes?: number;
  comments?: number;
}

export default function UserProfilePage() {
  const { id } = useParams();
  const userId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Writing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const isCurrentUser = session?.user?.id === userId;
  
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
        // Fetch user
        const userRes = await fetch(`/api/users/${userId}`);
        
        if (!userRes.ok) {
          throw new Error("Failed to load user profile");
        }
        
        const userData = await userRes.json();
        setUser(userData);
        
        // Fetch follow status if not the current user
        if (session?.user?.id && session.user.id !== userId) {
          const followRes = await fetch(`/api/users/${userId}/follow`);
          if (followRes.ok) {
            const followData = await followRes.json();
            setIsFollowing(followData.following);
          }
        }
        
        // Fetch user's public posts
        const postsRes = await fetch(`/api/posts?userId=${userId}&publishedOnly=true&sortOrder=latest`);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData);
        }
        
        // Fetch follower count for this user
        const followerRes = await fetch(`/api/users/${userId}/followers/count`);
        if (followerRes.ok) {
          const followerData = await followerRes.json();
          setFollowerCount(followerData.count);
        }
        
        // Fetch following count for this user
        const followingRes = await fetch(`/api/users/${userId}/following/count`);
        if (followingRes.ok) {
          const followingData = await followingRes.json();
          setFollowingCount(followingData.count);
        }
        
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId && status === "authenticated") {
      fetchProfile();
    }
  }, [userId, status, session]);
  
  const handleFollowToggle = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    setFollowLoading(true);
    
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
        
        // Update follower count
        setFollowerCount(prevCount => 
          data.following ? prevCount + 1 : Math.max(0, prevCount - 1)
        );
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Get excerpt from content
  const getExcerpt = (content: string, maxLength: number = 160) => {
    // Remove markdown formatting
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
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gray-700"></div>
            <div className="ml-4">
              <div className="h-6 bg-gray-700 rounded w-40 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-24"></div>
            </div>
          </div>
          <div className="h-16 bg-gray-700 rounded mb-8"></div>
          {[1, 2].map(i => (
            <div key={i} className="mb-6 bg-gray-800 rounded-xl p-5">
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-24 bg-gray-700 rounded mb-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="text-red-500 mb-4">{error || "User not found"}</div>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Profile header */}
<div className="bg-gray-800 rounded-2xl p-6 mb-8">
  <div className="flex flex-col md:flex-row md:items-center">
    <div className="flex items-center mb-4 md:mb-0">
      <img 
        src={user.avatar || "/logo.png"} 
        alt={user.name}
        className="w-20 h-20 rounded-full object-cover border-2 border-blue-600"
        onError={(e) => {
          e.currentTarget.src = "/logo.png";
        }}
      />
      <div className="ml-4">
        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
        <div className="flex items-center text-sm text-gray-400 mt-1">
          <span className="mr-3">{followerCount} Follower{followerCount !== 1 ? 's' : ''}</span>
          <span>{followingCount} Following</span>
        </div>
      </div>
    </div>
    
    <div className="flex-grow"></div>
    
    <div className="flex items-center">
      {isCurrentUser ? (
        <Link
          href="/profile/edit"
          className="px-4 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition"
        >
          Edit Profile
        </Link>
      ) : (
        <button
          onClick={handleFollowToggle}
          disabled={followLoading}
          className={`px-4 py-2 rounded-lg transition ${
            isFollowing 
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white" 
          }`}
        >
          {followLoading ? "Loading..." : isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  </div>
  
  {user.bio && (
    <div className="mt-4 text-gray-300">
      {user.bio}
    </div>
  )}
</div>
      {/* User's stories */}
      <h2 className="text-xl font-bold text-white mb-4">
        {isCurrentUser ? "Your Stories" : `${user.name}'s Stories`}
      </h2>
      
      {posts.length === 0 ? (
        <div className="text-center py-10 bg-gray-800 rounded-xl">
          <p className="text-gray-400">
            {isCurrentUser 
              ? "You haven't published any stories yet." 
              : "This user hasn't published any stories yet."}
          </p>
          {isCurrentUser && (
            <Link
              href="/write/new"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Write Your First Story
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <Link
              key={post._id}
              href={`/story/${post._id}`}
              className="block bg-gray-800 rounded-xl p-5 hover:bg-gray-750 transition"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
              <p className="text-gray-400 text-sm mb-2">{formatDate(post.createdAt)}</p>
              <p className="text-gray-300 line-clamp-2 mb-2">
                {getExcerpt(post.content)}
              </p>
              
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex items-center mr-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-1 text-red-500" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span>{post.likes || 0}</span>
                </div>
                <div className="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-1 text-blue-500" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span>{post.comments || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}