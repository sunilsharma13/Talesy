// src/app/api/posts/[id]/comments/[commentOrReplyId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // IMPORTANT: Use '@/auth' as per your setup
import dbConnect from '@/lib/dbConnect'; // Adjust path if necessary

import Comment from '@/models/comment';
import CommentLike from '@/models/commentLike';

function toMongooseObjectId(id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId {
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  throw new Error(`Invalid ID format: ${id}`);
}

// --- PATCH (Edit) Comment ---
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; commentOrReplyId: string } }
) {
  await dbConnect(); // Use your dbConnect
  try {
    const { commentOrReplyId: commentIdRaw } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let commentId: mongoose.Types.ObjectId;
    let userId: mongoose.Types.ObjectId;

    try {
      commentId = toMongooseObjectId(commentIdRaw);
      userId = toMongooseObjectId(session.user.id);
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const { content } = await req.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ message: "Content is required and cannot be empty." }, { status: 400 });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return NextResponse.json({ message: "Comment not found." }, { status: 404 });
    }

    if (String(comment.userId) !== String(userId)) {
      return NextResponse.json({ message: "Forbidden: You are not the author of this comment." }, { status: 403 });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content: content.trim(), updatedAt: new Date() },
      { new: true }
    );

    if (!updatedComment) {
      return NextResponse.json({ message: "Failed to update comment." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Comment updated successfully", updatedContent: updatedComment.content, updatedAt: updatedComment.updatedAt },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Failed to edit comment:", error);
    return NextResponse.json(
      { message: "Failed to edit comment", details: error.message },
      { status: 500 }
    );
  }
}

// --- DELETE Comment ---
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentOrReplyId: string } }
) {
  await dbConnect(); // Use your dbConnect
  try {
    const { commentOrReplyId: commentIdRaw } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let commentId: mongoose.Types.ObjectId;
    let userId: mongoose.Types.ObjectId;

    try {
      commentId = toMongooseObjectId(commentIdRaw);
      userId = toMongooseObjectId(session.user.id);
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const commentToDelete = await Comment.findById(commentId);

    if (!commentToDelete) {
      return NextResponse.json({ message: "Comment not found." }, { status: 404 });
    }

    if (String(commentToDelete.userId) !== String(userId)) {
      return NextResponse.json({ message: "Forbidden: You are not the author of this comment." }, { status: 403 });
    }

    // Function to recursively find all descendant comment IDs
    const getAllDescendantCommentIds = async (parentId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> => {
      const replies = await Comment.find({ parentId: parentId }).select('_id').lean();
      let descendantIds = replies.map(reply => reply._id);

      for (const reply of replies) {
        const nestedReplyIds = await getAllDescendantCommentIds(reply._id);
        descendantIds = descendantIds.concat(nestedReplyIds);
      }
      return descendantIds;
    };

    // If it's a top-level comment (no parentId), delete it and all its direct and nested replies
    if (!commentToDelete.parentId) {
      const commentsToDeleteIds = await getAllDescendantCommentIds(commentToDelete._id);
      commentsToDeleteIds.push(commentToDelete._id); // Include the parent itself

      await CommentLike.deleteMany({ targetId: { $in: commentsToDeleteIds } }); // Delete all likes for these comments
      await Comment.deleteMany({ _id: { $in: commentsToDeleteIds } }); // Delete the comments themselves

    } else {
      // If it's a reply, just delete this specific reply and its likes
      await CommentLike.deleteMany({ targetId: commentId });
      await Comment.deleteOne({ _id: commentToDelete._id });
    }

    return NextResponse.json({ message: "Comment and its replies (and their likes) deleted successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { message: "Failed to delete comment", details: error.message },
      { status: 500 }
    );
  }
}