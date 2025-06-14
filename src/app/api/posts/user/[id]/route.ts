// src/app/api/posts/user/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    const client = await clientPromise;
    const db = client.db("talesy");
    
    // Get all writings by this user from the "writings" collection
    // Note: Using the "writings" collection as that's where your stories are stored
    const posts = await db
      .collection("writings")
      .find({ 
        userId: userId.toString(),
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}