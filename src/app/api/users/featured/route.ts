// app/api/users/featured/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("talesy");
    
    // Get users who have written the most stories or have the most followers
    // First get users with the most followers
    const followCounts = await db.collection("follows")
      .aggregate([
        { $group: { _id: "$followingId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
      .toArray();
    
    // Get user details for these users
    const featuredUsers = await Promise.all(
      followCounts.map(async (item) => {
        const userId = item._id;
        
        if (!userId) return null;
        
        const userIdFilter = ObjectId.isValid(userId) 
          ? { _id: new ObjectId(userId) } 
          : { _id: userId };
        
        const user = await db.collection("users").findOne(userIdFilter);
        
        if (!user) return null;
        
        return {
          _id: user._id,
          name: user.name || "Anonymous User",
          avatar: user.avatar || null,
          bio: user.bio || null
        };
      })
    );
    
    // Filter out null values
    const validUsers = featuredUsers.filter(user => user !== null);
    
    return NextResponse.json(validUsers.slice(0, 8));
  } catch (error) {
    console.error("Error fetching featured users:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}