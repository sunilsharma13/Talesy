"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type User = {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
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
  user?: {
    name: string;
    avatar?: string;
  };
};

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [users, setUsers] = useState<User[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "people" | "stories">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const searchContent = async () => {
      setLoading(true);
      try {
        // Search for users
        const usersRes = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const usersData = await usersRes.json();
        setUsers(usersData);

        // Search for stories
        const storiesRes = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`);
        const storiesData = await storiesRes.json();
        setStories(storiesData);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    searchContent();
  }, [query]);

  // Format date for story display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get excerpt from content
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

  const displayedUsers = activeTab === "all" ? users.slice(0, 3) : users;
  const displayedStories = activeTab === "all" ? stories.slice(0, 3) : stories;

  if (!query) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold text-white mb-4">Search</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Enter a search term in the search box above to find users and stories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Search Results</h1>
        <p className="text-gray-400">
          Showing results for "{query}"
        </p>
      </div>

      {/* Tabs for filtering results */}
      <div className="flex mb-8 bg-gray-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 px-4 text-center transition-colors ${
            activeTab === "all"
              ? "bg-indigo-600 text-white font-medium"
              : "text-gray-400 hover:text-white"
          }`}
        >
          All Results
        </button>
        <button
          onClick={() => setActiveTab("people")}
          className={`flex-1 py-3 px-4 text-center transition-colors ${
            activeTab === "people"
              ? "bg-indigo-600 text-white font-medium"
              : "text-gray-400 hover:text-white"
          }`}
        >
          People ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("stories")}
          className={`flex-1 py-3 px-4 text-center transition-colors ${
            activeTab === "stories"
              ? "bg-indigo-600 text-white font-medium"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Stories ({stories.length})
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-6 bg-gray-800 rounded-xl p-5">
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-10 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {/* People/Users Section */}
          {(activeTab === "all" || activeTab === "people") && (
            <div className="mb-10">
              {activeTab === "all" && users.length > 0 && (
                <div className="flex justify-between items-baseline mb-4">
                  <h2 className="text-2xl font-semibold text-white">People</h2>
                  {users.length > 3 && (
                    <button 
                      onClick={() => setActiveTab("people")}
                      className="text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      View all ({users.length})
                    </button>
                  )}
                </div>
              )}

              {users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedUsers.map(user => (
                    <Link 
                      href={`/profile/${user._id}`}
                      key={user._id} 
                      className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-300"
                    >
                      <div className="p-5">
                        <div className="flex items-center mb-4">
                          <img
                            src={user.avatar || "/default-avatar.png"}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover border border-gray-700"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/default-avatar.png";
                            }}
                          />
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-white">{user.name}</h3>
                          </div>
                        </div>
                        
                        {user.bio && (
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {user.bio}
                          </p>
                        )}
                        
                        <div className="mt-4 text-indigo-400 text-sm flex items-center">
                          <span>View profile</span>
                          <svg
                            className="h-4 w-4 ml-1"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
                  <p className="text-gray-400">
                    No users found matching "{query}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stories Section */}
          {(activeTab === "all" || activeTab === "stories") && (
            <div>
              {activeTab === "all" && stories.length > 0 && (
                <div className="flex justify-between items-baseline mb-4">
                  <h2 className="text-2xl font-semibold text-white">Stories</h2>
                  {stories.length > 3 && (
                    <button 
                      onClick={() => setActiveTab("stories")}
                      className="text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      View all ({stories.length})
                    </button>
                  )}
                </div>
              )}

              {stories.length > 0 ? (
                <div className="space-y-6">
                  {displayedStories.map(story => (
                    <div 
                      key={story._id} 
                      className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-600 transition-all duration-300"
                    >
                      <div className="p-5">
                        <div className="flex justify-between mb-3">
                          <div className="flex items-center">
                            <Link 
                              href={`/profile/${story.userId}`} 
                              className="flex items-center hover:opacity-90"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img
                                src={story.user?.avatar || "/default-avatar.png"}
                                alt={story.user?.name || "User"}
                                className="w-8 h-8 rounded-full object-cover border border-gray-700"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/default-avatar.png";
                                }}
                              />
                              <span className="ml-2 text-sm font-medium text-gray-300">
                                {story.user?.name || "Unknown User"}
                              </span>
                            </Link>
                          </div>
                          <span className="text-gray-400 text-xs">
                            {formatDate(story.createdAt)}
                          </span>
                        </div>

                        <Link href={`/story/${story._id}`} className="block">
                          <h3 className="text-xl font-medium text-white mb-2 hover:underline">
                            {story.title}
                          </h3>
                          <p className="text-gray-400 mb-4 line-clamp-2">
                            {getExcerpt(story.content)}
                          </p>
                        </Link>

                        <div className="flex items-center text-sm text-gray-500">
                          <div className="flex items-center">
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
                            <span>{story.likes || 0}</span>
                          </div>

                          <div className="flex items-center ml-4">
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
                            <span>{story.comments || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
                  <p className="text-gray-400">
                    No stories found matching "{query}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}