// app/api/users/[id]/followers/count/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    const userId = req.url.split('/users/')[1].split('/')[0];

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');

    const followingIdFilter = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    const count = await db.collection('follows').countDocuments({
      followingId: followingIdFilter,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting follower count:', error);
    return NextResponse.json({ error: 'Server error', count: 0 }, { status: 500 });
  }
}
