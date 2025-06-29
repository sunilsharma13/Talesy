// app/api/users/[id]/follow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendTemplateEmail } from '@/lib/email';
import { toObjectId } from '@/lib/utils/objectIdConverter'; // <--- NEW IMPORT

interface User {
  _id: string | import('mongodb').ObjectId; // Use import to avoid direct ObjectId import
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) { // Use params
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const userToCheckId = params.id; // Use params.id directly

    if (!userToCheckId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Convert to ObjectId and handle potential invalid IDs
    const currentUserIdObj = toObjectId(currentUserId);
    const userToCheckIdObj = toObjectId(userToCheckId);

    if (!currentUserIdObj || !userToCheckIdObj) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    if (userToCheckId === currentUserId) { // Cannot check self-follow status in this context meaningfully
      return NextResponse.json({ isFollowing: false, followers: 0, followingCount: 0 }); // Added followingCount
    }

    const client = await getMongoClient();
    const db = client.db('talesy');
    const followCollection = db.collection('follows');

    const followRecord = await followCollection.findOne({
      followerId: currentUserIdObj,
      followingId: userToCheckIdObj,
    });

    const followerCount = await followCollection.countDocuments({
      followingId: userToCheckIdObj,
    });

    const currentUsersFollowingCount = await followCollection.countDocuments({
      followerId: currentUserIdObj,
    });

    return NextResponse.json({
      isFollowing: !!followRecord,
      followers: followerCount,
      followingCount: currentUsersFollowingCount, // Include this here
    });
  } catch (error) {
    console.error('Follow check error:', error);
    return NextResponse.json({
      error: 'Server error',
      isFollowing: false,
      followers: 0,
      followingCount: 0
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) { // Use params
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const userToFollowId = params.id; // Use params.id directly

    if (!userToFollowId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Convert to ObjectId and handle potential invalid IDs
    const currentUserIdObj = toObjectId(currentUserId);
    const userToFollowIdObj = toObjectId(userToFollowId);

    if (!currentUserIdObj || !userToFollowIdObj) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    if (userToFollowId === currentUserId) {
      return NextResponse.json({ error: 'Cannot follow/unfollow self' }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db('talesy');
    const userCollection = db.collection<User>('users');
    const followCollection = db.collection('follows');

    const currentUser = await userCollection.findOne({ _id: currentUserIdObj });
    const userToFollow = await userCollection.findOne({ _id: userToFollowIdObj });

    if (!currentUser || !userToFollow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const alreadyFollowing = await followCollection.findOne({
      followerId: currentUserIdObj,
      followingId: userToFollowIdObj,
    });

    let isFollowing = false;

    if (alreadyFollowing) {
      await followCollection.deleteOne({
        followerId: currentUserIdObj,
        followingId: userToFollowIdObj,
      });
      isFollowing = false;
    } else {
      await followCollection.insertOne({
        followerId: currentUserIdObj,
        followingId: userToFollowIdObj,
        createdAt: new Date(),
      });
      isFollowing = true;

      // Send email notification
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
    }

    // Get updated counts after the operation
    const followerCount = await followCollection.countDocuments({
      followingId: userToFollowIdObj,
    });

    const currentUsersFollowingCount = await followCollection.countDocuments({
      followerId: currentUserIdObj,
    });

    return NextResponse.json({
      isFollowing: isFollowing,
      followers: followerCount,
      followingCount: currentUsersFollowingCount,
      message: isFollowing ? 'Followed' : 'Unfollowed'
    });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      isFollowing: false,
      followers: 0,
      followingCount: 0
    }, { status: 500 });
  }
}