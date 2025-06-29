// app/api/users/[id]/followers/count/route.ts
import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect';
import { toObjectId } from '@/lib/utils/objectIdConverter'; // <--- CHANGE HERE

export async function GET(req: Request, { params }: { params: { id: string } }) { // Use params
  try {
    const userId = params.id; // Correct way to get ID from dynamic route

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db('talesy');

    const userIdObj = toObjectId(userId); // Use your robust toObjectId

    if (!userIdObj) {
      console.error("Invalid user ID format provided for follower count:", userId);
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    const count = await db.collection('follows').countDocuments({
      followingId: userIdObj,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting follower count:', error);
    return NextResponse.json({ error: 'Server error', count: 0 }, { status: 500 });
  }
}