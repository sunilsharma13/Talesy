// app/api/tags/popular/route.ts
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/dbConnect"; // <--- Change here

export async function GET(req: Request) {
  try {
    const client = await getMongoClient(); // <--- Change here
    const db = client.db("talesy");
    
    // For demonstration, we'll return some hard-coded tags
    // In a real implementation, you'd aggregate tags from all stories
    const popularTags = [
      { name: "Fiction", count: 243 },
      { name: "Poetry", count: 189 },
      { name: "Technology", count: 156 },
      { name: "Travel", count: 134 },
      { name: "Self-improvement", count: 112 },
      { name: "Health", count: 98 },
      { name: "Science", count: 87 },
      { name: "Art", count: 76 },
    ];
    
    return NextResponse.json(popularTags);
  } catch (error) {
    console.error("Error fetching popular tags:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}