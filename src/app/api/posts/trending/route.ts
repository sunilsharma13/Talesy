// app/api/posts/trending/route.ts
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/dbConnect"; // <--- Change here
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const client = await getMongoClient(); // <--- Change here
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
          // Ensure userId is a valid ObjectId before querying
          const userIdFilter = ObjectId.isValid(userId) 
            ? { _id: new ObjectId(userId) } 
            : { _id: userId }; // Fallback if userId is already an ObjectId instance (less common with NextAuth IDs)
          
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