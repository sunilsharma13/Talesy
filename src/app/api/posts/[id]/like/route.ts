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

    const currentUserId = session.user.id;
    const postId = params.id;

    const client = await clientPromise;
    const db = client.db('talesy');

    const post = await db.collection('writings').findOne({
      _id: toObjectId(postId),
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existingLike = await db.collection('likes').findOne({
      postId: toObjectId(postId),
      userId: currentUserId,
    });

    if (existingLike) {
      await db.collection('likes').deleteOne({
        postId: toObjectId(postId),
        userId: currentUserId,
      });

      const updateResult = await db.collection('writings').findOneAndUpdate(
        { _id: toObjectId(postId) },
        { $inc: { likes: -1 } },
        { returnDocument: 'after' }
      );

      return NextResponse.json({
        liked: false,
        count: updateResult.value?.likes || 0,
      });
    } else {
      await db.collection('likes').insertOne({
        postId: toObjectId(postId),
        userId: currentUserId,
        createdAt: new Date(),
      });

      const updateResult = await db.collection('writings').findOneAndUpdate(
        { _id: toObjectId(postId) },
        { $inc: { likes: 1 } },
        { returnDocument: 'after' }
      );

      if (post.userId !== currentUserId) {
        let liker = await db.collection('users').findOne({
          _id: toObjectId(currentUserId),
        });

        let author = await db.collection('users').findOne({
          _id: toObjectId(post.userId),
        });

        if (
          author &&
          author.email &&
          author.emailPreferences?.newLike !== false
        ) {
          try {
            await sendTemplateEmail(author.email, 'newLike', [
              author.name || 'User',
              liker?.name || 'Someone',
              post.title,
              postId,
            ]);
          } catch (err) {
            console.error('Failed to send like email:', err);
          }
        }
      }

      return NextResponse.json({
        liked: true,
        count: updateResult.value?.likes || 1,
      });
    }
  } catch (error) {
    console.error('Like API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
