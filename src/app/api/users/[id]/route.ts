// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect'; // <--- Change here
import { ObjectId } from 'mongodb';

// Helper function for consistent ObjectId conversion
function toObjectId(id: string | ObjectId) {
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  if (id instanceof ObjectId) return id;
  throw new Error('Invalid ObjectId'); // Explicitly throw for invalid formats
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) { // Use params for cleaner ID extraction
  try {
    // Extract userId from params directly
    const userIdRaw = params.id; // Use params.id

    if (!userIdRaw) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = await getMongoClient(); // <--- Change here
    const db = client.db('talesy');
    const userCollection = db.collection('users');
    const followCollection = db.collection('follows');

    let user = null;
    let userIdObj;

    try {
      userIdObj = toObjectId(userIdRaw); // Try converting to ObjectId
    } catch (e) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    user = await userCollection.findOne({ _id: userIdObj });

    // Removed the fallback to `userId: userId` as _id should be the primary key
    // If your users collection sometimes uses 'userId' string field for ID,
    // this needs specific confirmation. Standard practice is _id.
    // If you need to search by a 'userId' string field, you would add:
    // if (!user && typeof userIdRaw === 'string') {
    //   user = await userCollection.findOne({ userId: userIdRaw });
    // }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get follower count - use userIdObj for consistency
    const followerCount = await followCollection.countDocuments({
      followingId: userIdObj,
    });

    // Get following count - use userIdObj for consistency
    const followingCount = await followCollection.countDocuments({
      followerId: userIdObj,
    });
    
    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name || 'Anonymous User',
      avatar: user.avatar || null,
      bio: user.bio || null,
      followers: followerCount,
      following: followingCount,
    });
  } catch (error) {
    console.error('GET /users/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}