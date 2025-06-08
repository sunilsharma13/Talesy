// app/explore/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

interface Story {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  userId: string;
  createdAt: string;
  likes: number;
  comments: number;
  user: {
    name: string;
    avatar?: string;
  };
}

export default function ExplorePage() {
  const [loading, setLoading] = useState(true);
  const [trendingStories, setTrendingStories] = useState<Story[]>([]);
  const [featuredWriters, setFeaturedWriters] = useState<User[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  
  useEffect(() => {
    async function fetchExploreData() {
      setLoading(true);
      
      try {
        // Fetch trending stories
        const storiesRes = await fetch("/api/posts/trending");
        if (storiesRes.ok) {
          const storiesData = await storiesRes.json();
          setTrendingStories(storiesData);
        }
        
        // Fetch featured writers
        const writersRes = await fetch("/api/users/featured");
        if (writersRes.ok) {
          const writersData = await writersRes.json();
          setFeaturedWriters(writersData);
        }
        
        // Fetch popular tags
        const tagsRes = await fetch("/api/tags/popular");
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTags(tagsData);
        }
      } catch (error) {
        console.error("Error fetching explore data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchExploreData();
  }, []);
  
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

  // For demo purposes, create some placeholder data if the API doesn't return anything
  const placeholderTags = [
    { name: "Fiction", count: 243 },
    { name: "Poetry", count: 189 },
    { name: "Technology", count: 156 },
    { name: "Travel", count: 134 },
    { name: "Self-improvement", count: 112 },
    { name: "Health", count: 98 },
    { name: "Science", count: 87 },
    { name: "Art", count: 76 },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8">Explore</h1>
      
      {loading ? (
        <div className="animate-pulse space-y-10">
          {/* Trending Stories */}
          <div>
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-800 rounded-xl p-5">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3 mb-4"></div>
                  <div className="h-32 bg-gray-700 rounded w-full mb-3"></div>
                  <div className="flex justify-between">
                    <div className="h-4 w-16 bg-gray-700 rounded"></div>
                    <div className="h-4 w-24 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Featured Writers */}
          <div>
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-800 rounded-xl p-5">
                  <div className="mx-auto h-16 w-16 bg-gray-700 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-14">
          {/* Trending Stories */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-6">Trending Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingStories.length > 0 ? (
                trendingStories.map(story => (
                  <div key={story._id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                    <Link href={`/story/${story._id}`} className="block">
                      {story.imageUrl && (
                        <div className="h-40 overflow-hidden">
                          <img
                            src={story.imageUrl}
                            alt={story.title}
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder-image.jpg";
                              target.classList.add("hidden");
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="p-5">
                        <h3 className="text-xl font-medium text-white mb-2 hover:text-indigo-400 transition-colors">
                          {story.title}
                        </h3>
                        
                        <p className="text-gray-400 mb-4 line-clamp-2">
                          {getExcerpt(story.content)}
                        </p>
                        
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <img
                              src={story.user?.avatar || "/default-avatar.png"}
                              alt={story.user?.name || "Author"}
                              className="w-6 h-6 rounded-full object-cover mr-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/default-avatar.png";
                              }}
                            />
                            <span className="text-gray-300">{story.user?.name}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-500">
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
                            <span>{story.likes}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                // Placeholder content if no trending stories are available
                <div className="col-span-1 md:col-span-3 p-8 bg-gray-800 border border-gray-700 rounded-xl text-center">
                  <p className="text-gray-400 mb-4">Discover trending stories as our community grows!</p>
                  <Link
                    href="/write/new"
                    className="inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full transition-colors"
                  >
                    Start Writing
                  </Link>
                </div>
              )}
            </div>
          </section>
          
          {/* Featured Writers */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-6">Featured Writers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredWriters.length > 0 ? (
                featuredWriters.map(writer => (
                  <Link
                    key={writer._id}
                    href={`/profile/${writer._id}`}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors duration-300"
                  >
                    <div className="flex flex-col items-center">
                      <img
                        src={writer.avatar || "/default-avatar.png"}
                        alt={writer.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 mb-4"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/default-avatar.png";
                        }}
                      />
                      <h3 className="text-white font-medium mb-1">{writer.name}</h3>
                      {writer.bio && (
                        <p className="text-gray-400 text-sm line-clamp-2">{writer.bio}</p>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                // Placeholder content if no featured writers are available
                <div className="col-span-2 md:col-span-4 p-8 bg-gray-800 border border-gray-700 rounded-xl text-center">
                  <p className="text-gray-400">Featured writers will appear here soon!</p>
                </div>
              )}
            </div>
          </section>
          
          {/* Popular Tags */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-6">Popular Topics</h2>
            <div className="flex flex-wrap gap-3">
              {(tags.length > 0 ? tags : placeholderTags).map((tag, index) => (
                <Link
                  key={index}
                  href={`/search?q=${tag.name}`}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full hover:border-indigo-500 transition-colors duration-300"
                >
                  <span className="text-white">{tag.name}</span>
                  <span className="text-gray-400 text-sm ml-2">({tag.count})</span>
                </Link>
              ))}
            </div>
          </section>
          
          {/* Discover More Banner */}
          <section className="rounded-xl overflow-hidden relative">
            <div className="bg-gradient-to-r from-indigo-800 to-purple-800 p-8 md:p-12">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold text-white mb-4">Discover more stories</h2>
                <p className="text-indigo-200 mb-6 md:text-lg">
                  Explore thousands of stories from writers around the world. 
                  Find inspiration, share your thoughts, and connect with others.
                </p>
                <Link
                  href="/feed"
                  className="inline-block px-6 py-3 bg-white text-indigo-800 font-medium rounded-lg shadow hover:bg-gray-100 transition-colors"
                >
                  Browse Feed
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}