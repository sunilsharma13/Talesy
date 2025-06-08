// app/api/posts/search/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    
    if (!query) {
      return NextResponse.json([], { status: 200 });
    }

    const client = await clientPromise;
    const db = client.db("talesy");
    
    // Create a case-insensitive regex search pattern
    const searchPattern = new RegExp(query, 'i');
    
    // Search stories by title and content, only published ones
    const stories = await db.collection("writings")
      .find({
        status: "published",
        $or: [
          { title: { $regex: searchPattern } },
          { content: { $regex: searchPattern } },
        ]
      })
      .sort({ createdAt: -1 })
      .limit(15)
      .toArray();
    
    // Enhance stories with author information
    const enhancedStories = await Promise.all(
      stories.map(async (story) => {
        const userId = story.userId;
        
        // Get user data
        const userIdFilter = ObjectId.isValid(userId) 
          ? { _id: new ObjectId(userId) } 
          : { _id: userId };
          
        const user = await db.collection("users").findOne(
          userIdFilter,
          { projection: { _id: 1, name: 1, avatar: 1 } }
        );
        
        // Add like and comment counts
        const likeCount = await db.collection("likes")
          .countDocuments({ postId: story._id.toString() });
          
        const commentCount = await db.collection("comments")
          .countDocuments({ postId: story._id.toString() });
        
        return {
          ...story,
          likes: likeCount,
          comments: commentCount,
          user: user || { name: "Unknown User" }
        };
      })
    );
    
    return NextResponse.json(enhancedStories);
  } catch (error) {
    console.error("Error in posts search API:", error);
    return NextResponse.json({ error: "Failed to search stories" }, { status: 500 });
  }
}