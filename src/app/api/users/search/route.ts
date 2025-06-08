// app/api/users/search/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";

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
    
    // Search users by name and bio
    const users = await db.collection("users")
      .find({
        $or: [
          { name: { $regex: searchPattern } },
          { bio: { $regex: searchPattern } },
        ]
      })
      .project({
        _id: 1,
        name: 1,
        avatar: 1,
        bio: 1,
      })
      .limit(15)
      .toArray();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error in users search API:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}