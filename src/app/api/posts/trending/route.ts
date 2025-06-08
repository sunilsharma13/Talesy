// app/api/posts/trending/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("talesy");
    
    // Find published stories with the most likes and comments
    const stories = await db.collection("writings")
      .find({ status: "published" })
      .sort({ likes: -1, comments: -1, createdAt: -1 })
      .limit(6)
      .toArray();
    
    // Enhance stories with author information
    const enhancedStories = await Promise.all(
      stories.map(async (story) => {
        const userId = story.userId;
        
        // Get user data
        let user = null;
        
        if (userId) {
          const userIdFilter = ObjectId.isValid(userId) 
            ? { _id: new ObjectId(userId) } 
            : { _id: userId };
          
          user = await db.collection("users").findOne(
            userIdFilter,
            { projection: { _id: 1, name: 1, avatar: 1 } }
          );
        }
        
        return {
          ...story,
          user: user || { name: "Unknown User" }
        };
      })
    );
    
    return NextResponse.json(enhancedStories);
  } catch (error) {
    console.error("Error fetching trending stories:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}