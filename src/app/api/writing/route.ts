// app/api/writing/route.ts
import { NextResponse } from "next/server";
// import { ObjectId } from "mongodb"; // <-- REMOVE THIS LINE
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Writing from "@/models/writing";
import User from "@/models/user";
import mongoose from "mongoose"; // <-- ADD THIS LINE

// Helper function for consistent ObjectId conversion
// Use mongoose.Types.ObjectId for compatibility with Mongoose queries
function toObjectId(id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId {
  if (typeof id === 'string') {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`Invalid ObjectId format received: ${id}`);
      throw new Error('Invalid ObjectId');
    }
    return new mongoose.Types.ObjectId(id);
  }
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  // This case should ideally not be reached if types are handled correctly
  console.error(`Unexpected type for ObjectId conversion: ${typeof id}, value: ${id}`);
  throw new Error('Invalid ObjectId: Input not a string or mongoose ObjectId');
}


// GET handler
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("GET handler - Session:", session);
    
    const userId = session?.user?.id;
    console.log("User ID to use:", userId);
    
    if (!userId) {
      console.log("⛔️ No user ID found in session");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status");

    // Ensure DB connection is established for every route handler
    // (If your dbConnect.ts handles caching, calling it multiple times is fine)
    await mongoose.connect(process.env.MONGODB_URI!); // Ensure connected, replace with your dbConnect if it's not global

    if (id) {
      let objectId;
      try {
        objectId = toObjectId(id);
      } catch (e: any) {
        console.error("Invalid ObjectId format for GET by ID:", id, e.message);
        return NextResponse.json({ message: "Invalid ID format: " + e.message }, { status: 400 });
      }
      
      const writing = await Writing.findById(objectId);

      console.log("Fetched document:", writing);

      if (!writing) {
        return NextResponse.json({ message: "Writing not found" }, { status: 404 });
      }

      // Use .equals for comparison with ObjectId
      if (!writing.author.equals(toObjectId(userId))) {
        console.log("User doesn't own this document. Writing author:", writing.author, "Session userId:", userId);
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }

      return NextResponse.json(writing);
    } else if (status) {
      const writings = await Writing.find({ author: toObjectId(userId), status })
                                    .sort({ createdAt: -1 }); // Sort by newest first
      console.log(`Fetched ${writings.length} writings with status ${status}`);
      return NextResponse.json(writings);
    } else {
      // If no ID or status, return all user's writings
      const writings = await Writing.find({ author: toObjectId(userId) })
                                    .sort({ createdAt: -1 }); // Sort by newest first
      console.log(`Fetched all ${writings.length} writings for user`);
      return NextResponse.json(writings);
    }
  } catch (error: any) {
    console.error("Error in GET handler:", error.message, error.stack);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST handler - Create new writing
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("POST handler - Session:", session);
    
    const userId = session?.user?.id; // This is the string ID from next-auth session
    console.log("Session user object:", session?.user);
    console.log("User ID to use:", userId);
    
    if (!userId) {
      console.log("⛔️ No user ID found in session");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
      console.log("Received POST data:", body);
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return NextResponse.json({ message: "Invalid JSON in request body" }, { status: 400 });
    }

    const { title, content, imageUrl, status, genre, isPublic, tags } = body; // Added tags

    if (!title?.trim() || !content?.trim()) {
      console.log("Missing required fields:", { title, content });
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI!); // Ensure connected

    // --- Using Mongoose Model for insertion ---
    const newWriting = new Writing({
      title,
      content,
      imageUrl: imageUrl || "",
      author: toObjectId(userId), // Assign userId to the 'author' field
      status: status || "draft",
      genre: genre || "",
      isPublic: isPublic || false,
      likes: 0,
      comments: 0,
      tags: tags || [], // Ensure tags are handled
    });

    console.log("Attempting to save document via Mongoose:", newWriting);
    
    const result = await newWriting.save();
    
    console.log("Created writing with ID (Mongoose):", result._id);

    return NextResponse.json({ 
      message: "Writing created", 
      id: result._id 
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST handler:", error.message, error.stack);
    return NextResponse.json({ message: error.message || "Error creating writing" }, { status: 500 });
  }
}

// PUT handler - Update writing and sync to posts if published
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("PUT handler - Session:", session);
    
    const userId = session?.user?.id;
    console.log("User ID to use:", userId);
    
    if (!userId) {
      console.log("⛔️ No user ID found in session");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
      console.log("Received PUT data:", body);
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return NextResponse.json({ message: "Invalid JSON in request body" }, { status: 400 });
    }

    const { title, content, imageUrl, status, genre, isPublic, tags } = body; // Destructure all fields including tags
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    console.log("Update ID from query params:", id);

    if (!id) {
      return NextResponse.json({ message: "Missing id parameter" }, { status: 400 });
    }

    let objectId;
    try {
      objectId = toObjectId(id);
    } catch (e: any) {
      console.error("Invalid ObjectId format for PUT:", id, e.message);
      return NextResponse.json({ message: "Invalid ID format: " + e.message }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI!); // Ensure connected

    // --- Using Mongoose Model for update ---
    const writing = await Writing.findById(objectId);
    
    console.log("Found writing:", writing);
    
    if (!writing) {
      return NextResponse.json({ message: "Writing not found" }, { status: 404 });
    }

    // Check ownership using Mongoose document's author field
    if (!writing.author.equals(toObjectId(userId))) {
      console.log("Writing owner mismatch. Writing author:", writing.author, "Session userId:", userId);
      return NextResponse.json({ message: "You don't have permission to edit this writing" }, { status: 403 });
    }

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ message: "Title and content are required" }, { status: 400 });
    }

    // Update fields directly on the Mongoose document
    writing.title = title;
    writing.content = content;
    writing.imageUrl = imageUrl || "";
    if (status) writing.status = status;
    if (genre) writing.genre = genre;
    if (typeof isPublic === 'boolean') writing.isPublic = isPublic;
    if (tags) writing.tags = tags; // Update tags
    writing.updatedAt = new Date();

    const result = await writing.save();

    console.log("Updated writing (Mongoose):", result);

    // Sync to posts if published
    if (status === "published") {
      const { getMongoClient } = await import("@/lib/dbConnect"); // Import only when needed
      const client = await getMongoClient();
      const db = client.db("talesy");

      const existingPost = await db.collection("posts").findOne({ writingId: objectId });

      const postData = {
        writingId: objectId,
        title: result.title, // Use result.title
        content: result.content, // Use result.content
        imageUrl: result.imageUrl || "",
        userId: toObjectId(result.author),
        status: "published",
        createdAt: existingPost?.createdAt || result.createdAt,
        updatedAt: new Date(),
        likes: result.likes || 0,
        comments: result.comments || 0,
        tags: result.tags || [], // Include tags in postData
      };

      if (!existingPost) {
        await db.collection("posts").insertOne(postData);
        console.log("Created new published post");
      } else {
        await db.collection("posts").updateOne(
          { writingId: objectId },
          { $set: postData }
        );
        console.log("Updated existing published post");
      }
    } else if (status !== "published" && writing.status === "published") {
      // If status changed from published to something else (draft/deleted), remove from posts
      const { getMongoClient } = await import("@/lib/dbConnect");
      const client = await getMongoClient();
      const db = client.db("talesy");
      await db.collection("posts").deleteOne({ writingId: objectId });
      console.log("Removed from posts collection due to status change");
    }

    return NextResponse.json({ 
      message: "Writing updated successfully", 
      id: id // Returning the string ID is fine for the client
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error in PUT handler:", error.message, error.stack);
    return NextResponse.json({ message: error.message || "Error updating writing" }, { status: 500 });
  }
}

