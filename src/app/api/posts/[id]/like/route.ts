// app/api/posts/[id]/like/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId, type WithId, type Document } from 'mongodb';
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

    const currentUserId = session.user.id;
    const postId = params.id;

    if (!postId) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');

    const post = await db.collection('writings').findOne({
      _id: new ObjectId(postId),
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existingLike = await db.collection('likes').findOne({
      postId,
      userId: currentUserId,
    });

    if (existingLike) {
      await db.collection('likes').deleteOne({
        postId,
        userId: currentUserId,
      });

      await db.collection('writings').updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { likes: -1 } }
      );

      return NextResponse.json({
        liked: false,
        count: (post.likes || 1) - 1,
      });
    } else {
      await db.collection('likes').insertOne({
        postId,
        userId: currentUserId,
        createdAt: new Date(),
      });

      await db.collection('writings').updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { likes: 1 } }
      );

      if (post.userId !== currentUserId) {
        let liker: WithId<Document> | null = null;
        let author: WithId<Document> | null = null;
      
        if (ObjectId.isValid(currentUserId)) {
          try {
            liker = await db.collection('users').findOne({
              _id: new ObjectId(currentUserId),
            });
          } catch (err) {
            console.error('Failed to fetch liker:', err);
          }
        } else {
          console.error('Invalid ObjectId for liker:', currentUserId);
        }
      
        if (ObjectId.isValid(post.userId)) {
          try {
            author = await db.collection('users').findOne({
              _id: new ObjectId(post.userId),
            });
          } catch (err) {
            console.error('Failed to fetch author:', err);
          }
        } else {
          console.error('Invalid ObjectId for author:', post.userId);
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
        count: (post.likes || 0) + 1,
      });
    }
  } catch (error) {
    console.error('Error in like API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
