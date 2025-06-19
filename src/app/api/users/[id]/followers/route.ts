// src/app/api/users/[id]/followers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect'; // <--- Change here
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Define a minimal User type for the list
interface UserProfile {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean; 
}

function toObjectId(id: string | ObjectId) {
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  if (id instanceof ObjectId) return id;
  throw new Error('Invalid ObjectId');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const urlSegments = req.nextUrl.pathname.split('/');
    const targetUserIdRaw = urlSegments[urlSegments.indexOf('users') + 1];

    if (!targetUserIdRaw) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUserId = toObjectId(targetUserIdRaw); // Convert to ObjectId

    const client = await getMongoClient(); // <--- Change here
    const db = client.db('talesy');
    const followCollection = db.collection('follows');
    const userCollection = db.collection('users');

    const followers = await followCollection.find({
      followingId: targetUserId, // Use ObjectId
    }).toArray();

    const followerIds = followers.map(f => f.followerId);

    const followerProfiles: UserProfile[] = [];
    if (followerIds.length > 0) {
      const objectIdFollowerIds = followerIds.map(id => toObjectId(id)); // Use toObjectId

      const users = await userCollection.find(
        { _id: { $in: objectIdFollowerIds } },
        { projection: { name: 1, avatar: 1, bio: 1 } } // Removed emailPreferences as it's not part of UserProfile
      ).toArray();

      for (const user of users) {
        let isFollowing = false;
        if (currentUserId) {
          const followingCheck = await followCollection.findOne({
            followerId: toObjectId(currentUserId), // Convert to ObjectId
            followingId: user._id, // User._id is already ObjectId from query result
          });
          isFollowing = !!followingCheck;
        }

        followerProfiles.push({
          _id: user._id.toString(), // Ensure _id is string for client
          name: user.name || 'Anonymous User',
          avatar: user.avatar,
          bio: user.bio,
          isFollowing: isFollowing, 
        });
      }
    }

    return NextResponse.json(followerProfiles);
  } catch (error) {
    console.error('Error fetching followers list:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}