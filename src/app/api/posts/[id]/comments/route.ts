// app/api/posts/[id]/comments/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendTemplateEmail } from '@/lib/email';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    if (!userId || typeof userId !== 'string') {
      console.error('Invalid userId:', userId);
      return NextResponse.json({ error: 'Invalid user ID in session' }, { status: 400 });
    }

    const postId = params.id;

    if (!postId) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');

    // Find the post
    const post = await db.collection('writings').findOne({
      _id: new ObjectId(postId),
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Add the comment
    const comment = {
      postId,
      userId,
      content: content.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection('comments').insertOne(comment);

    // Update comment count on post
    await db.collection('writings').updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { comments: 1 } }
    );

    // Build commenterQuery safely
    let commenterQuery;
    if (ObjectId.isValid(userId)) {
      commenterQuery = { _id: new ObjectId(userId) };
    } else {
      console.error('User ID is not a valid ObjectId:', userId);
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const commenter = await db.collection('users').findOne(commenterQuery);

    if (!commenter) {
      console.warn('Commenter not found for ID:', userId);
    }

    // Don't notify for self-comments
    if (post.userId !== userId) {
      const postAuthorQuery = ObjectId.isValid(post.userId)
        ? { _id: new ObjectId(post.userId) }
        : { _id: post.userId };

      const postAuthor = await db.collection('users').findOne(postAuthorQuery);

      // Send email notification if enabled
      if (
        postAuthor &&
        postAuthor.email &&
        postAuthor.emailPreferences?.newComment !== false
      ) {
        try {
          await sendTemplateEmail(postAuthor.email, 'newComment', [
            postAuthor.name || 'User',
            commenter?.name || 'Someone',
            post.title,
            postId,
            content.trim().substring(0, 200),
          ]);
        } catch (emailError) {
          console.error('Failed to send comment notification email:', emailError);
        }
      }
    }

    return NextResponse.json({
      _id: result.insertedId,
      ...comment,
      user: {
        name: commenter?.name || 'Anonymous',
        avatar: commenter?.avatar || null,
      },
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}