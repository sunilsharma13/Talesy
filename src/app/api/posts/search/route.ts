// app/api/posts/search/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const client = await clientPromise;
    const db = client.db("talesy");

    const posts = await db
      .collection("writings")
      .aggregate([
        {
          $match: {
            published: true,
            $or: [
              { title: { $regex: query, $options: "i" } },
              { content: { $regex: query, $options: "i" } },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            content: 1,
            createdAt: 1,
            imageUrl: 1,
            likes: 1,
            comments: 1,
            userId: 1,
            user: {
              name: "$user.name",
              avatar: "$user.avatar",
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Post search failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
