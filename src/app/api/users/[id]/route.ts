// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

function toObjectId(id: string | ObjectId) {
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  if (id instanceof ObjectId) return id;
  throw new Error('Invalid ObjectId');
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id ? toObjectId(session.user.id) : null;
    const userIdToFetch = params.id;

    if (!userIdToFetch) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userIdObj = toObjectId(userIdToFetch);

    const client = await getMongoClient();
    const db = client.db('talesy');
    const userCollection = db.collection('users');
    const followCollection = db.collection('follows');

    const user = await userCollection.findOne(
      { _id: userIdObj },
      { projection: { _id: 1, name: 1, avatar: 1, bio: 1, emailPreferences: 1, email: 1 } } // Fetch necessary fields
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate followers count
    const followersCount = await followCollection.countDocuments({
      followingId: userIdObj,
    });

    // Calculate following count for the user whose profile is being viewed
    const followingCount = await followCollection.countDocuments({
      followerId: userIdObj,
    });

    // Check if the current logged-in user is following this profile
    let isFollowing = false;
    if (currentUserId && currentUserId.toString() !== userIdObj.toString()) {
      const followRecord = await followCollection.findOne({
        followerId: currentUserId,
        followingId: userIdObj,
      });
      isFollowing = !!followRecord;
    }

    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      followers: followersCount,
      followingCount: followingCount,
      isFollowing: isFollowing,
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}