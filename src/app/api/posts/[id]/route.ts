// app/api/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get the post ID from params
    const postId = params.id;

    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');
    const writingsCollection = db.collection('writings');

    // Find the post by ID
    const post = await writingsCollection.findOne({
      _id: new ObjectId(postId)
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the post ID from params
    const postId = params.id;

    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('talesy');
    const writingsCollection = db.collection('writings');

    // Check ownership
    const post = await writingsCollection.findOne({
      _id: new ObjectId(postId),
      userId: session.user.id,
    });

    if (!post) {
      return NextResponse.json(
        {
          error: 'Post not found',
          details: "The post may not exist or doesn't belong to you.",
        },
        { status: 404 }
      );
    }

    // Delete the post
    const result = await writingsCollection.deleteOne({
      _id: new ObjectId(postId),
    });

    if (result.deletedCount > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        {
          error: 'Failed to delete post',
          details: 'The post was found but could not be deleted.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}