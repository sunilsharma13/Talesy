// src/app/api/users/[id]/following/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { toObjectId } from '@/lib/utils/objectIdConverter'; // <--- NEW IMPORT

// Define a minimal User type for the list
interface UserProfile {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) { // Use params
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const targetUserIdRaw = params.id; // Use params.id directly

    if (!targetUserIdRaw) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUserId = toObjectId(targetUserIdRaw); // Convert to ObjectId
    if (!targetUserId) { // Handle invalid target user ID
      return NextResponse.json({ error: 'Invalid Target User ID format' }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db('talesy');
    const followCollection = db.collection('follows');
    const userCollection = db.collection('users');

    const followingRecords = await followCollection.find({
      followerId: targetUserId,
    }).toArray();

    // Filter out any potential invalid IDs from the fetched records before processing
    const followingIds = followingRecords.map(f => toObjectId(f.followingId)).filter(Boolean) as import('mongodb').ObjectId[];

    const followingProfiles: UserProfile[] = [];
    if (followingIds.length > 0) {
      const users = await userCollection.find(
        { _id: { $in: followingIds } }, // Use the filtered ObjectIds
        { projection: { name: 1, avatar: 1, bio: 1 } }
      ).toArray();

      for (const user of users) {
        let isFollowing = false;
        if (currentUserId) {
          const currentUserIdObj = toObjectId(currentUserId);
          if (currentUserIdObj) { // Ensure currentUserId is also valid
              const followingCheck = await followCollection.findOne({
                followerId: currentUserIdObj,
                followingId: user._id, // user._id is already ObjectId from query result
              });
              isFollowing = !!followingCheck;
          }
        }

        followingProfiles.push({
          _id: user._id.toString(),
          name: user.name || 'Anonymous User',
          avatar: user.avatar,
          bio: user.bio,
          isFollowing: isFollowing,
        });
      }
    }

    return NextResponse.json(followingProfiles);
  } catch (error) {
    console.error('Error fetching following list:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}