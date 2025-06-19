// app/api/writing/route.ts (assuming this path based on the content)
import { NextResponse } from "next/server"; // Changed to NextResponse for consistency
import { getMongoClient } from "@/lib/dbConnect"; // <--- Change here
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper function for consistent ObjectId conversion
function toObjectId(id: string | ObjectId) {
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  if (id instanceof ObjectId) return id;
  throw new Error('Invalid ObjectId');
}

// GET handler
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("GET handler - Session:", session);
    console.log("Session user object:", session?.user);
    
    const userId = session?.user?.id; // Direct access, no need for || session?.user?.uid;
    console.log("User ID to use:", userId);
    
    if (!userId) {
      console.log("⛔️ No user ID found in session");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const client = await getMongoClient(); // <--- Change here
    console.log("Connected to MongoDB!");
    const db = client.db("talesy");

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status");

    if (id) {
      let objectId;
      try {
        objectId = toObjectId(id); // Use helper function
      } catch (e) {
        console.error("Invalid ObjectId format:", id, e);
        return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
      }
      
      const doc = await db.collection("writings").findOne({
        _id: objectId
      });

      console.log("Fetched document:", doc);

      if (!doc) {
        return NextResponse.json({ message: "Writing not found" }, { status: 404 });
      }

      // Check if the user has access to this document
      // Convert doc.userId to ObjectId if it's a string, then compare
      const docUserIdObj = toObjectId(doc.userId); // Ensure this is also an ObjectId
      const sessionUserIdObj = toObjectId(userId);

      if (!docUserIdObj.equals(sessionUserIdObj)) { // Compare ObjectIds using .equals()
        console.log("User doesn't own this document. Doc userId:", doc.userId, "Session userId:", userId);
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }

      return NextResponse.json(doc);
    } else if (status) {
      const writings = await db
        .collection("writings")
        .find({ userId: userId, status }) // userId is already consistent here
        .toArray();

      console.log(`Fetched ${writings.length} writings with status ${status}`);

      return NextResponse.json(writings);
    } else {
      // If no ID or status, return all user's writings
      const writings = await db
        .collection("writings")
        .find({ userId: userId }) // userId is already consistent here
        .sort({ createdAt: -1 }) // Sort by newest first
        .toArray();

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
    
    const userId = session?.user?.id;
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

    const { title, content, imageUrl, status } = body;

    if (!title?.trim() || !content?.trim()) { // Added trim and combined check
      console.log("Missing required fields:", { title, content });
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const client = await getMongoClient(); // <--- Change here
    console.log("Connected to MongoDB!");
    const db = client.db("talesy");

    const now = new Date();
    
    const newDoc = {
      title,
      content,
      imageUrl: imageUrl || "",
      userId: toObjectId(userId),  // Store userId as ObjectId
      createdAt: now,
      updatedAt: now,
      status: status || "draft",
      likes: 0, // Initialize likes and comments count
      comments: 0,
    };

    console.log("Inserting document:", newDoc);
    
    const result = await db.collection("writings").insertOne(newDoc);
    
    console.log("Created post with ID:", result.insertedId);

    return NextResponse.json({ 
      message: "Writing created", 
      id: result.insertedId 
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

    const { title, content, imageUrl, status } = body;
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    console.log("Update ID from query params:", id);

    if (!id) {
      return NextResponse.json({ message: "Missing id parameter" }, { status: 400 });
    }

    let objectId;
    try {
      objectId = toObjectId(id); // Use helper function
    } catch (e) {
      console.error("Invalid ObjectId format:", id, e);
      return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
    }

    const client = await getMongoClient(); // <--- Change here
    console.log("Connected to MongoDB!");
    const db = client.db("talesy");

    const writing = await db.collection("writings").findOne({
      _id: objectId
    });

    console.log("Found writing:", writing);
    
    if (!writing) {
      return NextResponse.json({ message: "Writing not found" }, { status: 404 });
    }

    const docUserIdObj = toObjectId(writing.userId); // Ensure this is also an ObjectId
    const sessionUserIdObj = toObjectId(userId);

    if (!docUserIdObj.equals(sessionUserIdObj)) { // Compare ObjectIds using .equals()
      console.log("Writing owner mismatch. Writing userId:", writing.userId, "Session userId:", userId);
      return NextResponse.json({ message: "You don't have permission to edit this writing" }, { status: 403 });
    }

    if (!title?.trim() || !content?.trim()) { // Added trim and combined check
      return NextResponse.json({ message: "Title and content are required" }, { status: 400 });
    }

    const updateFields: any = { 
      title, 
      content, 
      imageUrl: imageUrl || writing.imageUrl || "", 
      updatedAt: new Date() 
    };

    if (status) {
      updateFields.status = status;
    }

    const result = await db.collection("writings").updateOne(
      { _id: objectId },
      { $set: updateFields }
    );

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Writing not found or no changes made" }, { status: 404 }); // Changed message slightly
    }

    // Sync to posts if published
    if (status === "published") {
      // Fetch latest data from 'writings' after update to ensure consistency
      const updatedWriting = await db.collection("writings").findOne({ _id: objectId });

      if (updatedWriting) {
        const existingPost = await db.collection("posts").findOne({ writingId: objectId });

        const postData = {
          writingId: objectId,
          title: updatedWriting.title,
          content: updatedWriting.content,
          imageUrl: updatedWriting.imageUrl || "",
          userId: toObjectId(updatedWriting.userId), // Ensure userId in posts is ObjectId
          status: "published",
          createdAt: existingPost?.createdAt || new Date(), // Preserve original createdAt if exists
          updatedAt: new Date(),
          likes: updatedWriting.likes || 0, // Include likes and comments counts
          comments: updatedWriting.comments || 0,
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
      } else {
        console.warn("Updated writing not found for post sync. This should not happen.");
      }
    } else if (status !== "published" && writing.status === "published") {
      // If status changed from published to something else (draft/deleted), remove from posts
      await db.collection("posts").deleteOne({ writingId: objectId });
      console.log("Removed from posts collection due to status change");
    }

    return NextResponse.json({ 
      message: "Writing updated successfully", 
      id: id 
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
      objectId = toObjectId(id); // Use helper function
    } catch (e) {
      console.error("Invalid ObjectId format:", id, e);
      return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
    }

    const client = await getMongoClient(); // <--- Change here
    console.log("Connected to MongoDB!");
    const db = client.db("talesy");

    const writing = await db.collection("writings").findOne({
      _id: objectId
    });
    
    if (!writing) {
      return NextResponse.json({ message: "Writing not found" }, { status: 404 });
    }

    const docUserIdObj = toObjectId(writing.userId); // Ensure this is also an ObjectId
    const sessionUserIdObj = toObjectId(userId);

    if (!docUserIdObj.equals(sessionUserIdObj)) { // Compare ObjectIds using .equals()
      console.log("Writing owner mismatch. Writing userId:", writing.userId, "Session userId:", userId);
      return NextResponse.json({ message: "You don't have permission to delete this writing" }, { status: 403 });
    }

    const result = await db.collection("writings").updateOne(
      { _id: objectId },
      { $set: { status: "deleted", updatedAt: new Date() } }
    );

    console.log("Delete (soft) result:", result);

    // Also remove from posts collection if it was published
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