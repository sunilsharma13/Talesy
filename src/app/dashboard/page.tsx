// src/app/dashboard/page.tsx (Updated)
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import StoryCard from '@/components/StoryCard';
import { ref, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import Link from 'next/link';

interface Story {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  status: 'draft' | 'published';
  genre?: string;
  isPublic?: boolean;
  tags?: string[];
  isLikedByCurrentUser?: boolean;
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

  // --- Theme State ---
  const [theme, setTheme] = useState<string>('dark'); // Default to 'dark'

  useEffect(() => {
    // Read theme from localStorage or system preference on mount
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      router.push('/login');
      return;
    }
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/writing?status=${filterStatus === 'all' ? '' : filterStatus}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (res.ok) {
          setStories(data);
        } else {
          throw new Error(data.message || 'Failed to load stories');
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
        toast.error('Failed to load stories.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [session?.user, filterStatus, router]);

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
    if (words.length <= maxWords) return plainText;
    return words.slice(0, maxWords).join(" ") + "...";
  };


  const handleDelete = useCallback(async (storyId: string, storyImageUrl: string | undefined): Promise<void> => {
    if (!confirm('Are you sure you want to delete this story? This will permanently remove it.')) return;
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
          } else if (storyImageUrl.includes('firebasestorage')) {
            const imageRef = ref(storage, storyImageUrl);
            await deleteObject(imageRef);
          }
        } catch (imageError) {
          console.error('Image delete error (may not exist or permission issue):', imageError);
        }
      }

      const res = await fetch(`/api/writing?id=${storyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete post');

      setStories((prev) => prev.filter((story) => story._id !== storyId));
      toast.success('Story deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Error deleting story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleteLoading(null);
    }
  }, []);

  const handleLike = useCallback(async (postId: string, e: React.MouseEvent) => {
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
        const errorBody = await res.text();
        let errorMessage = `Failed to like: ${res.statusText}`;
        try {
            const errorData = JSON.parse(errorBody);
            errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
            console.warn("Failed to parse error response as JSON:", parseError);
            errorMessage = `Failed to like: ${res.statusText}. Response: ${errorBody.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      setStories((prev) =>
        prev.map((story) =>
          story._id === postId ? {
            ...story,
            likes: data.likesCount,
            isLikedByCurrentUser: data.liked
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
      toast.error(`Failed to update like status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLikingPostId(null);
    }
  }, [session?.user, router, likingPostId]);

  const viewComments = useCallback((id: string) => {
    router.push(`/story/${id}`);
  }, [router]);

  const handleEdit = useCallback((storyId: string) => {
    router.push(`/write/${storyId}`);
  }, [router]);

  const filteredStories = stories
    .filter((story) => (filterStatus === 'all' ? true : story.status === filterStatus))
    .filter((story) => {
      const searchLower = searchQuery.toLowerCase();
      const storyContentExcerpt = getExcerpt(story.content, 1000);
      return (
        story.title.toLowerCase().includes(searchLower) ||
        storyContentExcerpt.toLowerCase().includes(searchLower)
      );
    });

  const sortedStories = [...filteredStories].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
  });

  // Default image to use when imageUrl is not provided for a story.
  // Make sure this path is correct and the image exists.
  const defaultStoryFallbackImage = '/default-story-image.png'; // Replace with your actual default image path

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background-primary)] text-[var(--text-primary)] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Please log in to view your dashboard.</h2>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-[var(--accent-color)] text-[var(--active-text)] rounded-lg hover:brightness-90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background-primary)] py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-[var(--hover-bg)] rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-[var(--hover-bg)] rounded w-full mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="border border-[var(--border-color)] rounded-xl overflow-hidden shadow-lg">
                  <div className="h-48 bg-[var(--background-secondary)]"></div>
                  <div className="p-5 space-y-4">
                    <div className="h-6 bg-[var(--hover-bg)] rounded w-3/4"></div>
                    <div className="h-4 bg-[var(--hover-bg)] rounded w-1/2"></div>
                    <div className="h-4 bg-[var(--hover-bg)] rounded w-full"></div>
                    <div className="h-4 bg-[var(--hover-bg)] rounded w-2/3"></div>
                    <div className="h-8 bg-[var(--hover-bg)] rounded w-1/3 mt-6"></div>
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
    <div className="min-h-screen bg-[var(--background-primary)] py-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-4 md:mb-0 drop-shadow-lg">
            Your Stories
          </h1>
          <Link
            href="/write/new"
            className="group px-6 py-3 bg-[var(--accent-color)] text-[var(--active-text)] font-semibold rounded-full transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Story
          </Link>
        </div>

        {/* Search, Filter, and Sort */}
        <div className="mb-10 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-[var(--text-secondary)]"
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
              className="pl-11 pr-4 py-3 w-full bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all duration-200 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="inline-flex rounded-full shadow-sm overflow-hidden bg-[var(--background-secondary)] border border-[var(--border-color)]" role="group">
              {['all', 'published', 'draft'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as 'all' | 'published' | 'draft')}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors duration-200 rounded-full ${
                    filterStatus === status
                      ? 'bg-[var(--accent-color)] text-[var(--active-text)] shadow-md'
                      : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-full bg-[var(--background-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors duration-200 shadow-sm"
            >
              <svg
                className="h-4 w-4 mr-2"
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
          <div className="text-center py-20 bg-[var(--background-secondary)]/50 rounded-2xl border border-[var(--border-color)] p-8 shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-20 w-20 text-[var(--text-secondary)] mx-auto mb-6 opacity-70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>

            <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">No stories found yet!</h3>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
              It looks like you haven't written anything. Click the button below to start your creative journey.
            </p>

            <Link
              href="/write/new"
              className="px-6 py-3 bg-[var(--accent-color)] text-[var(--active-text)] rounded-full hover:brightness-90 transition-colors duration-300 flex items-center gap-2 mx-auto w-fit shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Story
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedStories.map((story) => (
              <StoryCard
                key={story._id}
                _id={story._id}
                title={story.title}
                content={story.content}
                imageUrl={story.imageUrl}
                author={{
                  _id: session?.user?.id || '',
                  name: session?.user?.name || 'Your Name',
                  avatar: session?.user?.image || '/default-avatar.png',
                }}
                createdAt={story.createdAt}
                likes={story.likes}
                comments={story.comments}
                status={story.status}
                isLikedByCurrentUser={story.isLikedByCurrentUser || false}
                onDelete={handleDelete}
                onLike={handleLike}
                onComment={viewComments}
                onEdit={handleEdit}
                deleteLoading={deleteLoading === story._id}
                likeLoading={likingPostId === story._id}
                currentUserId={session?.user?.id || null}
                showAuthorInfo={false}
                showOwnerActions={true}
                // Pass a dummy onFollowToggle function since it's required by StoryCard's type
                // But not actually used when showOwnerActions is true and showAuthorInfo is false.
                onFollowToggle={() => { /* Do nothing for owner's own stories */ }}
                followLoading={false} // Always false for owner's stories
                defaultStoryImage={defaultStoryFallbackImage} // Pass the default image path
                theme={theme as "light" | "dark" | "talesy-accent"} // Pass the theme
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