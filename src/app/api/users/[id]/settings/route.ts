// app/api/user/settings/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Get user settings
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    const client = await clientPromise;
    const db = client.db('talesy');
    
    // Using a type-safe query with userId as string or ObjectId
    let userQuery: any;
    if (ObjectId.isValid(userId)) {
      userQuery = { _id: new ObjectId(userId) };
    } else {
      userQuery = { _id: userId };
    }
    
    const user = await db.collection('users').findOne(userQuery);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      emailPreferences: user.emailPreferences || {
        newFollower: true,
        newComment: true,
        newLike: true,
        weeklyDigest: true
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Update user settings
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { emailPreferences } = await req.json();
    
    if (!emailPreferences) {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('talesy');
    
    // Using a type-safe query with userId as string or ObjectId
    let userQuery: any;
    if (ObjectId.isValid(userId)) {
      userQuery = { _id: new ObjectId(userId) };
    } else {
      userQuery = { _id: userId };
    }
    
    await db.collection('users').updateOne(
      userQuery,
      { $set: { emailPreferences } }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}