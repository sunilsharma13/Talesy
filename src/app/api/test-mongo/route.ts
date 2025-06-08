import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";
import Post from "@/models/post";

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("talesy");  // (or whatever DB you're using)
    

    const body = await request.json();
    const { title, content, imageUrl, userId, status } = body;

    if (!title || !content || !userId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const newPost = new Post({
      title,
      content,
      imageUrl,
      userId,
      status: status || "published",
      createdAt: new Date(),
    });

    await newPost.save();

    return NextResponse.json({ message: "Post saved successfully", postId: newPost._id });
  } catch (error: any) {
    console.error("Error saving post:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
