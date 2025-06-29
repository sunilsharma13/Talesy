// src/app/api/posts/[id]/comments/[commentOrReplyId]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // IMPORTANT: Use '@/auth' as per your setup
import dbConnect from '@/lib/dbConnect'; // Adjust path if necessary

import Comment from '@/models/comment';
import CommentLike from '@/models/commentLike';

// Helper for consistent Mongoose ObjectId conversion and validation
function toMongooseObjectId(id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId {
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  throw new Error(`Invalid ID format: ${id}`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; commentOrReplyId: string } }
) {
  await dbConnect(); // Use your dbConnect
  try {
    const { commentOrReplyId: commentIdRaw } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log("[Comment Like API] Unauthorized: No user session found.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let commentId: mongoose.Types.ObjectId;
    let userId: mongoose.Types.ObjectId;

    try {
      commentId = toMongooseObjectId(commentIdRaw);
      userId = toMongooseObjectId(session.user.id);
    } catch (error: any) {
      console.error("[Comment Like API] Invalid ID format:", error.message);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      console.log(`[Comment Like API] Comment not found for ID: ${commentIdRaw}`);
      return NextResponse.json({ message: "Comment not found." }, { status: 404 });
    }

    // Check if the user has already liked this comment
    const existingLike = await CommentLike.findOne({ userId, targetId: commentId });

    let likedStatus: boolean;
    let updatedLikesCount: number;

    if (existingLike) {
      // If a like exists, delete it (unlike)
      await CommentLike.deleteOne({ _id: existingLike._id });
      likedStatus = false;
      console.log(`[Comment Like API] User ${userId} unliked comment ${commentId}`);
    } else {
      // If no like exists, create one (like)
      await CommentLike.create({ userId, targetId: commentId });
      likedStatus = true;
      console.log(`[Comment Like API] User ${userId} liked comment ${commentId}`);
    }

    // Recalculate the total likes count for the comment
    updatedLikesCount = await CommentLike.countDocuments({ targetId: commentId });
    // Update the denormalized 'likesCount' field on the Comment model
    await Comment.findByIdAndUpdate(commentId, { likesCount: updatedLikesCount }, { new: true });

    return NextResponse.json(
      { liked: likedStatus, likesCount: updatedLikesCount },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("[Comment Like API] Failed to toggle like:", error);
    return NextResponse.json(
      { message: "Failed to toggle like", details: error.message },
      { status: 500 }
    );
  }
}