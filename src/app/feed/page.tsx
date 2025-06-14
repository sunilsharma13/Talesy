"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from 'react-hot-toast';
import StoryCard from "@/components/StoryCard";


interface User {
  _id: string;
  name: string;
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
  status?: "draft" | "published";
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<Writing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");
  const [userCache, setUserCache] = useState<Record<string, User>>({});
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const endpoint = activeTab === "forYou"
          ? "/api/posts?publishedOnly=true&sortOrder=latest&limit=10"
          : "/api/posts?publishedOnly=true&sortOrder=latest&limit=10&following=true";

        const res = await fetch(endpoint);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Feed fetch failed:", res.status, errorText);
          setPosts([]);
          return;
        }

        const data = await res.json();
        setPosts(data);

        // Extract unique user IDs to fetch their info
        const userIds: string[] = [];

        // Collect unique user IDs, ensuring they're strings
        data.forEach((post: any) => {
          if (post.userId && typeof post.userId === 'string' && !userIds.includes(post.userId)) {
            userIds.push(post.userId);
          }
        });

        // Fetch user details for posts without Promise.all
        for (const userId of userIds) {
          // Skip if we already have this user's info cached
          if (userCache[userId]) continue;

          try {
            // Fetch user profile
            const userRes = await fetch(`/api/users/${userId}`);
            if (userRes.ok) {
              const userData = await userRes.json();

              // Check follow status if not the current user
              if (session?.user?.id && userId !== session.user.id) {
                const followRes = await fetch(`/api/users/${userId}/follow`);
                if (followRes.ok) {
                  const followData = await followRes.json();
                  userData.isFollowing = followData.following;
                }
              }

              setUserCache(prev => ({
                ...prev,
                [userId]: userData
              }));
            }
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
          }
        }
      } catch (error) {
        console.error("Error fetching feed:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchPosts();
    }
  }, [status, activeTab]);

  // Handle follow/unfollow
  // app/feed/page.tsx (just the handleFollowToggle function)

  const handleFollowToggle = async (userId: string, e: React.MouseEvent) => {
    // Prevent navigation to the story
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push('/login');
      return;
    }

    // Don't allow following yourself
    if (userId === session.user.id) return;

    setFollowLoading(userId);

    try {
      console.log("Sending follow request for user:", userId);
      // Make sure this URL exactly matches your API route structure
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Follow response:", data);

        // Update user cache with new follow status
        setUserCache(prev => {
          const updatedCache = { ...prev };
          if (updatedCache[userId]) {
            updatedCache[userId] = {
              ...updatedCache[userId],
              isFollowing: data.following
            };
          }
          return updatedCache;
        });

        // If we're on the following tab and unfollowed, remove this post
        if (activeTab === "following" && !data.following) {
          setPosts(prev => prev.filter(post => post.userId !== userId));
        }
      } else {
        const errorText = await res.text();
        console.error("Failed to follow/unfollow. Status:", res.status, "Error:", errorText);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(null);
    }
  };
  // Handle like
  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  
    if (!session?.user) {
      router.push('/login');
      return;
    }
  
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (res.ok) {
        const data = await res.json();
        console.log("Like response:", data);
      } else {
        console.error("Failed to like:", await res.text());
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error("Failed to Like Post.");
    }
  };
  
  // Handle comment click
  const handleCommentClick = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Comment button clicked for post:", postId);

    // Navigate to story page with comment section open
    router.push(`/story/${postId}?openComments=true`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);

    // If less than 24 hours ago, show relative time
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
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

  // Get user info
  const getUserInfo = (userId: string) => {
    if (userCache[userId]) {
      return userCache[userId];
    }

    // Return fallback if user data not found
    return {
      _id: userId,
      name: "Unknown User",
      avatar: "/default-avatar.png",
      isFollowing: false
    };
  };

  if (status === "loading") {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-10 bg-gray-700 rounded-full w-full mb-8"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-6 bg-gray-800 rounded-2xl p-5">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-700 rounded w-16 mt-2"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              <div className="h-40 bg-gray-700 rounded-xl mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Stories</h1>

      {/* Tab Navigation */}
      <div className="flex mb-8 bg-gray-800 rounded-full p-1">
        <button
          onClick={() => setActiveTab("forYou")}
          className={`flex-1 py-2 px-4 rounded-full text-center transition-all ${activeTab === "forYou"
            ? "bg-blue-600 text-white font-medium"
            : "text-gray-400 hover:text-white"
            }`}
        >
          For You
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-2 px-4 rounded-full text-center transition-all ${activeTab === "following"
            ? "bg-blue-600 text-white font-medium"
            : "text-gray-400 hover:text-white"
            }`}
        >
          Following
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-6 bg-gray-800 rounded-2xl p-5">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-700 rounded w-16 mt-2"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              <div className="h-40 bg-gray-700 rounded-xl mt-4"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {activeTab === "forYou"
              ? "No stories found"
              : "No stories from people you follow"
            }
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {activeTab === "forYou"
              ? "Be the first to share your story with the world."
              : "Follow some authors to see their stories here."
            }
          </p>
          <button
            onClick={() => router.push("/write/new")}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors duration-200"
          >
            Write a Story
          </button>
        </div>
      ) : (
        <div className="space-y-6">

          {posts.map((post) => {
            // Ensure userId is a string
            const userIdStr = typeof post.userId === 'string' ? post.userId : String(post.userId);
            const user = getUserInfo(userIdStr);
            const isCurrentUser = session?.user?.id === userIdStr;

            return (

            
            <StoryCard
              key={post._id}
              _id={post._id}
              title={post.title}
              content={post.content}
              imageUrl={post.imageUrl}
              userId={post.userId}
              createdAt={post.createdAt}
              likes={post.likes}
              comments={post.comments}
              status={post.status}
            />
            
           
            );
          })}
        </div>
      )}
    </div>
  );
}