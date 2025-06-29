// app/search/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from 'next/image'; // Import Image component for better optimization
import { HeartIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline'; // Outline icons
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'; // Solid heart for liked state

// Default images for robustness
const DEFAULT_AVATAR = "/default-avatar.png";

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
  isLiked?: boolean; // Added for current user's like status
  user?: { // Ensure this user object comes from your backend /api/posts/search
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

  // --- Theme Management (same as profile page) ---
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
    if (!query) {
      setUsers([]);
      setStories([]);
      setLoading(false);
      return;
    }

    const searchContent = async () => {
      setLoading(true);
      try {
        // Search for users
        const usersRes = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        const usersData = await usersRes.json();
        setUsers(usersData);

        // Search for stories (Ensure your /api/posts/search also includes 'user' object and 'isLiked' if needed)
        const storiesRes = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`);
        if (!storiesRes.ok) throw new Error('Failed to fetch stories');
        const storiesData = await storiesRes.json();
        setStories(storiesData);
      } catch (error) {
        console.error("Search failed:", error);
        // Optionally show a toast error here
      } finally {
        setLoading(false);
      }
    };

    const debounceSearch = setTimeout(() => {
      searchContent();
    }, 300); // Debounce search to avoid too many requests

    return () => clearTimeout(debounceSearch); // Cleanup debounce on unmount or query change

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
      .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
      .replace(/_(.*?)_/g, "$1")     // Italic
      .replace(/#+\s(.*?)(?:\n|$)/g, "$1 ") // Headers
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // Links
      .replace(/!\[(.*?)\]\(.*?\)/g, ""); // Images
      
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  };

  const displayedUsers = activeTab === "all" ? users.slice(0, 3) : users;
  const displayedStories = activeTab === "all" ? stories.slice(0, 3) : stories;

  // --- Render logic ---
  if (!query) {
    return (
      <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] flex items-center justify-center p-6 animate-fade-in">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold mb-4">Search</h1>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            Enter a search term in the search box above to find users and stories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] py-10 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Results</h1>
          <p className="text-[var(--text-secondary)]">
            Showing results for "<span className="font-semibold text-[var(--accent-color)]">{query}</span>"
          </p>
        </div>

        {/* Tabs for filtering results */}
        <div className="flex mb-8 rounded-xl overflow-hidden shadow-md bg-[var(--background-secondary)] border border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-3 px-4 text-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] ${
              activeTab === "all"
                ? "bg-[var(--accent-color)] text-[var(--active-text)] font-medium"
                : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setActiveTab("people")}
            className={`flex-1 py-3 px-4 text-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] ${
              activeTab === "people"
                ? "bg-[var(--accent-color)] text-[var(--active-text)] font-medium"
                : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            People ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("stories")}
            className={`flex-1 py-3 px-4 text-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] ${
              activeTab === "stories"
                ? "bg-[var(--accent-color)] text-[var(--active-text)] font-medium"
                : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
            }`}
          >
            Stories ({stories.length})
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl p-6 bg-[var(--background-secondary)] border border-[var(--border-color)]">
                <div className="h-6 bg-[var(--hover-bg)] rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-[var(--hover-bg)] rounded w-1/2 mb-2"></div>
                <div className="h-20 bg-[var(--hover-bg)] rounded w-full"></div>
                <div className="flex space-x-4 mt-4">
                  <div className="h-4 w-16 rounded bg-[var(--hover-bg)]"></div>
                  <div className="h-4 w-16 rounded bg-[var(--hover-bg)]"></div>
                </div>
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
                    <h2 className="text-2xl font-semibold">People</h2>
                    {users.length > 3 && (
                      <button 
                        onClick={() => setActiveTab("people")}
                        className="text-[var(--accent-color)] hover:text-[var(--accent-color)]/80 text-sm transition-colors duration-200"
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
                        className="bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-md 
                                   hover:border-[var(--accent-color)] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <div className="p-5">
                          <div className="flex items-center mb-4">
                            <Image
                              src={user.avatar || DEFAULT_AVATAR}
                              alt={user.name}
                              width={48} // Tailwind w-12 is 48px
                              height={48} // Tailwind h-12 is 48px
                              className="rounded-full object-cover border-2 border-[var(--border-color)]"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = DEFAULT_AVATAR; // Fallback image if original fails
                              }}
                            />
                            <div className="ml-3">
                              <h3 className="text-lg font-medium text-[var(--text-primary)]">{user.name}</h3>
                            </div>
                          </div>
                          
                          {user.bio && (
                            <p className="text-[var(--text-secondary)] text-sm line-clamp-2">
                              {user.bio}
                            </p>
                          )}
                          
                          <div className="mt-4 text-[var(--accent-color)] text-sm flex items-center hover:underline">
                            <span>View profile</span>
                            <svg
                              className="h-4 w-4 ml-1 transform transition-transform duration-200 group-hover:translate-x-1"
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
                  <div className="bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-xl p-8 text-center shadow-md">
                    <p className="text-[var(--text-secondary)]">
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
                    <h2 className="text-2xl font-semibold">Stories</h2>
                    {stories.length > 3 && (
                      <button 
                        onClick={() => setActiveTab("stories")}
                        className="text-[var(--accent-color)] hover:text-[var(--accent-color)]/80 text-sm transition-colors duration-200"
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
                        className="bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-xl shadow-md 
                                   hover:shadow-lg hover:border-[var(--accent-color)] transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <div className="p-5">
                          {/* Story Author and Date */}
                          <div className="flex justify-between items-center mb-3">
                            <Link 
                              href={`/profile/${story.userId}`} 
                              className="flex items-center hover:opacity-80 transition-opacity duration-200"
                              // Prevent click on this link from triggering parent link (story card)
                              onClick={(e) => e.stopPropagation()} 
                            >
                              <Image
                                src={story.user?.avatar || DEFAULT_AVATAR}
                                alt={story.user?.name || "User"}
                                width={32} // Tailwind w-8 is 32px
                                height={32} // Tailwind h-8 is 32px
                                className="rounded-full object-cover border-2 border-[var(--border-color)]"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = DEFAULT_AVATAR;
                                }}
                              />
                              <span className="ml-2 text-sm font-medium text-[var(--text-primary)]">
                                {story.user?.name || "Unknown User"}
                              </span>
                            </Link>
                            <span className="text-[var(--text-secondary)] text-xs">
                              {formatDate(story.createdAt)}
                            </span>
                          </div>

                          {/* Story Title and Excerpt - wrapped in Link */}
                          <Link href={`/story/${story._id}`} className="block mt-2 mb-4">
                            <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2 hover:underline">
                              {story.title}
                            </h3>
                            <p className="text-[var(--text-secondary)] line-clamp-2">
                              {getExcerpt(story.content)}
                            </p>
                          </Link>

                          {/* Likes and Comments */}
                          <div className="flex items-center text-sm text-[var(--text-secondary)] space-x-4 mt-4 pt-4 border-t border-[var(--border-color)]">
                            {/* Like Button (Placeholder for interactivity, actual function needed) */}
                            <button
                               onClick={(e) => { // Example placeholder for actual like functionality
                                 e.preventDefault(); 
                                 e.stopPropagation(); 
                                 alert(`Like/Unlike story: ${story.title}`);
                                 // Implement actual like toggle logic here (API call, state update)
                               }}
                               className="flex items-center p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors duration-200 active:scale-95"
                            >
                              {story.isLiked ? ( // Use isLiked from your story data
                                <HeartSolidIcon className="h-5 w-5 mr-1 text-[var(--red-color)]" />
                              ) : (
                                <HeartIcon className="h-5 w-5 mr-1 text-[var(--red-color)]" />
                              )}
                              <span>{story.likes || 0}</span>
                            </button>

                            {/* Comment Button (Placeholder for interactivity, actual function needed) */}
                            <button
                               onClick={(e) => { // Example placeholder for actual comment functionality
                                 e.preventDefault(); 
                                 e.stopPropagation(); 
                                 alert(`View comments for story: ${story.title}`);
                                 // Redirect to story page with comments section or open a modal
                               }}
                               className="flex items-center p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors duration-200 active:scale-95"
                            >
                              <ChatBubbleOvalLeftIcon className="h-5 w-5 mr-1 text-[var(--accent-color)]" />
                              <span>{story.comments || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-xl p-8 text-center shadow-md">
                    <p className="text-[var(--text-secondary)]">
                      No stories found matching "{query}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* If no results found for either tab */}
            {activeTab === "all" && users.length === 0 && stories.length === 0 && (
                <div className="bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-xl p-8 text-center shadow-md">
                    <p className="text-xl font-medium text-[var(--text-primary)] mb-3">
                        No results found
                    </p>
                    <p className="text-[var(--text-secondary)]">
                        We couldn't find any users or stories matching "{query}". Try a different search term.
                    </p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}