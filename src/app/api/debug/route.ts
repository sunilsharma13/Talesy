// app/api/debug/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db('talesy');
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Find a collection that might contain posts
    let postsCollection = 'posts'; // default assumption
    
    // Try to find a more likely posts collection
    for (const name of collectionNames) {
      if (name.toLowerCase().includes('post') || 
          name.toLowerCase().includes('story') || 
          name.toLowerCase().includes('writing')) {
        postsCollection = name;
        break;
      }
    }
    
    // Get sample documents from the likely posts collection
    const samplePosts = await db.collection(postsCollection)
      .find({})
      .limit(3)
      .toArray();
    
    // Anonymize any sensitive data
    const sanitizedPosts = samplePosts.map(post => {
      if (post.email) post.email = '***@***.com';
      if (post.password) post.password = '********';
      return post;
    });
    
    // Get total count of documents
    const totalPostsCount = await db.collection(postsCollection).countDocuments();
    
    // Check if there are any posts owned by the current user
    const userPosts = await db.collection(postsCollection)
      .find({ userId: session.user.id })
      .limit(1)
      .toArray();
    
    return NextResponse.json({
      collectionNames,
      likelyPostsCollection: postsCollection,
      sampleDocuments: sanitizedPosts,
      totalDocuments: totalPostsCount,
      userHasPosts: userPosts.length > 0,
      sessionUserId: session.user.id
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}