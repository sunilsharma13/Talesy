// src/app/api/posts/user/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    await dbConnect();
    // Yahan change kiya hai: mongoose.connection.db!
    const db = mongoose.connection.db!;
    
    const posts = await db
      .collection("writings")
      .find({ 
        userId: new ObjectId(userId), 
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}