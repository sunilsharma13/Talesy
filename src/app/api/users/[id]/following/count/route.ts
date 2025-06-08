import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const { params } = context;
  try {
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');

    const followerIdFilter = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    const count = await db.collection('follows').countDocuments({
      followerId: followerIdFilter,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting following count:', error);
    return NextResponse.json({ error: 'Server error', count: 0 }, { status: 500 });
  }
}
