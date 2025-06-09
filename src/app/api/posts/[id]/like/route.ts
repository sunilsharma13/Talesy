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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const existingLike = await db.collection('likes').findOne({ postId, userId });

    if (existingLike) {
      await db.collection('likes').deleteOne({ _id: existingLike._id });
      const result = await db.collection('writings').findOneAndUpdate(
        { _id: postId },
        { $inc: { likes: -1 } },
        { returnDocument: 'after' }
      );

      return NextResponse.json({
        liked: false,
        count: result.value?.likes || 0,
      });
    } else {
      await db.collection('likes').insertOne({
        postId,
        userId,
        createdAt: new Date(),
      });

      const result = await db.collection('writings').findOneAndUpdate(
        { _id: postId },
        { $inc: { likes: 1 } },
        { returnDocument: 'after' }
      );

      if (post.userId !== userId) {
        const author = await db.collection('users').findOne({ _id: toObjectId(post.userId) });
        const liker = await db.collection('users').findOne({ _id: toObjectId(userId) });

        if (
          author?.email &&
          author.emailPreferences?.newLike !== false
        ) {
          try {
            await sendTemplateEmail(author.email, 'newLike', [
              author.name || 'User',
              liker?.name || 'Someone',
              post.title,
              postIdRaw,
            ]);
          } catch (e) {
            console.error('Like notification failed:', e);
          }
        }
      }

      return NextResponse.json({
        liked: true,
        count: result.value?.likes || 1,
      });
    }
  } catch (err) {
    console.error('Like API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