// DELETE handler - Soft delete writing
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("DELETE handler - Session:", session);
    
    const userId = session?.user?.id;
    console.log("User ID to use:", userId);
    
    if (!userId) {
      console.log("⛔️ No user ID found in session");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Missing id parameter" }, { status: 400 });
    }

    let objectId;
    try {
      objectId = toObjectId(id);
    } catch (e: any) {
      console.error("Invalid ObjectId format for DELETE:", id, e.message);
      return NextResponse.json({ message: "Invalid ID format: " + e.message }, { status: 400 });
    }

    await mongoose.connect(process.env.MONGODB_URI!); // Ensure connected

    // --- Using Mongoose Model for find and update ---
    const writing = await Writing.findById(objectId);
    
    if (!writing) {
      return NextResponse.json({ message: "Writing not found" }, { status: 404 });
    }

    if (!writing.author.equals(toObjectId(userId))) {
      console.log("Writing owner mismatch. Writing author:", writing.author, "Session userId:", userId);
      return NextResponse.json({ message: "You don't have permission to delete this writing" }, { status: 403 });
    }

    writing.status = "deleted";
    writing.updatedAt = new Date();
    await writing.save();

    console.log("Delete (soft) result for writing:", writing._id);

    // Also remove from posts collection if it was published
    const { getMongoClient } = await import("@/lib/dbConnect");
    const client = await getMongoClient();
    const db = client.db("talesy");
    await db.collection("posts").deleteOne({ writingId: objectId });
    console.log("Removed from posts collection if existed");

    return NextResponse.json({ 
      message: "Writing successfully deleted", 
      id: id
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error in DELETE handler:", error.message, error.stack);
    return NextResponse.json({ message: error.message || "Error deleting writing" }, { status: 500 });
  }
}