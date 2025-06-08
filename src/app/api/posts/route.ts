// src/app/api/posts/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ... (rest of the code is the same)

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const client = await clientPromise;
    const db = client.db("talesy");

    const { searchParams } = new URL(req.url);
    const publishedOnly = searchParams.get("publishedOnly") === "true";
    const sortOrder = searchParams.get("sortOrder") === "oldest" ? 1 : -1;
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");
    const following = searchParams.get("following") === "true";

    // Create base query
    let query: any = publishedOnly ? { status: "published" } : {};
    
    // Filter by userId if provided
    const userId = searchParams.get("userId");
    if (userId) {
      query.userId = userId;
    }
    
    // Handle "following" parameter to show posts from followed users
    if (following && session?.user?.id) {
      // Get users that the current user follows
      const followedUsers = await db.collection("follows")
        .find({ followerId: session.user.id })
        .toArray();
      
      const followingIds = followedUsers.map(f => f.followingId);
      
      if (followingIds.length > 0) {
        // Add following filter to query
        query.userId = { $in: followingIds };
      } else {
        // If not following anyone, return empty result
        return NextResponse.json([]);
      }
    }

    console.log("Posts query:", JSON.stringify(query));
    
    // Fetch posts with pagination
    const posts = await db
      .collection("writings")
      .find(query)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // If we need to enhance posts with user data or other stats
    const enhancedPosts = await Promise.all(posts.map(async (post) => {
      // Add like count
      const likeCount = await db.collection("likes")
        .countDocuments({ postId: post._id.toString() });
      
      // Add comment count
      const commentCount = await db.collection("comments")
        .countDocuments({ postId: post._id.toString() });
      
      return {
        ...post,
        likes: likeCount,
        comments: commentCount
      };
    }));

    return NextResponse.json(enhancedPosts);
  } catch (error) {
    console.error("❌ GET /api/posts failed:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  console.log("Session:", session);
  console.log("User ID from session:", session?.user?.id);
  
  if (!session?.user?.id) {
    console.log("❌ Unauthorized: No valid user ID in session");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, imageUrl, status, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newPost = {
      userId: session.user.id,
      title,
      content,
      imageUrl: imageUrl || "",
      status: status || "draft",
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,         // Initialize with zero likes
      comments: 0       // Initialize with zero comments
    };

    console.log("Creating post with user ID:", session.user.id);
    
    const client = await clientPromise;
    const db = client.db("talesy");

    const result = await db.collection("writings").insertOne(newPost);
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("❌ POST /api/posts failed:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}