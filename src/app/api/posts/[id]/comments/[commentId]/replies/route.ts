// app/api/posts/[id]/comments/[commentId]/replies/route.ts
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

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 });
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

    const reply = {
      postId,
      commentId,
      userId,
      content: content.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection('replies').insertOne(reply);

    // Get user info to return with the reply
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    return NextResponse.json({
      _id: result.insertedId,
      ...reply,
      user: {
        name: user?.name || 'Anonymous',
        avatar: user?.avatar || null,
      },
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { id: postId, commentId } = params;

    if (!ObjectId.isValid(postId) || !ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');

    const replies = await db
      .collection('replies')
      .find({ commentId })
      .sort({ createdAt: 1 })
      .toArray();

    // Get user info for all replies
    const userIds = replies.map(r => r.userId);
    const users = await db
      .collection('users')
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .toArray();

    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const populatedReplies = replies.map(reply => {
      const user = userMap.get(reply.userId.toString());
      return {
        ...reply,
        user: {
          name: user?.name || 'Anonymous',
          avatar: user?.avatar || null,
        },
      };
    });

    return NextResponse.json(populatedReplies);
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}