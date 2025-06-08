"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      console.log("Sending like request for post:", postId);
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("Like response:", data);
        
        // Update like count in the posts state
        setPosts(prev => 
          prev.map(post => 
            post._id === postId 
              ? { ...post, likes: data.count } 
              : post
          )
        );
      } else {
        console.error("Failed to like:", await res.text());
      }
    } catch (error) {
      console.error('Error liking post:', error);
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
          className={`flex-1 py-2 px-4 rounded-full text-center transition-all ${
            activeTab === "forYou"
              ? "bg-blue-600 text-white font-medium"
              : "text-gray-400 hover:text-white"
          }`}
        >
          For You
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-2 px-4 rounded-full text-center transition-all ${
            activeTab === "following"
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
              <div
                key={post._id}
                className="bg-gray-800 border border-gray-700 rounded-2xl shadow-md hover:shadow-lg hover:border-gray-600 transition duration-200"
              >
                <div className="p-5">
                  {/* Author info with follow button */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Link 
                        href={`/profile/${userIdStr}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={user.avatar || "/default-avatar.png"}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-700"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/default-avatar.png";
                          }}
                        />
                        <div className="ml-3">
                          <p className="font-medium text-white hover:underline">{user.name}</p>
                          <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
                        </div>
                      </Link>
                    </div>
                    
                    {!isCurrentUser && (
                      <button
                        type="button" 
                        onClick={(e) => handleFollowToggle(userIdStr, e)}
                        disabled={followLoading === userIdStr}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          user.isFollowing
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        } ${followLoading === userIdStr ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {followLoading === userIdStr ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {user.isFollowing ? "Unfollowing" : "Following"}
                          </span>
                        ) : (
                          <span>{user.isFollowing ? "Following" : "Follow"}</span>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Content section */}
                  <div>
                    {/* Title and content - Clickable to story */}
                    <Link href={`/story/${post._id}`} className="block">
                      <h2 className="text-xl font-semibold text-white mb-2">{post.title}</h2>
                      <p className="text-gray-300 mb-4 line-clamp-3">
                        {getExcerpt(post.content)}
                      </p>
                      
                      {/* Image */}
                      {post.imageUrl && (
                        <div className="mb-4">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-48 object-cover rounded-xl border border-gray-700"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder-image.jpg";
                              target.classList.add("hidden");
                            }}
                          />
                        </div>
                      )}
                    </Link>
                    
                    {/* Stats - NON-CLICKABLE */}
                    <div className="flex items-center text-sm text-gray-400 mt-2">
                      {/* Like button */}
                      <button 
                        type="button"
                        onClick={(e) => handleLike(post._id, e)}
                        className="flex items-center hover:text-white transition-colors"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-4 w-4 mr-1 text-red-500" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        <span>{post.likes || 0}</span>
                      </button>
                      
                      {/* Comment button */}
                      <button 
                        type="button"
                        onClick={(e) => handleCommentClick(post._id, e)}
                        className="flex items-center ml-4 hover:text-white transition-colors"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-4 w-4 mr-1 text-blue-500" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        <span>{post.comments || 0}</span>
                      </button>
                      
                      <div className="flex items-center ml-4">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-4 w-4 mr-1" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        <span>{post.content.split(/\s+/).length} words</span>
                      </div>
                      
                      <Link href={`/story/${post._id}`} className="ml-auto">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}