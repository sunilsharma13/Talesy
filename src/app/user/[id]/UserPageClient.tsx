'use client';

import { useEffect, useState } from 'react';

interface User {
  _id: string;
  name?: string;
  email?: string;
  bio?: string;
  avatar?: string;
}

export default function UserPageClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    async function fetchUserData() {
      if (!userId) {
        setError("User ID missing");
        setLoading(false);
        return;
      }

      try {
        const userRes = await fetch(`/api/users/${userId}`);
        if (!userRes.ok) throw new Error('Failed to fetch user');
        const userData = await userRes.json();
        setUser(userData);

        const followerRes = await fetch(`/api/users/${userId}/followers/count`);
        if (followerRes.ok) {
          const followerData = await followerRes.json();
          setFollowerCount(followerData.count);
        }

        const followingRes = await fetch(`/api/users/${userId}/following/count`);
        if (followingRes.ok) {
          const followingData = await followingRes.json();
          setFollowingCount(followingData.count);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setError("Error loading user");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-10 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="w-32 h-32 rounded-full bg-gray-700 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
      </div>
    );
  }

  if (error || !user) {
    return <div className="p-6 text-red-500">{error || "User not found"}</div>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">{user.name || 'Anonymous User'}</h1>

      <div className="flex items-center mb-6">
        {user.avatar && (
          <img
            src={user.avatar}
            alt={`${user.name} avatar`}
            width={120}
            height={120}
            className="rounded-full mr-6"
          />
        )}

        <div>
          {user.bio && <p className="text-gray-300 mb-4">{user.bio}</p>}

          <div className="flex space-x-6">
            <div>
              <span className="text-xl font-bold">{followerCount}</span>
              <span className="text-gray-400 ml-2">Followers</span>
            </div>
            <div>
              <span className="text-xl font-bold">{followingCount}</span>
              <span className="text-gray-400 ml-2">Following</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
