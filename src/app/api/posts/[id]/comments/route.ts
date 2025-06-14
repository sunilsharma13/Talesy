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
    console.log("POST comment - starting");
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    const postIdRaw = params.id;
    console.log("Comment for post ID:", postIdRaw);

    if (!ObjectId.isValid(postIdRaw)) {
      return NextResponse.json({ error: 'Invalid post ID format' }, { status: 400 });
    }

    const postId = new ObjectId(postIdRaw);
    const userId = session.user.id;

    const client = await clientPromise;
    const db = client.db('talesy');

    const post = await db.collection('writings').findOne({ _id: postId });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comment = {
      postId: postIdRaw,
      userId,
      content: content.trim(),
      createdAt: new Date(),
    };

    console.log("Inserting comment:", comment);
    const result = await db.collection('comments').insertOne(comment);
    console.log("Comment inserted, ID:", result.insertedId);

    // Ensure postId is properly formatted for the update
    const updateResult = await db.collection('writings').updateOne(
      { _id: postId },
      { $inc: { comments: 1 } }
    );
    
    console.log("Updated post comment count:", updateResult);

    const commenter = await db.collection('users').findOne({ _id: toObjectId(userId) });

    // Send email to post author if not commenting on own post
    if (post.userId !== userId) {
      const postAuthor = await db.collection('users').findOne({ _id: toObjectId(post.userId) });

      if (postAuthor?.email && postAuthor.emailPreferences?.newComment !== false) {
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
    console.error('Comment POST error:', {
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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    console.log("GET comments - starting");
    const postIdRaw = params.id;
    console.log("Getting comments for post:", postIdRaw);

    if (!ObjectId.isValid(postIdRaw)) {
      return NextResponse.json({ error: 'Invalid post ID format' }, { status: 400 });
    }

    const postId = new ObjectId(postIdRaw);

    const client = await clientPromise;
    const db = client.db('talesy');

    const comments = await db
      .collection('comments')
      .find({ postId: postIdRaw })
      .sort({ createdAt: 1 }) // oldest to newest
      .toArray();

    console.log(`Found ${comments.length} comments`);

    if (comments.length > 0) {
      // Get all user IDs from comments
      const userIds = comments.map((c) => {
        try {
          return toObjectId(c.userId);
        } catch (e) {
          console.error("Invalid user ID:", c.userId);
          return null;
        }
      }).filter(id => id !== null);
      
      const users = await db
        .collection('users')
        .find({ _id: { $in: userIds } })
        .toArray();

      console.log(`Found ${users.length} users for comments`);

      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      const populatedComments = comments.map((comment) => {
        const user = userMap.get(comment.userId.toString());
        return {
          _id: comment._id,
          content: comment.content,
          userId: comment.userId,
          postId: comment.postId,
          createdAt: comment.createdAt,
          user: {
            name: user?.name || "Anonymous",
            avatar: user?.avatar || null,
          },
        };
      });

      return NextResponse.json(populatedComments);
    } else {
      return NextResponse.json([]);
    }
  } catch (err) {
    console.error('Comment GET error:', {
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