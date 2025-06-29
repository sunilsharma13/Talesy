// app/story/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { storage } from "@/lib/firebase";
import { deleteObject, ref } from "firebase/storage";
import CommentSection from "@/components/CommentSection"; // Make sure this path is correct
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

interface PopulatedAuthor {
  _id: string;
  name: string;
  email?: string;
  image?: string;
}

interface Story {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  status: "draft" | "published";
  createdAt: string;
  likes?: number;
  comments?: number;
  author: PopulatedAuthor | string;
}

interface User {
  _id: string;
  name: string;
  avatar?: string;
  isFollowing?: boolean;
  followers?: number;
  following?: number;
  bio?: string;
}

export default function StoryDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();

  const [story, setStory] = useState<Story | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark" | "talesy-accent">("dark");


  const storyId = params.id as string;

  // Helper function to get dynamic CSS variables
  const getDynamicThemeClass = (prop: string) => `var(--${prop})`;

  useEffect(() => {
    // Set theme from localStorage on mount
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && ['light', 'dark', 'talesy-accent'].includes(storedTheme)) {
      setTheme(storedTheme as "light" | "dark" | "talesy-accent");
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      // Default to dark if no theme or invalid theme is stored
      setTheme("dark");
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const fetchStoryAndLikes = async () => {
      try {
        setLoading(true);
        const storyRes = await fetch(`/api/posts/${storyId}`);

        if (!storyRes.ok) {
          throw new Error(`Failed to fetch story: ${storyRes.statusText}`);
        }
        const storyData: Story = await storyRes.json();
        setStory(storyData);

        let currentAuthorId: string | null = null;
        if (storyData.author) {
          if (typeof storyData.author === 'object' && storyData.author !== null && '_id' in storyData.author) {
            currentAuthorId = (storyData.author as PopulatedAuthor)._id.toString();
          } else if (typeof storyData.author === 'string') {
            currentAuthorId = storyData.author;
          }
        }

        if (currentAuthorId) {
          const authorRes = await fetch(`/api/users/${currentAuthorId}`);
          if (authorRes.ok) {
            const authorData: User = await authorRes.json();
            setAuthor(authorData);

            if (session?.user?.id && session.user.id !== currentAuthorId) {
              const followRes = await fetch(`/api/users/${currentAuthorId}/follow`);
              if (followRes.ok) {
                const followData = await followRes.json();
                setAuthor(prev => {
                  if (!prev) return null;
                  return { ...prev, isFollowing: followData.following };
                });
              }
            }
          } else {
            console.error("Failed to fetch author data:", authorRes.status, authorRes.statusText);
            setAuthor(null);
          }
        } else {
          console.log("No valid author ID found in story data.");
          setAuthor(null);
        }

        if (session?.user?.id) {
          const likeStatusRes = await fetch(`/api/posts/${storyId}/like`);
          if (likeStatusRes.ok) {
            const likeStatusData = await likeStatusRes.json();
            setUserHasLiked(likeStatusData.userHasLiked);
          } else {
            console.error("Failed to fetch like status:", likeStatusRes.status, likeStatusRes.statusText);
          }
        }

      } catch (error) {
        console.error("Error fetching story, author, or like status:", error);
        toast.error("Failed to load story");
        setStory(null);
      } finally {
        setLoading(false);
      }
    };

    if (storyId) fetchStoryAndLikes();
  }, [storyId, session?.user?.id]);

  const formatContent = (content: string) => {
    if (!content) return "";
    // Check if content already contains common HTML tags to avoid double formatting
    const isAlreadyHtml = /<\/?(p|div|span|strong|em|ul|ol|li|h[1-6]|br)>/i.test(content);
    if (isAlreadyHtml) {
      return content;
    }
    // Basic Markdown to HTML conversion
    let formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **bold**
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // *italic*
      .replace(/^# (.*?)$/gm, "<h1>$1</h1>") // # Heading 1
      .replace(/^## (.*?)$/gm, "<h2>$1</h2>") // ## Heading 2
      .replace(/^### (.*?)$/gm, "<h3>$1</h3>") // ### Heading 3
      .replace(/^- (.*?)$/gm, "<li>$1</li>") // - List item
      .replace(/\n/g, "<br>"); // New lines to <br>

    return formattedContent;
  };


  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return ""; // Return empty string for invalid dates
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;

    try {
      setDeleteLoading(id);
      console.log(`Deleting story with ID: ${id}`);

      // Handle image deletion from Firebase or local uploads
      if (imageUrl) {
        try {
          if (imageUrl.startsWith("/uploads/")) {
            // Local upload deletion
            const imgRes = await fetch("/api/upload/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filePath: imageUrl }),
            });
            console.log("Image deletion result (local):", imgRes.ok ? "Success" : "Failed");
          } else if (imageUrl.includes("firebase")) {
            // Firebase storage deletion
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            console.log("Firebase image deleted");
          }
        } catch (imageError) {
          console.error("Image delete error:", imageError);
        }
      }

      // Delete the post from the database
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        console.error("Error parsing delete response:", e);
      }

      if (!res.ok) {
        throw new Error((data as any).error || (data as any).details || "Failed to delete post");
      }

      toast.success("Story deleted successfully!");
      router.push("/dashboard"); // Redirect after successful deletion
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push('/login'); // Prompt login if not authenticated
      return;
    }

    if (likeLoading) return; // Prevent multiple clicks
    setLikeLoading(true);

    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorBody = await res.text();
        let errorMessage = `Failed to like story: ${res.statusText}`;
        try {
          const errorData = JSON.parse(errorBody);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.warn("Failed to parse error response as JSON:", parseError);
          errorMessage = `Failed to like story: ${res.statusText}. Response: ${errorBody.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      setStory(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          likes: data.likesCount // Update likes count from response
        };
      });
      setUserHasLiked(data.liked); // Update like status

      if (data.liked) {
        toast.success("Story liked!");
      } else {
        toast.success("Like removed!");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error(`Failed to update like status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (!author || author._id === session.user.id || followLoading) return;

    setFollowLoading(true);

    try {
      const res = await fetch(`/api/users/${author._id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Failed to update follow status');
      }

      const data = await res.json();

      setAuthor(prev => {
        if (!prev) return null;
        return {
          ...prev,
          isFollowing: data.following,
          followers: data.following
            ? (prev.followers || 0) + 1
            : Math.max((prev.followers || 0) - 1, 0)
        };
      });

      toast.success(data.following ? "Author followed successfully!" : "Unfollowed author");
    } catch (error) {
      console.error("Error following author:", error);
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  // Determine author ID safely
  const displayAuthorId = typeof story?.author === 'object' && story.author !== null
    ? story.author._id.toString()
    : (story?.author || null);

  if (loading) {
    return (
      <div className="min-h-screen py-10 px-6" style={{ backgroundColor: getDynamicThemeClass('background-primary') }}>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 rounded w-3/4 mb-6" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}></div>
            <div className="h-64 rounded-lg mb-6" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}></div>
            <div className="space-y-3">
              <div className="h-4 rounded w-full" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}></div>
              <div className="h-4 rounded w-5/6" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}></div>
              <div className="h-4 rounded w-4/6" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen py-10 px-6 flex items-center justify-center" style={{ backgroundColor: getDynamicThemeClass('background-primary') }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('text-primary') }}>Story Not Found</h2>
          <p className="mb-6" style={{ color: getDynamicThemeClass('text-secondary') }}>The story you're looking for doesn't seem to exist.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-lg transition-colors"
            style={{
              backgroundColor: getDynamicThemeClass('accent-color'),
              color: getDynamicThemeClass('active-text'),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
              e.currentTarget.style.color = getDynamicThemeClass('text-primary');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
              e.currentTarget.style.color = getDynamicThemeClass('active-text');
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-6" style={{ backgroundColor: getDynamicThemeClass('background-primary') }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center transition-colors mb-4"
            style={{ color: getDynamicThemeClass('accent-color') }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = getDynamicThemeClass('active-bg');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = getDynamicThemeClass('accent-color');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="rounded-xl overflow-hidden shadow-lg mb-8"
          style={{
            backgroundColor: getDynamicThemeClass('background-secondary'),
            border: `1px solid ${getDynamicThemeClass('border-color')}`
          }}
        >
          <div className="p-5 flex justify-between items-center"
            style={{ borderBottom: `1px solid ${getDynamicThemeClass('border-color')}` }}
          >
            <div className="flex items-center gap-3">
              <Link
                href={`/profile/${displayAuthorId}`}
                className="w-10 h-10 rounded-full overflow-hidden"
                style={{ backgroundColor: getDynamicThemeClass('background-tertiary') }}
              >
                {author?.avatar ? (
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src="/logo.png" // Placeholder if no author avatar
                    alt="Talesy Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                )}
              </Link>

              <div>
                <Link
                  href={`/profile/${displayAuthorId}`}
                  className="font-medium hover:text-indigo-300 transition-colors"
                  style={{ color: getDynamicThemeClass('text-primary') }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = getDynamicThemeClass('accent-color');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = getDynamicThemeClass('text-primary');
                  }}
                >
                  {author?.name || "Unknown Author"}
                </Link>
                <p className="text-xs flex items-center gap-1" style={{ color: getDynamicThemeClass('text-secondary') }}>
                  <span>{formatDate(story.createdAt)}</span>
                  {author?.followers !== undefined && (
                    <span className="mx-2" style={{ color: getDynamicThemeClass('text-secondary-faded') }}>•</span>
                  )}
                  {author?.followers !== undefined && (
                    <span>{author.followers} follower{author.followers !== 1 ? 's' : ''}</span>
                  )}
                </p>
              </div>
            </div>

            {session?.user && author && session.user.id !== author._id && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${followLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                style={{
                  backgroundColor: author.isFollowing
                    ? getDynamicThemeClass('background-tertiary')
                    : getDynamicThemeClass('accent-color'),
                  color: author.isFollowing
                    ? getDynamicThemeClass('text-primary')
                    : getDynamicThemeClass('active-text'),
                }}
                onMouseEnter={(e) => {
                  if (author.isFollowing) {
                    e.currentTarget.style.backgroundColor = getDynamicThemeClass('border-color');
                  } else {
                    e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
                    e.currentTarget.style.color = getDynamicThemeClass('text-primary');
                  }
                }}
                onMouseLeave={(e) => {
                  if (author.isFollowing) {
                    e.currentTarget.style.backgroundColor = getDynamicThemeClass('background-tertiary');
                  } else {
                    e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
                    e.currentTarget.style.color = getDynamicThemeClass('active-text');
                  }
                }}
              >
                {followLoading ? "Loading..." : author.isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          <div className="p-5">
            <h1 className="text-3xl font-bold mb-4" style={{ color: getDynamicThemeClass('text-primary') }}>{story.title}</h1>

            {story.imageUrl && (
              <div className="mb-6 w-full">
                <Image
                  src={story.imageUrl}
                  alt={story.title}
                  width={800}
                  height={500}
                  className="w-full max-h-[500px] object-cover rounded-lg"
                  priority
                />
              </div>
            )}

            {/* Apply theme colors to content generated by dangerouslySetInnerHTML.
                This assumes the prose class is correctly configured in your global CSS
                to use the CSS variables. */}
            <div className={`prose max-w-none`} style={{ color: getDynamicThemeClass('text-secondary') }}>
              <div
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatContent(story.content) }}
              />
            </div>


            <div className="mt-8 pt-4 flex justify-between items-center"
              style={{ borderTop: `1px solid ${getDynamicThemeClass('border-color')}` }}
            >
              <div className="flex gap-4">
                <button
                  onClick={(e) => handleLike(story._id, e)}
                  disabled={likeLoading}
                  className={`flex items-center gap-2 transition-colors ${userHasLiked ? 'text-red-400' : ''}`}
                  style={{ color: userHasLiked ? getDynamicThemeClass('liked-color') : getDynamicThemeClass('text-secondary') }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = userHasLiked ? getDynamicThemeClass('liked-color-hover') : getDynamicThemeClass('accent-color');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = userHasLiked ? getDynamicThemeClass('liked-color') : getDynamicThemeClass('text-secondary');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={userHasLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {story.likes || 0} Like{(story.likes || 0) !== 1 ? 's' : ''}
                </button>

                <div className="flex items-center gap-2" style={{ color: getDynamicThemeClass('text-secondary') }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {story.comments || 0} Comment{(story.comments || 0) !== 1 ? 's' : ''}
                </div>
              </div>

              {session?.user && session.user.id === displayAuthorId && (
                <div className="flex gap-3">
                  <Link
                    href={`/write/${story._id}`}
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: getDynamicThemeClass('accent-color'),
                      color: getDynamicThemeClass('active-text'),
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
                      e.currentTarget.style.color = getDynamicThemeClass('text-primary');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
                      e.currentTarget.style.color = getDynamicThemeClass('active-text');
                    }}
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(story._id, story.imageUrl)}
                    disabled={deleteLoading === story._id}
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: getDynamicThemeClass('danger-color'),
                      color: getDynamicThemeClass('active-text'),
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = getDynamicThemeClass('danger-color-hover');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = getDynamicThemeClass('danger-color');
                    }}
                  >
                    {deleteLoading === story._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Passing the theme prop to CommentSection */}
        <CommentSection postId={story._id} theme={theme} />
      </div>
    </div>
  );
}