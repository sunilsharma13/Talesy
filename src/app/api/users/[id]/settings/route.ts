// app/api/user/settings/route.ts
import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect'; // Keep this import
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
// import { ObjectId } from 'mongodb'; // <--- REMOVE THIS LINE
import mongoose from 'mongoose'; // <--- Add this import

// Helper function to safely convert to ObjectId, or return null if invalid (Updated)
function safeToObjectId(id: string | mongoose.Types.ObjectId | undefined | null): mongoose.Types.ObjectId | null { // <--- Change type
  if (id === undefined || id === null) {
    return null;
  }
  if (id instanceof mongoose.Types.ObjectId) { // <--- Check against mongoose.Types.ObjectId
    return id;
  }
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) { // <--- Use mongoose.Types.ObjectId.isValid
    return new mongoose.Types.ObjectId(id); // <--- Create mongoose.Types.ObjectId
  }
  return null;
}

// Get user settings
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Safely convert session userId to ObjectId
    const userId = safeToObjectId(session.user.id);
    
    if (!userId) {
        console.error("Session user ID is not a valid ObjectId:", session.user.id);
        return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    const client = await getMongoClient(); // Use getMongoClient
    const db = client.db('talesy');
    
    // Query directly with the ObjectId
    const user = await db.collection('users').findOne({ _id: userId });
    
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
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Safely convert session userId to ObjectId
    const userId = safeToObjectId(session.user.id);
    const { emailPreferences } = await req.json();
    
    if (!userId) {
        console.error("Session user ID is not a valid ObjectId:", session.user.id);
        return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    if (!emailPreferences || typeof emailPreferences !== 'object') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
    }
    
    const client = await getMongoClient(); // Use getMongoClient
    const db = client.db('talesy');
    
    // Update directly with the ObjectId
    await db.collection('users').updateOne(
      { _id: userId },
      { $set: { emailPreferences } }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}