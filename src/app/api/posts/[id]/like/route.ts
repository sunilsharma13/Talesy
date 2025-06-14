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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session:", session);
    console.log("User ID:", session?.user?.id);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postIdRaw = params.id;

    if (!ObjectId.isValid(postIdRaw)) {
      return NextResponse.json({ error: 'Invalid post ID format' }, { status: 400 });
    }
    
    const postId = new ObjectId(postIdRaw);
    const userId = session.user.id;

    const client = await clientPromise;
    const db = client.db('talesy');

    // Check if the post exists
    const post = await db.collection('writings').findOne({ _id: postId });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    console.log("Checking existing likes...");
    
    // Check if the user has already liked this post
    const existingLike = await db.collection('likes').findOne({ 
      postId: postIdRaw,
      userId 
    });

    console.log("Existing like check:", existingLike);

    if (existingLike) {
      console.log("User already liked this post, removing like...");
      // User has already liked, so remove the like
      await db.collection('likes').deleteOne({ _id: existingLike._id });
      
      // Decrement the like count in the post
      const result = await db.collection('writings').findOneAndUpdate(
        { _id: postId },
        { $inc: { likes: -1 } },
        { returnDocument: 'after' }
      );

      console.log("Like removed, updated post:", result.value);

      return NextResponse.json({
        liked: false,
        count: result.value?.likes || 0,
      });
    } else {
      console.log("Adding new like");
      // User hasn't liked, so add a new like
      await db.collection('likes').insertOne({
        postId: postIdRaw,
        userId,
        createdAt: new Date(),
      });

      // Increment the like count in the post
      const result = await db.collection('writings').findOneAndUpdate(
        { _id: postId },
        { $inc: { likes: 1 } },
        { returnDocument: 'after' }
      );

      console.log("Like added, updated post:", result.value);

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
    console.error('Like API error:', {
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