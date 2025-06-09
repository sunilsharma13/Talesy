import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendTemplateEmail } from '@/lib/email';

interface User {
  _id: string | ObjectId;
  name?: string;
  email?: string;
  emailPreferences?: {
    newFollower?: boolean;
    newComment?: boolean;
    newLike?: boolean;
    weeklyDigest?: boolean;
  };
  avatar?: string;
}

function toObjectId(id: string | ObjectId) {
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  if (id instanceof ObjectId) return id;
  throw new Error('Invalid ObjectId');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Extract userToCheckId from URL: /api/users/[id]/follow
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userToCheckId = pathSegments[3]; // index 3 = [id]

    if (!userToCheckId || userToCheckId === currentUserId) {
      return NextResponse.json({ following: false });
    }

    const client = await clientPromise;
    const db = client.db('talesy');
    const followCollection = db.collection('follows');

    const followRecord = await followCollection.findOne({
      followerId: currentUserId,
      followingId: userToCheckId,
    });

    return NextResponse.json({ following: !!followRecord });
  } catch (error) {
    console.error('Follow check error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;

    // Extract userToFollowId from URL: /api/users/[id]/follow
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userToFollowId = pathSegments[3]; // index 3 = [id]

    if (!userToFollowId || userToFollowId === currentUserId) {
      return NextResponse.json({ error: 'Invalid user to follow' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');
    const userCollection = db.collection<User>('users');
    const followCollection = db.collection('follows');

    const currentUserFilter = ObjectId.isValid(currentUserId)
      ? { _id: toObjectId(currentUserId) }
      : { _id: currentUserId };

    const userToFollowFilter = ObjectId.isValid(userToFollowId)
      ? { _id: toObjectId(userToFollowId) }
      : { _id: userToFollowId };

    const currentUser = await userCollection.findOne(currentUserFilter);
    const userToFollow = await userCollection.findOne(userToFollowFilter);

    if (!currentUser || !userToFollow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const alreadyFollowing = await followCollection.findOne({
      followerId: currentUserId,
      followingId: userToFollowId,
    });

    if (alreadyFollowing) {
      await followCollection.deleteOne({
        followerId: currentUserId,
        followingId: userToFollowId,
      });
      return NextResponse.json({ following: false, message: 'Unfollowed' });
    }

    await followCollection.insertOne({
      followerId: currentUserId,
      followingId: userToFollowId,
      createdAt: new Date(),
    });

    if (
      userToFollow.email &&
      (!userToFollow.emailPreferences || userToFollow.emailPreferences.newFollower !== false)
    ) {
      try {
        await sendTemplateEmail(userToFollow.email, 'newFollower', [
          userToFollow.name || 'User',
          currentUser.name || 'Someone',
        ]);
      } catch (e) {
        console.error('Failed to send follow notification email:', e);
      }
    }

    return NextResponse.json({ following: true, message: 'Followed' });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
