// app/api/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get and validate the ID
    const postId = params.id;
    if (!postId) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('talesy');
    
    // Use the "writings" collection instead of "posts"
    const writingsCollection = db.collection('writings');
    
    // First, verify the post exists and belongs to the user
    let post;
    if (ObjectId.isValid(postId)) {
      post = await writingsCollection.findOne({
        _id: new ObjectId(postId),
        userId: session.user.id
      });
    }
    
    if (!post) {
      console.log(`Post not found or doesn't belong to user. ID: ${postId}, User: ${session.user.id}`);
      return NextResponse.json({ 
        error: 'Post not found',
        details: 'The post may have been deleted or you don\'t have permission to delete it.'
      }, { status: 404 });
    }
    
    // Now delete the post
    const result = await writingsCollection.deleteOne({
      _id: new ObjectId(postId),
      userId: session.user.id
    });
    
    console.log('Delete result:', result);
    
    if (result.deletedCount > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        error: 'Failed to delete post',
        details: 'The post was found but could not be deleted.'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}