// app/api/posts/[id]/comments/[commentId]/like/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId, commentId } = params;

    if (!ObjectId.isValid(postId) || !ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const userId = session.user.id;

    const client = await clientPromise;
    const db = client.db('talesy');

    // Check if post and comment exist
    const post = await db.collection('writings').findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comment = await db.collection('comments').findOne({ _id: new ObjectId(commentId) });
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user has already liked this comment
    const existingLike = await db.collection('commentLikes').findOne({
      commentId,
      userId
    });

    if (existingLike) {
      // User has already liked, so remove the like
      await db.collection('commentLikes').deleteOne({ _id: existingLike._id });
      
      // Update like count on the comment
      await db.collection('comments').updateOne(
        { _id: new ObjectId(commentId) },
        { $inc: { likes: -1 } }
      );
      
      return NextResponse.json({
        liked: false,
        message: 'Like removed'
      });
    } else {
      // Add new like
      await db.collection('commentLikes').insertOne({
        commentId,
        userId,
        postId,
        createdAt: new Date()
      });
      
      // Update like count on the comment
      await db.collection('comments').updateOne(
        { _id: new ObjectId(commentId) },
        { $inc: { likes: 1 } }
      );
      
      return NextResponse.json({
        liked: true,
        message: 'Comment liked successfully'
      });
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET method to check if the current user has liked a comment
export async function GET(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId, commentId } = params;
    const userId = session.user.id;

    const client = await clientPromise;
    const db = client.db('talesy');

    // Check if the user has liked this comment
    const like = await db.collection('commentLikes').findOne({
      commentId,
      userId
    });

    return NextResponse.json({
      liked: !!like // Convert to boolean
    });
  } catch (error) {
    console.error('Error checking comment like status:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}