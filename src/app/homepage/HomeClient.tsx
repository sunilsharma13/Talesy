"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  email?: string;
  coverImage?: string;
};

type Story = {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  published: boolean;
};

export default function HomeClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

const stripAndLimitHtml = (html: string, maxLength: number = 150): string => {
    // First, convert common HTML entities for display
    let content = html
      .replace(/<br\s*\/?>/gi, ' ')  // Replace <br> with space
      .replace(/<\/?b>/gi, '')       // Remove <b> tags
      .replace(/<\/?i>/gi, '')       // Remove <i> tags
      .replace(/<\/?strong>/gi, '')  // Remove <strong> tags
      .replace(/<\/?em>/gi, '')      // Remove <em> tags
      .replace(/<img.*?>/gi, '[Image]') // Replace images with [Image] text
      
      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, '');
    
    // Limit the length
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...';
    }
    
    return content;
  };
  
  // Get current theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  // Load user data and stories
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      // If not logged in, redirect to login page
      router.push("/login");
      return;
    }

    async function loadUserData() {
      try {
        // Fetch user profile
        const userRes = await fetch("/api/users/profile");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);

          // Once we have the user ID, fetch their stories
          if (userData.user?._id) {
            const storiesRes = await fetch(`/api/posts/user/${userData.user._id}`);
            if (storiesRes.ok) {
              const storiesData = await storiesRes.json();
              setStories(storiesData);
            }

            // Get follower count
            const followerRes = await fetch(`/api/users/${userData.user._id}/followers/count`);
            if (followerRes.ok) {
              const followerData = await followerRes.json();
              setFollowerCount(followerData.count);
            }

            // Get following count
            const followingRes = await fetch(`/api/users/${userData.user._id}/following/count`);
            if (followingRes.ok) {
              const followingData = await followingRes.json();
              setFollowingCount(followingData.count);
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [session, status, router]);

  // Format date helper function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Generate excerpt from content helper function
  const getExcerpt = (content: string, maxLength: number = 150) => {
    // Remove markdown/HTML
    const plainText = content
      .replace(/\*\*(.*?)\*\*/g, "$1") // bold
      .replace(/_(.*?)_/g, "$1") // italic
      .replace(/#+\s(.*?)(?:\n|$)/g, "$1 ") // headings
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // links
      .replace(/!\[(.*?)\]\(.*?\)/g, "") // images
      .replace(/<[^>]*>/g, ""); // HTML tags
      
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile section */}
            <div className="w-full md:w-1/3">
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-6 h-96`}></div>
            </div>
            
            {/* Stories section */}
            <div className="w-full md:w-2/3">
              <div className={`h-10 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded w-1/3 mb-6`}></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-5 h-40`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Something went wrong loading your profile. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile section */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            {/* Cover image */}
           
{/* Cover image */}
<div className="relative h-32">
  {user.coverImage ? (
    <img 
      src={user.coverImage} 
      alt="Cover" 
      className="w-full h-full object-cover"
    />
  ) : null }
</div>        
            {/* Profile picture */}
            <div className="flex justify-center -mt-16">
              <img
                src={user.avatar || "/default-avatar.png"}
                alt={user.name}
                className="w-32 h-32 rounded-full border-4 border-white object-cover bg-white"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/default-avatar.png";
                }}
              />
            </div>
            
            {/* User info */}
            <div className="text-center px-6 py-4">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {user.name}
              </h2>
              {user.email && (
                <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              )}
              
              {user.bio && (
                <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {user.bio}
                </p>
              )}
              
              {/* Stats */}
              <div className="mt-6 flex justify-center space-x-8 border-t border-b py-4 px-2">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {stories.length}
                  </div>
                  <div className="text-sm text-gray-500">Stories</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {followerCount}
                  </div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {followingCount}
                  </div>
                  <div className="text-sm text-gray-500">Following</div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-6 mb-4">
                <Link 
                  href="/settings" 
                  className={`inline-block ${
                    theme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  } rounded-full px-6 py-2 text-sm font-medium`}
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
          
          {/* Additional section - could be achievements, interests, etc. */}
          <div className={`mt-6 rounded-xl shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Quick Links
              </h3>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/write/new" 
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-700 text-indigo-400' 
                        : 'hover:bg-gray-100 text-indigo-600'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Write New Story
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard" 
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-700 text-indigo-400' 
                        : 'hover:bg-gray-100 text-indigo-600'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/explore" 
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-700 text-indigo-400' 
                        : 'hover:bg-gray-100 text-indigo-600'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Explore
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Stories section */}
        <div className="w-full md:w-2/3 lg:w-3/4">
          <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Your Stories
          </h2>
          
          {stories.length === 0 ? (
            <div className={`rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-10 text-center shadow-sm`}>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className={`mt-4 text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                You haven't published any stories yet
              </p>
              <Link 
                href="/write/new" 
                className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start Writing
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filter tabs */}
              <div className={`flex rounded-lg mb-6 overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <button className={`flex-1 py-2 px-4 ${theme === 'dark' ? 'bg-indigo-800 text-white' : 'bg-indigo-600 text-white'}`}>
                  All Stories
                </button>
                <button className={`flex-1 py-2 px-4 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  Published
                </button>
                <button className={`flex-1 py-2 px-4 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  Drafts
                </button>
              </div>
              
              {/* Story cards */}
              // Updated HomeClient.tsx with improved card design

// Inside your HomeClient component, replace the story cards section with this:

{/* Story cards - IMPROVED DESIGN */}
{stories.map(story => (
  <div
    key={story._id}
    className={`rounded-xl shadow-md border hover:shadow-lg transition-all duration-300 overflow-hidden ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}
  >
    {/* If story has an image, show a small thumbnail version */}
    {story.imageUrl && (
      <div className="w-full h-48 overflow-hidden">
        <img 
          src={story.imageUrl} 
          alt={story.title} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
    )}
    
    <div className="p-6">
      <div className="flex justify-between items-start mb-3">
        <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} line-clamp-2`}>
          {story.title}
        </h3>
        <div className={`px-2 py-1 text-xs rounded-full ${
          story.published
            ? theme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
            : theme === 'dark' ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {story.published ? 'Published' : 'Draft'}
        </div>
      </div>
      
      {/* Fixed content preview that strips HTML tags */}
      <div className={`mb-4 line-clamp-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
        dangerouslySetInnerHTML={{ 
          __html: stripAndLimitHtml(story.content, 150)
        }}
      />
      
      <div className="flex justify-between items-center text-sm">
        <div className="text-gray-500">
          {formatDate(story.createdAt)}
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <svg className={`w-4 h-4 mr-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-500">{story.likes || 0}</span>
          </div>
          <div className="flex items-center">
            <svg className={`w-4 h-4 mr-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-500">{story.comments || 0}</span>
          </div>
        </div>
      </div>
    </div>
    
    {/* Edit and View buttons with improved styling */}
    <div className={`px-6 py-3 flex justify-end space-x-2 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <Link 
        href={`/write/${story._id}`} 
        className={`px-4 py-2 rounded-full text-sm font-medium ${
          theme === 'dark' 
            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
      >
        Edit
      </Link>
      <Link 
        href={`/story/${story._id}`} 
        className={`px-4 py-2 rounded-full text-sm font-medium ${
          theme === 'dark' 
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        View
      </Link>
    </div>
  </div>
))}
              {/* Add story card */}
              <Link 
                href="/write/new"
                className={`block rounded-xl border-2 border-dashed p-8 text-center ${
                  theme === 'dark' 
                    ? 'border-gray-700 hover:border-gray-600' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <svg 
                  className={`mx-auto h-12 w-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                  />
                </svg>
                <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Create a new story
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}