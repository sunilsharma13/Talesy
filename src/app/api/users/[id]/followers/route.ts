// src/app/api/users/[id]/followers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { toObjectId } from '@/lib/utils/objectIdConverter';

// Define a minimal User type for the list
interface UserProfile {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const targetUserIdRaw = params.id;

    if (!targetUserIdRaw) {
      console.log('Error: User ID is required');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUserId = toObjectId(targetUserIdRaw);
    if (!targetUserId) {
      console.log('Error: Invalid Target User ID format for:', targetUserIdRaw);
      return NextResponse.json({ error: 'Invalid Target User ID format' }, { status: 400 });
    }
    console.log('Fetching followers for targetUserId:', targetUserId.toString());


    const client = await getMongoClient();
    const db = client.db('talesy');
    const followCollection = db.collection('follows');
    const userCollection = db.collection('users');

    const followers = await followCollection.find({
      followingId: targetUserId,
    }).toArray();

    console.log('Raw followers records found:', followers.length, followers); // LOG THIS

    const followerIds = followers.map(f => {
      const oid = toObjectId(f.followerId);
      if (!oid) {
        console.warn('Skipping invalid followerId:', f.followerId); // WARN for bad IDs
      }
      return oid;
    }).filter(Boolean) as import('mongodb').ObjectId[];

    console.log('Filtered followerIds to query:', followerIds.length, followerIds.map(id => id.toString())); // LOG THIS

    const followerProfiles: UserProfile[] = [];
    if (followerIds.length > 0) {
      const users = await userCollection.find(
        { _id: { $in: followerIds } },
        { projection: { name: 1, avatar: 1, bio: 1 } }
      ).toArray();

      console.log('User profiles found for followerIds:', users.length, users); // LOG THIS

      for (const user of users) {
        let isFollowing = false;
        if (currentUserId) {
          const currentUserIdObj = toObjectId(currentUserId);
          if (currentUserIdObj) {
              const followingCheck = await followCollection.findOne({
                followerId: currentUserIdObj,
                followingId: user._id,
              });
              isFollowing = !!followingCheck;
          } else {
              console.warn('Invalid currentUserId for isFollowing check:', currentUserId);
          }
        }

        followerProfiles.push({
          _id: user._id.toString(),
          name: user.name || 'Anonymous User',
          avatar: user.avatar,
          bio: user.bio,
          isFollowing: isFollowing,
        });
      }
    }

    console.log('Final followerProfiles being returned:', followerProfiles.length, followerProfiles); // LOG THIS
    return NextResponse.json(followerProfiles);
  } catch (error) {
    console.error('Error fetching followers list:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}