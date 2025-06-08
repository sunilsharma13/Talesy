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

    if (!postId) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');

    // Find the post by ObjectId
    const post = await db.collection('writings').findOne({
      _id: toObjectId(postId),
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if already liked by this user
    const existingLike = await db.collection('likes').findOne({
      postId: toObjectId(postId),
      userId: currentUserId,
    });

    if (existingLike) {
      // Unlike
      await db.collection('likes').deleteOne({
        postId: toObjectId(postId),
        userId: currentUserId,
      });

      // Decrement like count atomically and get updated count
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
      // Like
      await db.collection('likes').insertOne({
        postId: toObjectId(postId),
        userId: currentUserId,
        createdAt: new Date(),
      });

      // Increment like count atomically and get updated count
      const updateResult = await db.collection('writings').findOneAndUpdate(
        { _id: toObjectId(postId) },
        { $inc: { likes: 1 } },
        { returnDocument: 'after' }
      );

      // Notify author if not liking own post
      if (post.userId !== currentUserId) {
        let liker: WithId<Document> | null = null;
        let author: WithId<Document> | null = null;

        try {
          liker = await db.collection('users').findOne({
            _id: toObjectId(currentUserId),
          });
        } catch (err) {
          console.error('Failed to fetch liker:', err);
        }

        try {
          author = await db.collection('users').findOne({
            _id: toObjectId(post.userId),
          });
        } catch (err) {
          console.error('Failed to fetch author:', err);
        }

        if (author && author.email && author.emailPreferences?.newLike !== false) {
          try {
            await sendTemplateEmail(author.email, 'newLike', [
              author.name || 'User',
              liker?.name || 'Someone',
              post.title,
              postId,
            ]);
          } catch (emailError) {
            console.error('Failed to send like notification email:', emailError);
          }
        }
      }

      return NextResponse.json({
        liked: true,
        count: updateResult.value?.likes || 1,
      });
    }
  } catch (error) {
    console.error('Error in like API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
