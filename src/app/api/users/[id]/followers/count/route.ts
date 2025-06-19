// app/api/users/[id]/followers/count/route.ts
import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect';
// import { ObjectId } from 'mongodb'; // <--- REMOVE THIS LINE
import mongoose from 'mongoose'; // <--- ADD THIS LINE

export async function GET(
  req: Request,
  // Make sure your route handler receives `params` correctly for dynamic routes
  // For Next.js 13+ App Router, it's typically `({ params }: { params: { id: string } })`
) {
  try {
    // Better way to extract dynamic ID in Next.js App Router:
    // const userId = params.id;
    // However, sticking to your current method for minimal changes, but be aware of `params` usage.
    const urlSegments = req.url.split('/');
    const userId = urlSegments[urlSegments.indexOf('users') + 1]; // This extracts [id]

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db('talesy');

    // Use mongoose.Types.ObjectId for conversion and validation
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null; // <--- CHANGE HERE

    if (!userIdObj) { // Added explicit check for invalid ObjectId
      console.error("Invalid user ID format provided for follower count:", userId);
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    const count = await db.collection('follows').countDocuments({
      followingId: userIdObj, // Query by ObjectId
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting follower count:', error);
    return NextResponse.json({ error: 'Server error', count: 0 }, { status: 500 });
  }
}