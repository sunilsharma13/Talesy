// src/app/api/posts/[id]/like/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect'; // Assuming this is your standard MongoDB client connection
import { ObjectId } from 'mongodb'; // Ensure this is the ONLY ObjectId import for consistency
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendTemplateEmail } from '@/lib/email';

// Helper to convert to ObjectId, ensuring consistency
function toValidObjectId(id: string | ObjectId | any): ObjectId {
  if (id && typeof id === 'object' && id.toString) {
    const idString = id.toString();
    if (ObjectId.isValid(idString)) {
      return new ObjectId(idString);
    }
  }

  if (typeof id === 'string') {
    if (ObjectId.isValid(id)) {
      return new ObjectId(id);
    } else {
      console.warn(`toValidObjectId received an invalid ObjectId string: ${id}`);
      throw new Error(`Invalid ID format provided for ObjectId conversion: ${id}`);
    }
  }

  throw new Error('Invalid ID type provided for ObjectId conversion. Input was not a valid string or an ObjectId-like object.');
}

// POST to like/unlike
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  console.log(`[LIKE API] POST request received for postId: ${context.params.id}`);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.warn(`[LIKE API] Unauthorized access attempt for postId: ${context.params.id}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postIdRaw = context.params.id;

    if (!ObjectId.isValid(postIdRaw)) {
      console.error(`[LIKE API] Invalid post ID format received: ${postIdRaw}`);
      return NextResponse.json({ error: 'Invalid post ID format' }, { status: 400 });
    }
    const postId = toValidObjectId(postIdRaw);

    const userIdString = session.user.id;
    const userId = toValidObjectId(userIdString);

    const client = await getMongoClient(); // Use getMongoClient for direct MongoDB operations
    const db = client.db('talesy'); // Your database name

    // Crucial step: find the post in the 'writings' collection
    const post = await db.collection('writings').findOne({ _id: postId });
    if (!post) {
      console.warn(`[LIKE API] Post not found in 'writings' collection for ID: ${postIdRaw}`);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    let postAuthorObjectId: ObjectId;
    try {
        postAuthorObjectId = toValidObjectId(post.author);
    } catch (e) {
        console.error("[LIKE API] Error converting post.author to ObjectId:", post.author, e);
        return NextResponse.json({ error: 'Internal Server Error: Malformed post author ID' }, { status: 500 });
    }

    const existingLike = await db.collection('likes').findOne({
      postId: postId,
      userId: userId
    });

    let likedStatus: boolean;
    let newLikesCount: number;

    if (existingLike) {
      // Unlike the post
      await db.collection('likes').deleteOne({ _id: existingLike._id });
      const result = await db.collection('writings').findOneAndUpdate(
        { _id: postId },
        { $inc: { likes: -1 } },
        { returnDocument: 'after' }
      );
      likedStatus = false;
      newLikesCount = result.value?.likes || 0;
      console.log(`[LIKE API] Post unliked by user ${userIdString}. New likes: ${newLikesCount}`);
    } else {
      // Like the post
      await db.collection('likes').insertOne({
        postId: postId,
        userId: userId,
        createdAt: new Date(),
      });
      const result = await db.collection('writings').findOneAndUpdate(
        { _id: postId },
        { $inc: { likes: 1 } },
        { returnDocument: 'after' }
      );
      likedStatus = true;
      newLikesCount = result.value?.likes || 1;
      console.log(`[LIKE API] Post liked by user ${userIdString}. New likes: ${newLikesCount}`);

      // Send notification email if liked and not by the author themselves
      if (!userId.equals(postAuthorObjectId)) {
          const authorDoc = await db.collection('users').findOne({ _id: postAuthorObjectId });
          const likerDoc = await db.collection('users').findOne({ _id: userId });

          if (authorDoc?.email && authorDoc.emailPreferences?.newLike !== false) {
            try {
              await sendTemplateEmail(authorDoc.email, 'newLike', [
                authorDoc.name || 'User',
                likerDoc?.name || 'Someone',
                post.title,
                postIdRaw,
              ]);
              console.log(`[LIKE API] New like email sent to author ${authorDoc.email}`);
            } catch (e) {
              console.error('[LIKE API] Like notification email failed:', e);
            }
          }
      }
    }

    return NextResponse.json({
      liked: likedStatus,
      likesCount: newLikesCount,
    }, { status: 200 });

  } catch (err) {
    console.error('[LIKE API] Error processing POST request:', {
      error: err,
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    });

    return NextResponse.json({
      error: 'Server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET to check if current user has liked the story and total likes
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  console.log(`[LIKE API] GET request received for postId: ${context.params.id}`);

  try {
    const session = await getServerSession(authOptions);
    const userIdRaw = session?.user?.id;
    let userId: ObjectId | null = null;
    if (userIdRaw && ObjectId.isValid(userIdRaw)) {
        userId = toValidObjectId(userIdRaw);
    }

    const postIdRaw = context.params.id;
    if (!ObjectId.isValid(postIdRaw)) {
      return NextResponse.json({ error: 'Invalid post ID format' }, { status: 400 });
    }
    const postId = toValidObjectId(postIdRaw);

    const client = await getMongoClient();
    const db = client.db('talesy');

    const post = await db.collection('writings').findOne({ _id: postId });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const totalLikes = post.likes || 0;
    let userHasLiked = false;

    if (userId) {
      const existingLike = await db.collection('likes').findOne({
        postId: postId,
        userId: userId
      });
      userHasLiked = !!existingLike;
    }

    return NextResponse.json({
      totalLikes: totalLikes,
      userHasLiked: userHasLiked
    }, { status: 200 });

  } catch (err) {
    console.error('[LIKE API] Error processing GET request:', {
      error: err,
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    });

    return NextResponse.json({
      error: 'Server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}