// app/api/users/[id]/follow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect'; // <--- Change here
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

    // Extract userToCheckId from URL using params for cleaner access
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const userToCheckId = pathSegments[3]; // Assumes URL structure /api/users/[id]/follow

    if (!userToCheckId || userToCheckId === currentUserId) {
      return NextResponse.json({ following: false, followers: 0, followingCount: 0 });
    }

    // Convert IDs to ObjectId if they are strings for consistency in database queries
    const currentUserIdObj = toObjectId(currentUserId);
    const userToCheckIdObj = toObjectId(userToCheckId);

    const client = await getMongoClient(); // <--- Change here
    const db = client.db('talesy');
    const followCollection = db.collection('follows');

    const followRecord = await followCollection.findOne({
      followerId: currentUserIdObj, // Use ObjectId
      followingId: userToCheckIdObj, // Use ObjectId
    });

    // Get follower count
    const followerCount = await followCollection.countDocuments({
      followingId: userToCheckIdObj, // Use ObjectId
    });

    // Get following count
    const followingCount = await followCollection.countDocuments({
      followerId: userToCheckIdObj, // Use ObjectId (to count how many *this user* is following)
    });

    return NextResponse.json({ 
      following: !!followRecord,
      followers: followerCount,
      followingCount: followingCount
    });
  } catch (error) {
    console.error('Follow check error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      following: false, 
      followers: 0, 
      followingCount: 0 
    }, { status: 500 });
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
    const userToFollowId = pathSegments[3]; // Assumes URL structure /api/users/[id]/follow

    if (!userToFollowId || userToFollowId === currentUserId) {
      return NextResponse.json({ error: 'Invalid user to follow' }, { status: 400 });
    }

    const client = await getMongoClient(); // <--- Change here
    const db = client.db('talesy');
    const userCollection = db.collection<User>('users');
    const followCollection = db.collection('follows');

    // Convert IDs to ObjectId for database operations
    const currentUserIdObj = toObjectId(currentUserId);
    const userToFollowIdObj = toObjectId(userToFollowId);

    const currentUser = await userCollection.findOne({ _id: currentUserIdObj });
    const userToFollow = await userCollection.findOne({ _id: userToFollowIdObj });

    if (!currentUser || !userToFollow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const alreadyFollowing = await followCollection.findOne({
      followerId: currentUserIdObj,
      followingId: userToFollowIdObj,
    });

    let following = false;
    
    if (alreadyFollowing) {
      await followCollection.deleteOne({
        followerId: currentUserIdObj,
        followingId: userToFollowIdObj,
      });
      following = false;
    } else {
      await followCollection.insertOne({
        followerId: currentUserIdObj,
        followingId: userToFollowIdObj,
        createdAt: new Date(),
      });
      following = true;
      
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

    // Get updated follower count
    const followerCount = await followCollection.countDocuments({
      followingId: userToFollowIdObj,
    });

    // Get updated following count
    const followingCount = await followCollection.countDocuments({
      followerId: currentUserIdObj, // This should be currentUserIdObj, not userToFollowIdObj
    });

    return NextResponse.json({
      following,
      followers: followerCount,
      followingCount, // Simplified
      message: following ? 'Followed' : 'Unfollowed'
    });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      following: false,
      followers: 0,
      followingCount: 0
    }, { status: 500 });
  }
}