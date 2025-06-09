import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId, WithId, Document } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendTemplateEmail } from '@/lib/email';

function toObjectId(id: string | ObjectId) {
  if (typeof id === 'string' && ObjectId.isValid(id)) {
    return new ObjectId(id);
  } else if (id instanceof ObjectId) {
    return id;
  }
  throw new Error('Invalid id');
}

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
    const postId = params.id;

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');

    const post = await db.collection('writings').findOne({
      _id: toObjectId(postId),
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comment = {
      postId: toObjectId(postId),
      userId,
      content: content.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection('comments').insertOne(comment);

    await db.collection('writings').updateOne(
      { _id: toObjectId(postId) },
      { $inc: { comments: 1 } }
    );

    let commenter = await db.collection('users').findOne({
      _id: toObjectId(userId),
    });

    if (post.userId !== userId) {
      const postAuthor = await db.collection('users').findOne({
        _id: toObjectId(post.userId),
      });

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
          console.error('Failed to send comment email:', emailError);
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
    console.error('Comment API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
