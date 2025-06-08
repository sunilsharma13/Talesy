import clientPromise from "@/lib/mongoClient";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Import from lib/auth.ts

// ... (rest of the code is the same)
// GET handler
export async function GET(req: Request) {
  try {
    // Get the session with the correct authOptions
    const session = await getServerSession(authOptions);
    console.log("GET handler - Session:", session);
    console.log("Session user object:", session?.user);
    
    // Check for either id or uid to support both formats
    const userId = session?.user?.id || session?.user?.id;
    console.log("User ID to use:", userId);
    
    if (!userId) {
      console.log("⛔️ No user ID found in session");
      return new Response(JSON.stringify({ message: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = await clientPromise;
    console.log("Connected to MongoDB!");
    const db = client.db("talesy");

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status");

    if (id) {
      // Try to convert string ID to ObjectId for MongoDB
      let objectId;
      try {
        objectId = new ObjectId(id);
      } catch (e) {
        console.error("Invalid ObjectId format:", id);
        return new Response(JSON.stringify({ message: "Invalid ID format" }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const doc = await db.collection("writings").findOne({
        _id: objectId
      });

      console.log("Fetched document:", doc);

      if (!doc) {
        return new Response(JSON.stringify({ message: "Writing not found" }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if the user has access to this document
      // Compare both as strings to avoid type issues
      if (String(doc.userId) !== String(userId)) {
        console.log("User doesn't own this document. Doc userId:", doc.userId, "Session userId:", userId);
        return new Response(JSON.stringify({ message: "Unauthorized" }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(doc), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (status) {
      const writings = await db
        .collection("writings")
        .find({ userId: userId, status })
        .toArray();

      console.log(`Fetched ${writings.length} writings with status ${status}`);

      return new Response(JSON.stringify(writings), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // If no ID or status, return all user's writings
      const writings = await db
        .collection("writings")
        .find({ userId: userId })
        .sort({ createdAt: -1 }) // Sort by newest first
        .toArray();

      console.log(`Fetched all ${writings.length} writings for user`);

      return new Response(JSON.stringify(writings), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error("Error in GET handler:", error.message, error.stack);
    return new Response(JSON.stringify({ message: error.message || "Internal Server Error" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST handler - Create new writing
export async function POST(req: Request) {
  try {
    // Get the session with the correct authOptions
    const session = await getServerSession(authOptions);
    console.log("POST handler - Session:", session);
    
    // Check for either id or uid to support both formats
    const userId = session?.user?.id || session?.user?.id;
    
    // Log detailed session info for debugging
    console.log("Session user object:", session?.user);
    console.log("User ID to use:", userId);
    
    if (!userId) {
      console.log("⛔️ No user ID found in session");
      return new Response(JSON.stringify({ message: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Received POST data:", body);
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(JSON.stringify({ message: "Invalid JSON in request body" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { title, content, imageUrl, status } = body;

    if (!title || !content) {
      console.log("Missing required fields:", { title, content });
      return new Response(JSON.stringify({ message: "Missing required fields" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = await clientPromise;
    console.log("Connected to MongoDB!");
    const db = client.db("talesy");

    const now = new Date();
    
    const newDoc = {
      title,
      content,
      imageUrl: imageUrl || "",
      userId,  // Using the ID from session
      createdAt: now,
      updatedAt: now,
      status: status || "draft",
    };

    console.log("Inserting document:", newDoc);
    
    const result = await db.collection("writings").insertOne(newDoc);
    
    console.log("Created post with ID:", result.insertedId);

    // Return the ID in the response for client-side redirect
    return new Response(
      JSON.stringify({ 
        message: "Writing created", 
        id: result.insertedId 
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error("Error in POST handler:", error.message, error.stack);
    return new Response(JSON.stringify({ message: error.message || "Error creating writing" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT handler - Update writing and sync to posts if published
export async function PUT(req: Request) {
  try {
    // Get the session with the correct authOptions
    const session = await getServerSession(authOptions);
    console.log("PUT handler - Session:", session);
    
    // Check for either id or uid to support both formats
    const userId = session?.user?.id || session?.user?.id;
    console.log("User ID to use:", userId);
    
    if (!userId) {
      console.log("⛔️ No user ID found in session");
      return new Response(JSON.stringify({ message: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Received PUT data:", body);
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(JSON.stringify({ message: "Invalid JSON in request body" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { title, content, imageUrl, status } = body;
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    console.log("Update ID from query params:", id);

    if (!id) {
      return new Response(JSON.stringify({ message: "Missing id parameter" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to convert string ID to ObjectId for MongoDB
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      console.error("Invalid ObjectId format:", id);
      return new Response(JSON.stringify({ message: "Invalid ID format" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = await clientPromise;
    console.log("Connected to MongoDB!");
    const db = client.db("talesy");

    // First check if this writing exists
    const writing = await db.collection("writings").findOne({
      _id: objectId
    });

    console.log("Found writing:", writing);
    
    if (!writing) {
      return new Response(JSON.stringify({ message: "Writing not found" }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user owns this writing - compare both as strings
    if (String(writing.userId) !== String(userId)) {
      console.log("Writing owner mismatch. Writing userId:", writing.userId, "Session userId:", userId);
      return new Response(JSON.stringify({ message: "You don't have permission to edit this writing" }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate required fields
    if (!title || !content) {
      return new Response(JSON.stringify({ message: "Title and content are required" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the writing
    const result = await db.collection("writings").updateOne(
      { _id: objectId },
      { 
        $set: { 
          title, 
          content, 
          imageUrl: imageUrl || writing.imageUrl || "", 
          status: status || writing.status,
          updatedAt: new Date() 
        } 
      }
    );

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ message: "Writing not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ Sync to posts if published
    if (status === "published") {
      const existingPost = await db.collection("posts").findOne({ writingId: objectId });

      if (!existingPost) {
        // Insert new post
        await db.collection("posts").insertOne({
          writingId: objectId, // Link back to writing
          title,
          content,
          imageUrl: imageUrl || "",
          userId,
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log("Created new published post");
      } else {
        // Update existing post
        await db.collection("posts").updateOne(
          { writingId: objectId },
          { 
            $set: { 
              title, 
              content, 
              imageUrl: imageUrl || existingPost.imageUrl || "", 
              status: "published",
              updatedAt: new Date() 
            } 
          }
        );
        console.log("Updated existing published post");
      }
    }

    return new Response(JSON.stringify({ 
      message: "Writing updated successfully", 
      id: id }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Error in PUT handler:", error.message, error.stack);
    return new Response(JSON.stringify({ message: error.message || "Error updating writing" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE handler - Soft delete writing
export async function DELETE(req: Request) {
  try {
    // Get the session with the correct authOptions
    const session = await getServerSession(authOptions);
    console.log("DELETE handler - Session:", session);
    
    // Check for either id or uid to support both formats
    const userId = session?.user?.id || session?.user?.id;
    console.log("User ID to use:", userId);
    
    if (!userId) {
      console.log("⛔️ No user ID found in session");
      return new Response(JSON.stringify({ message: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ message: "Missing id parameter" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to convert string ID to ObjectId for MongoDB
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      console.error("Invalid ObjectId format:", id);
      return new Response(JSON.stringify({ message: "Invalid ID format" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = await clientPromise;
    console.log("Connected to MongoDB!");
    const db = client.db("talesy");

    // First check if this writing exists
    const writing = await db.collection("writings").findOne({
      _id: objectId
    });
    
    if (!writing) {
      return new Response(JSON.stringify({ message: "Writing not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user owns this writing - compare both as strings
    if (String(writing.userId) !== String(userId)) {
      console.log("Writing owner mismatch. Writing userId:", writing.userId, "Session userId:", userId);
      return new Response(JSON.stringify({ message: "You don't have permission to delete this writing" }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await db.collection("writings").updateOne(
      { _id: objectId },
      { $set: { status: "deleted", updatedAt: new Date() } }
    );

    console.log("Delete (soft) result:", result);

    // Also remove from posts collection if it was published
    await db.collection("posts").deleteOne({ writingId: objectId });
    console.log("Removed from posts collection if existed");

    return new Response(JSON.stringify({ 
      message: "Writing successfully deleted", 
      id: id
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Error in DELETE handler:", error.message, error.stack);
    return new Response(JSON.stringify({ message: error.message || "Error deleting writing" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}