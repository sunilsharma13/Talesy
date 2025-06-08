"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";
import { deleteObject, ref } from "firebase/storage";

interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  status: "draft" | "published";
  createdAt: string;
  likes?: number;
  comments?: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!session || !session.user) return;

    const fetchStories = async () => {
      try {
        const userId = session.user.id;
        console.log("Session ID from useSession:", userId);

        const queryParams = new URLSearchParams({
          userId,
          sortOrder,
          limit: "10",
          skip: "0",
        });

        if (filterStatus === "published") queryParams.set("publishedOnly", "true");
        if (filterStatus === "draft") queryParams.set("draftsOnly", "true");

        const res = await fetch(`/api/posts?${queryParams.toString()}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }

        const data = await res.json();

        const mappedStories = data.map((item: any) => ({
          id: item._id,
          title: item.title,
          content: item.content,
          imageUrl: item.imageUrl,
          status: item.status,
          createdAt: item.createdAt,
          likes: item.likes || 0,
          comments: item.comments || 0,
        }));

        setStories(mappedStories);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [session, sortOrder, filterStatus]);

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;
  
    try {
      setDeleteLoading(id);
      
      console.log(`Deleting story with ID: ${id}`);
      
      // Handle image deletion if needed
      if (imageUrl) {
        try {
          if (imageUrl.startsWith("/uploads/")) {
            const imgRes = await fetch("/api/upload/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filePath: imageUrl }),
            });
            console.log('Image deletion result:', imgRes.ok ? 'Success' : 'Failed');
          } else if (imageUrl.includes("firebase") || imageUrl.includes("firebasestorage")) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            console.log('Firebase image deleted');
          }
        } catch (imageError) {
          console.error("Image delete error:", imageError);
          // Continue with post deletion
        }
      }
  
      // Delete the post
      const res = await fetch(`/api/posts/${id}`, { 
        method: "DELETE",
        credentials: "include"
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error('Error parsing response:', e);
        data = {};
      }
      
      console.log('Delete response:', res.status, data);
      
      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to delete post");
      }
  
      // Update UI on success
      setStories((prev) => prev.filter((story) => story.id !== id));
      console.log('Story removed from UI');
      
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeleteLoading(null);
    }
  };
  // Like a post
  const handleLike = async (id: string) => {
    try {
      setLikeLoading(id);
      
      // Optimistic UI update
      setStories(prev => 
        prev.map(story => 
          story.id === id 
            ? { ...story, likes: (story.likes || 0) + 1 } 
            : story
        )
      );
      
      // For now, just simulate an API call since we haven't implemented it yet
      // In a real implementation, you'd call your like endpoint here
      // const res = await fetch(`/api/posts/${id}/like`, { method: "POST" });
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
    } catch (error) {
      console.error("Error liking post:", error);
      // Revert optimistic update on error
      setStories(prev => 
        prev.map(story => 
          story.id === id 
            ? { ...story, likes: (story.likes || 1) - 1 } 
            : story
        )
      );
    } finally {
      setLikeLoading(null);
    }
  };
  
  // View comments
  const viewComments = (id: string) => {
    // For now, just log since we haven't implemented the story page yet
    console.log("View comments for:", id);
    
    // In a real implementation, you'd redirect to the story page
    // router.push(`/story/${id}#comments`);
  };

  const filteredStories = stories
    .filter((story) => {
      if (filterStatus === "all") return true;
      return story.status === filterStatus;
    })
    .filter((story) =>
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Get word count for a story
  const getWordCount = (content: string) => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  // Get excerpt from content
  const getExcerpt = (content: string, maxLength: number = 120) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-700 rounded w-full mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="border border-gray-700 rounded-xl overflow-hidden">
                  <div className="h-40 bg-gray-800"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                    <div className="h-8 bg-gray-700 rounded w-1/3 mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">Your Stories</h1>
          <button
            onClick={() => router.push("/write/new")}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors duration-200 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Write a Story
          </button>
        </div>

        {/* Filter and search bar */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your stories..."
              className="pl-10 pr-4 py-3 w-full bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  filterStatus === "all"
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("published")}
                className={`px-4 py-2 text-sm font-medium border-y ${
                  filterStatus === "published"
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                }`}
              >
                Published
              </button>
              <button
                onClick={() => setFilterStatus("draft")}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                  filterStatus === "draft"
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                }`}
              >
                Drafts
              </button>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === "latest" ? "oldest" : "latest")}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
              {sortOrder === "latest" ? "Newest First" : "Oldest First"}
            </button>
          </div>
        </div>

        {/* Stories grid */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-white mb-2">No stories found</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {searchQuery 
                ? "No stories matching your search. Try different keywords."
                : filterStatus !== "all" 
                  ? `You don't have any ${filterStatus} stories yet.` 
                  : "Start writing your first story and it will appear here."}
            </p>
            <button
              onClick={() => router.push("/write/new")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors duration-200"
            >
              Start Writing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {story.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-image.jpg";
                      }}
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                      story.status === "published"
                        ? "bg-green-900 text-green-300"
                        : "bg-yellow-900 text-yellow-300"
                    }`}>
                      {story.status === "published" ? "Published" : "Draft"}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {formatDate(story.createdAt)}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-white mb-2 line-clamp-1">
                    {story.title}
                  </h2>
                  
                  <div className="min-h-[72px] mb-3">
                    <p className="text-gray-400 line-clamp-3">
                      {getExcerpt(story.content)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      {getWordCount(story.content)} words
                    </div>
                    
                    {/* Like and comment counts */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1 text-red-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span>{story.likes || 0}</span>
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
                        <span>{story.comments || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Story actions */}
                  <div className="flex flex-wrap gap-2">
                    {/* Edit button - now smaller */}
                    <button
                      onClick={() => router.push(`/write/${story.id}`)}
                      className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors duration-200 flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    
                    {/* Like button */}
                    <button
                      onClick={() => handleLike(story.id)}
                      disabled={likeLoading === story.id}
                      className="py-1.5 px-3 bg-gray-700 hover:bg-red-700 text-sm font-medium rounded transition-colors duration-200 flex items-center disabled:opacity-50"
                      title="Like this story"
                    >
                      {likeLoading === story.id ? (
                        <svg className="animate-spin h-4 w-4 mr-1 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1 text-red-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      )}
                      Like
                    </button>
                    
                    {/* Comment button */}
                    <button
                      onClick={() => viewComments(story.id)}
                      className="py-1.5 px-3 bg-gray-700 hover:bg-blue-700 text-sm font-medium rounded transition-colors duration-200 flex items-center"
                      title="View comments"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1 text-blue-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      Comments
                    </button>
                    
                    {/* Delete button - smaller and to the right */}
                    <button
                      onClick={() => handleDelete(story.id, story.imageUrl)}
                      disabled={deleteLoading === story.id}
                      className="ml-auto py-1.5 px-1.5 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      {deleteLoading === story.id ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}