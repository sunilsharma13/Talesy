// app/api/posts/[id]/comments/route.ts
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

    const post = await db.collection('writings').findOne({
      _id: new ObjectId(postId),
    });

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

    await db.collection('writings').updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { comments: 1 } }
    );

    let commenter: WithId<Document> | null = null;
if (ObjectId.isValid(userId)) {
  try {
    commenter = await db.collection('users').findOne({
      _id: new ObjectId(userId),
    });
  } catch (err) {
    console.error('Failed to fetch commenter:', err);
  }
} else {
  console.error('Invalid ObjectId for commenter:', userId);
}


    if (post.userId !== userId) {
      let postAuthor: WithId<Document> | null = null;
      try {
        postAuthor = await db.collection('users').findOne({
          _id: ObjectId.isValid(post.userId) ? new ObjectId(post.userId) : post.userId,
        });
      } catch (err) {
        console.error('Failed to fetch post author:', err);
      }

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
