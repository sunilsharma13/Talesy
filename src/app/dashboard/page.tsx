"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import StoryCard from '@/components/StoryCard';
import { ref, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface Story {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  userId: string;
  createdAt: string;
  likes: number;
  comments: number;
  status: 'draft' | 'published';
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/posts?userId=${session.user.id}`);
        const data = await res.json();
        setStories(data);
      } catch (error) {
        console.error('Error fetching stories:', error);
        toast.error('Failed to load stories.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [session?.user]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getExcerpt = (content: string, maxWords: number = 30): string => {
    if (!content) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    const words = plainText.trim().split(/\s+/);
    return words.length <= maxWords ? plainText : words.slice(0, maxWords).join(" ") + "…";
  };

  const cleanAndFormatContent = (htmlContent: string, maxLength = 150): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    let plainText = tempDiv.textContent || tempDiv.innerText || '';
    plainText = plainText.replace(/\s+/g, ' ').trim();
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  };

  const handleDelete = async (storyId: string, storyImageUrl: string | undefined): Promise<void> => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    try {
      setDeleteLoading(storyId);

      if (storyImageUrl) {
        try {
          if (storyImageUrl.startsWith('/uploads/')) {
            await fetch('/api/upload/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath: storyImageUrl }),
            });
          } else if (storyImageUrl.includes('firebase')) {
            const imageRef = ref(storage, storyImageUrl);
            await deleteObject(imageRef);
          }
        } catch (imageError) {
          console.error('Image delete error:', imageError);
        }
      }

      const res = await fetch(`/api/posts/${storyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete post');

      setStories((prev) => prev.filter((story) => story._id !== storyId));
      toast.success('Story deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    if (likingPostId) return;
    setLikingPostId(postId);
  
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (!res.ok) {
        throw new Error(`Failed to like: ${res.statusText}`);
      }
  
      const data = await res.json();
      
      // Update the stories state based on the like action
      setStories((prev) =>
        prev.map((story) =>
          story._id === postId ? { 
            ...story, 
            likes: data.liked ? story.likes + 1 : Math.max(story.likes - 1, 0) 
          } : story
        )
      );
      
      if (data.liked) {
        toast.success('Story liked!');
      } else {
        toast.success('Like removed!');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to update like status.');
    } finally {
      setLikingPostId(null);
    }
  };
  const viewComments = (id: string) => {
    router.push(`/story/${id}`);
  };

  const filteredStories = stories
    .filter((story) => (filterStatus === 'all' ? true : story.status === filterStatus))
    .filter((story) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        story.title.toLowerCase().includes(searchLower) ||
        cleanAndFormatContent(story.content).toLowerCase().includes(searchLower)
      );
    });

  const sortedStories = [...filteredStories].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
  });

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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">Your Stories</h1>
          <button
            onClick={() => router.push('/write/new')}
            className="group px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1.5 group-hover:animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Write a Story
          </button>
        </div>

        {/* Search, Filter, and Sort */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your stories..."
              className="pl-10 pr-4 py-3 w-full bg-gray-800 border border-indigo-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="inline-flex rounded-lg shadow-sm overflow-hidden border border-indigo-500/30" role="group">
              {['all', 'published', 'draft'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as 'all' | 'published' | 'draft')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-indigo-900/50 hover:text-white'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-gray-300 border border-indigo-500/20 hover:bg-gray-700"
            >
              <svg
                className="h-4 w-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              {sortOrder === 'latest' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </div>

        {/* Story Grid */}
        {sortedStories.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700 p-8">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 text-gray-600 mx-auto mb-4"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            
            <h3 className="text-xl font-semibold text-white mb-2">No stories found</h3>
            <p className="text-gray-400 mb-6">Start writing your masterpiece!</p>
            
            <button
              onClick={() => router.push('/write/new')}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Story
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedStories.map((story) => (
              <StoryCard
                key={story._id}
                _id={story._id}
                title={story.title}
                content={story.content}
                imageUrl={story.imageUrl}
                userId={story.userId}
                createdAt={story.createdAt}
                likes={story.likes}
                comments={story.comments}
                status={story.status}
                deleteLoading={deleteLoading === story._id}
                likeLoading={likingPostId === story._id}
                onDelete={handleDelete}
                onLike={handleLike}
                onComment={viewComments}
                formatDate={formatDate}
                getExcerpt={getExcerpt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}