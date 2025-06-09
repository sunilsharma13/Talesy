import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendTemplateEmail } from '@/lib/email';

function toObjectId(id: string | ObjectId) {
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  if (id instanceof ObjectId) return id;
  throw new Error('Invalid ObjectId');
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    const url = new URL(request.url);
    const postIdRaw = url.pathname.split('/')[4];
    const postId = toObjectId(postIdRaw);
    const userId = session.user.id;

    const client = await clientPromise;
    const db = client.db('talesy');

    const post = await db.collection('writings').findOne({ _id: postId });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comment = {
      postId,
      userId,
      content: content.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection('comments').insertOne(comment);

    await db.collection('writings').updateOne({ _id: postId }, { $inc: { comments: 1 } });

    const commenter = await db.collection('users').findOne({ _id: toObjectId(userId) });

    if (post.userId !== userId) {
      const postAuthor = await db.collection('users').findOne({ _id: toObjectId(post.userId) });

      if (
        postAuthor?.email &&
        postAuthor.emailPreferences?.newComment !== false
      ) {
        try {
          await sendTemplateEmail(postAuthor.email, 'newComment', [
            postAuthor.name || 'User',
            commenter?.name || 'Someone',
            post.title,
            postIdRaw,
            content.trim().substring(0, 200),
          ]);
        } catch (e) {
          console.error('Email sending failed:', e);
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
  } catch (err) {
    console.error('Comment API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
