// app/api/posts/search/route.ts

// NEW: Forces dynamic rendering due to use of request.url
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/dbConnect";
import { ObjectId } from "mongodb"; // ObjectId class ko import karein

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const client = await getMongoClient();
    const db = client.db("talesy");

    const posts = await db
      .collection("writings") // Assuming this is your main posts collection
      .aggregate([
        {
          $match: {
            status: 'published', // Only search published posts
            $or: [
              { title: { $regex: query, $options: "i" } }, // Case-insensitive search on title
              { content: { $regex: query, $options: "i" } }, // Case-insensitive search on content
            ],
          },
        },
        {
          $lookup: {
            from: "users", // The users collection
            localField: "userId", // Assuming 'userId' in 'writings' is the author's _id
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true, // If a post has no author, keep the post
          },
        },
        {
          $project: {
            _id: 1, // Include _id
            title: 1,
            content: 1,
            createdAt: 1,
            imageUrl: 1,
            likes: 1, // Assuming likes field exists
            comments: 1, // Assuming comments field exists
            userId: 1, // Keep author's userId if needed
            user: {
              name: "$user.name",
              avatar: "$user.avatar",
            },
          },
        },
        { $sort: { createdAt: -1 } }, // Sort by latest first
      ])
      .toArray();

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Post search failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}