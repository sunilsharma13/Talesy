import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const userId = segments[3]; // /api/users/[id]

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');
    const userCollection = db.collection('users');

    let user = null;

    // Find by _id only if valid ObjectId
    if (ObjectId.isValid(userId)) {
      user = await userCollection.findOne({ _id: new ObjectId(userId) });
    }

    // Fallback: try userId field (if your users have a custom `userId`)
    if (!user) {
      user = await userCollection.findOne({ userId: userId });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name || 'Anonymous User',
      avatar: user.avatar || null,
      bio: user.bio || null,
    });
  } catch (error) {
    console.error('GET /users/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
