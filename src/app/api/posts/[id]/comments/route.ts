// src/app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // IMPORTANT: Use '@/auth' as per your setup
import dbConnect from '@/lib/dbConnect'; // Adjust path if necessary

import Comment from '@/models/comment';
import User from '@/models/user';
import Post from '@/models/post';
import CommentLike from '@/models/commentLike';

// Helper for consistent Mongoose ObjectId conversion and validation
function toMongooseObjectId(id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId {
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  throw new Error(`Invalid ID format: ${id}`);
}

// Recursive function to build comment tree
function buildCommentTree(
  comments: any[],
  parentId: mongoose.Types.ObjectId | null = null,
  currentUserLikes: Set<string>
): any[] {
  const nestedComments = [];

  for (const comment of comments) {
    const commentParentId = comment.parentId ? comment.parentId.toString() : null;
    const targetParentId = parentId ? parentId.toString() : null;

    if (commentParentId === targetParentId) {
      const children = buildCommentTree(
        comments,
        toMongooseObjectId(comment._id),
        currentUserLikes
      );

      const isLikedByCurrentUser = currentUserLikes.has(comment._id.toString());

      nestedComments.push({
        _id: comment._id.toString(),
        content: comment.content,
        userId: comment.userId.toString(),
        postId: comment.postId.toString(),
        parentId: comment.parentId ? comment.parentId.toString() : null,
        likesCount: comment.likesCount,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt ? comment.updatedAt.toISOString() : comment.createdAt.toISOString(),
        user: { // Ensure 'image' is picked up for avatar
          _id: comment.user?._id?.toString(),
          name: comment.user?.name || 'Anonymous',
          image: comment.user?.image || null, // Ensure this matches User model's avatar field (image or avatar)
        },
        isLikedByCurrentUser,
        replies: children.length > 0 ? children : undefined,
      });
    }
  }
  return nestedComments;
}

// --- GET: Fetch all comments for a post, structured as a tree ---
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect(); // Use your dbConnect
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id ? toMongooseObjectId(session.user.id) : null;

    let postId: mongoose.Types.ObjectId;
    try {
      postId = toMongooseObjectId(params.id);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const commentsAndReplies = await Comment.aggregate([
      { $match: { postId: postId } },
      {
        $lookup: {
          from: 'users', // Collection name for your User model (usually lowercase plural of model name)
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true // Keep comments even if user not found (though should not happen with required userId)
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          userId: 1,
          postId: 1,
          parentId: 1,
          likesCount: 1,
          createdAt: 1,
          updatedAt: 1,
          'user._id': '$user._id',
          'user.name': '$user.name',
          'user.image': '$user.image', // Project 'image' for avatar
          'user.avatar': '$user.avatar', // Project 'avatar' for avatar (if used)
        },
      },
      { $sort: { createdAt: 1 } },
    ]);

    const likedCommentIds = new Set<string>();
    if (currentUserId) {
      const commentObjectIds = commentsAndReplies.map(c => toMongooseObjectId(c._id));
      const userLikes = await CommentLike.find({
        userId: currentUserId,
        targetId: { $in: commentObjectIds }
      }).select('targetId').lean();
      userLikes.forEach(like => likedCommentIds.add(like.targetId.toString()));
    }

    const structuredComments = buildCommentTree(commentsAndReplies, null, likedCommentIds);

    return NextResponse.json(structuredComments, { status: 200 });
  } catch (err) {
    console.error('Comment GET error:', err);
    return NextResponse.json({
      error: 'Server error fetching comments',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

// --- POST: Create a new comment or reply ---
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect(); // Use your dbConnect
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, parentId } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    let postId: mongoose.Types.ObjectId;
    let userId: mongoose.Types.ObjectId;
    try {
      postId = toMongooseObjectId(params.id);
      userId = toMongooseObjectId(session.user.id);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const postExists = await Post.findById(postId);
    if (!postExists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    let validParentId: mongoose.Types.ObjectId | null = null;
    if (parentId) {
      try {
        validParentId = toMongooseObjectId(parentId);
        const parentComment = await Comment.findById(validParentId).lean();
        if (!parentComment || parentComment.postId.toString() !== postId.toString()) {
          return NextResponse.json({ error: 'Parent comment not found or does not belong to this post' }, { status: 404 });
        }
      } catch (error: any) {
        return NextResponse.json({ error: `Invalid parent comment ID: ${error.message}` }, { status: 400 });
      }
    }

    const newCommentDoc = new Comment({
      postId,
      userId,
      content: content.trim(),
      parentId: validParentId,
      likesCount: 0,
    });

    const savedComment = await newCommentDoc.save();

    // Increment comment count on the post (only for top-level comments)
    if (!validParentId) {
      await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } });
    }

    // Populate user info for response
    // Fetch user details for the response to avoid another API call from frontend
    const commenter = await User.findById(userId).select('name image avatar').lean(); // Include avatar if it's a separate field

    return NextResponse.json({
      _id: savedComment._id.toString(),
      content: savedComment.content,
      userId: savedComment.userId.toString(),
      postId: savedComment.postId.toString(),
      parentId: savedComment.parentId?.toString() || null,
      likesCount: savedComment.likesCount,
      createdAt: savedComment.createdAt.toISOString(),
      updatedAt: savedComment.updatedAt.toISOString(),
      user: {
        _id: commenter?._id.toString(),
        name: commenter?.name || 'Anonymous',
        image: commenter?.image || commenter?.avatar || null, // Prioritize 'image' from providers, fallback to 'avatar' if available
      },
      isLikedByCurrentUser: false,
    }, { status: 201 });

  } catch (err) {
    console.error('Comment POST error:', err);
    return NextResponse.json({
      error: 'Server error posting comment',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}