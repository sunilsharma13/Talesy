// Fix for the users/[id]/route.ts file
// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('talesy');
    
    // Find the user using a simple approach avoiding variable type issues
    let user = null;
    
    // Try with ObjectId if valid
    if (ObjectId.isValid(userId)) {
      try {
        // @ts-ignore - Ignore TypeScript error for _id type
        user = await db.collection('users').findOne({ "_id": new ObjectId(userId) });
      } catch (error) {
        console.error("Error finding user by ObjectId:", error);
      }
    }
    
    // If not found, try with string ID
    if (!user) {
      try {
        // @ts-ignore - Ignore TypeScript error for _id type
        user = await db.collection('users').findOne({ "_id": userId });
      } catch (error) {
        console.error("Error finding user by string ID:", error);
      }
    }
    
    // If still not found, try with userId field
    if (!user) {
      try {
        user = await db.collection('users').findOne({ userId: userId });
      } catch (error) {
        console.error("Error finding user by userId field:", error);
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return sanitized user information
    return NextResponse.json({
      _id: user._id instanceof ObjectId ? user._id.toString() : user._id,
      name: user.name || 'Anonymous User',
      avatar: user.avatar || null,
      bio: user.bio || null
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}