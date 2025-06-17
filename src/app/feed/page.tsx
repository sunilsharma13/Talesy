// app/feed/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from 'react-hot-toast';

// Update the User interface to include followers
interface User {
  _id: string;
  name: string;
  avatar?: string;
  isFollowing?: boolean;
  followers?: number;
  followingCount?: number;
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
  const [likeLoading, setLikeLoading] = useState<string | null>(null);
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
                  userData.followers = followData.followers;         // Store follower count
                  userData.followingCount = followData.followingCount; // Store following count
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
  }, [status, activeTab, session?.user?.id]);

  // Handle follow/unfollow
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

        // Update user cache with new follow status and follower count
        setUserCache(prev => {
          const updatedCache = { ...prev };
          if (updatedCache[userId]) {
            updatedCache[userId] = {
              ...updatedCache[userId],
              isFollowing: data.following,
              followers: data.followers,
              followingCount: data.followingCount
            };
          }
          return updatedCache;
        });

        // If we're on the following tab and unfollowed, remove this post
        if (activeTab === "following" && !data.following) {
          setPosts(prev => prev.filter(post => post.userId !== userId));
        }

        toast.success(data.following ? "Followed successfully!" : "Unfollowed successfully!");
      } else {
        const errorText = await res.text();
        console.error("Failed to follow/unfollow. Status:", res.status, "Error:", errorText);
        toast.error("Failed to update follow status");
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error("Something went wrong");
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

    if (likeLoading === postId) return;
    setLikeLoading(postId);

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

        // Update the posts with the new like count
        setPosts(prev =>
          prev.map(post =>
            post._id === postId
              ? {
                ...post,
                likes: data.liked
                  ? (post.likes || 0) + 1
                  : Math.max((post.likes || 0) - 1, 0)
              }
              : post
          )
        );

        if (data.liked) {
          toast.success("Story liked!");
        } else {
          toast.success("Like removed!");
        }
      } else {
        const errorText = await res.text();
        console.error("Failed to like:", errorText);
        toast.error("Failed to update like status");
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error("Failed to Like Post.");
    } finally {
      setLikeLoading(null);
    }
  };

  // Handle comment click
  const handleCommentClick = (postId: string) => {
    router.push(`/story/${postId}?openComments=true`);
  };

  // Handle story deletion (dummy function as we don't allow deletion from feed)
  const handleDelete = async (id: string, imageUrl?: string): Promise<void> => {
    // In the feed, we typically don't allow deletion
    toast.error("Deletion from feed is not allowed");
    return Promise.resolve();
  };

  // Format date
  const formatDate = (dateString: string): string => {
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
  const getExcerpt = (content: string, maxLength: number = 160): string => {
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
      isFollowing: false,
      followers: 0,
      followingCount: 0
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
              <div key={post._id} className="bg-gray-800 border border-gray-700/50 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl shadow-lg">
                {/* Author information */}
                <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/profile/${userIdStr}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden cursor-pointer"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || "User"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/logo.png";
                          }}
                        />
                      ) : (
                        <img 
                          src="/logo.png" 
                          alt="Talesy Logo"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </Link>
                    <div>
                      <Link
                        href={`/profile/${userIdStr}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-white hover:text-indigo-300 transition-colors"
                      >
                        {user?.name || "Unknown User"}
                      </Link>
                      <p className="text-gray-400 text-xs flex items-center gap-2">
                        <span>{formatDate(post.createdAt)}</span>
                        {user?.followers !== undefined && (
                          <>
                            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                            <span>{user.followers} follower{user.followers !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {!isCurrentUser && (
                    <button
                      onClick={(e) => handleFollowToggle(userIdStr, e)}
                      disabled={followLoading === userIdStr}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${user?.isFollowing
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                    >
                      {followLoading === userIdStr ? (
                        <span className="flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                      ) : user?.isFollowing ? (
                        "Following"
                      ) : (
                        "Follow"
                      )}
                    </button>
                  )}
                </div>

                {/* Post content */}
                <Link href={`/story/${post._id}`}>
                  <div className="relative">
                    {post.imageUrl && (
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder-image.jpg";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-3 hover:text-indigo-300 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-gray-300 line-clamp-3 text-sm mb-4">
                      {getExcerpt(post.content)}
                    </p>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCommentClick(post._id);
                        }}
                        className="text-gray-400 hover:text-blue-400 transition flex items-center gap-1 text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {post.comments || 0} comments
                      </button>

                      <div className="flex gap-2 items-center">
                        <button
                          disabled={likeLoading === post._id}
                          onClick={(e) => handleLike(post._id, e)}
                          title="Like"
                          className="flex items-center justify-center p-1.5 rounded-full text-white bg-gray-700 hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {likeLoading === post._id ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              <span className="ml-1">{post.likes || 0}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}