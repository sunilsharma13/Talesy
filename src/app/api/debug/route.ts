// app/api/debug/route.ts
import { NextResponse } from 'next/server';
import { getMongoClient } from "@/lib/dbConnect"; // Corrected import
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb'; // ObjectId class ko import karein

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // Security check: Only authenticated users can access this debug endpoint
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: Debug access requires authentication.' }, { status: 401 });
    }
    
    const client = await getMongoClient(); // Corrected client access
    const db = client.db('talesy');
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Find a collection that might contain posts (prioritize 'writings' if it exists)
    let postsCollectionName = 'posts'; // default assumption
    if (collectionNames.includes('writings')) {
      postsCollectionName = 'writings';
    } else {
      // Try to find a more likely posts collection based on common naming conventions
      for (const name of collectionNames) {
        if (name.toLowerCase().includes('post') || 
            name.toLowerCase().includes('story') || 
            name.toLowerCase().includes('writing')) {
          postsCollectionName = name;
          break;
        }
      }
    }
    
    // Initialize samplePosts with a type for better type inference
    let samplePosts: any[] = []; 
    let totalPostsCount = 0;
    let userHasPosts = false;

    // Only proceed if the identified collection actually exists in the database
    if (collectionNames.includes(postsCollectionName)) {
        samplePosts = await db.collection(postsCollectionName)
            .find({})
            .limit(3)
            .toArray();
        
        // Anonymize any sensitive data for safety before sending
        samplePosts = samplePosts.map(post => { 
            const sanitized = { ...post }; // Create a shallow copy to avoid modifying original
            if (sanitized.email) sanitized.email = '***@***.com';
            if (sanitized.password) sanitized.password = '********';
            // Add more sensitive fields to anonymize if needed (e.g., social security numbers, private tokens)
            return sanitized;
        });

        // Get total count of documents
        totalPostsCount = await db.collection(postsCollectionName).countDocuments();
        
        // Handle session user ID: session.user.id is usually a string
        let currentUserId: ObjectId | undefined;
        // Check if it's a valid ObjectId string
        if (typeof session.user.id === 'string' && ObjectId.isValid(session.user.id)) {
            currentUserId = new ObjectId(session.user.id);
        } 
        // Removed 'else if (session.user.id instanceof ObjectId)'
        // because session.user.id is generally a string, not an ObjectId instance.
        // This was likely the source of your type error on that line.

        if (currentUserId) { // Only query for user posts if a valid ObjectId was obtained
            const userPostsQuery = await db.collection(postsCollectionName)
              .find({ userId: currentUserId })
              .limit(1)
              .toArray();
            userHasPosts = userPostsQuery.length > 0;
        } else {
            console.warn("Debug API: Session user ID is not a valid ObjectId string for querying user posts, skipping user post check.");
        }
    } else {
        console.warn(`Debug API: Identified posts collection '${postsCollectionName}' does not exist, skipping data queries.`);
    }

    return NextResponse.json({
      collectionNames,
      likelyPostsCollection: postsCollectionName,
      sampleDocuments: samplePosts, // <-- Yeh line ab theek honi chahiye
      totalDocuments: totalPostsCount,
      userHasPosts: userHasPosts,
      sessionUserId: session.user.id
    });
  } catch (error: any) { // Type 'any' for error to handle different error types
    console.error('Debug API error:', error.message || error);
    return NextResponse.json({ 
      error: 'Server error', 
      message: error.message || 'Unknown error during debug API execution' 
    }, { status: 500 });
  }
}