// app/api/users/profile/update/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMongoClient } from "@/lib/dbConnect"; // <--- Change here
import { ObjectId } from "mongodb";

// Helper function for consistent ObjectId conversion
function toObjectId(id: string | ObjectId) {
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  if (id instanceof ObjectId) return id;
  throw new Error('Invalid ObjectId');
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) { // Use session.user.id for authentication
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, bio, avatar } = await req.json();

    if (!name?.trim()) { // Check for empty string after trimming
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const client = await getMongoClient(); // <--- Change here
    const db = client.db("talesy");

    // Find the user using session.user.id, which should map to _id
    let userIdObj;
    try {
      userIdObj = toObjectId(session.user.id);
    } catch (e) {
      console.error("Invalid session user ID format:", session.user.id);
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const existingUser = await db.collection("users").findOne({ _id: userIdObj });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user with new data
    const updateResult = await db.collection("users").updateOne(
      { _id: existingUser._id },
      {
        $set: {
          name,
          bio: bio || null, // Store null if bio is empty
          avatar: avatar || null, // Store null if avatar is empty
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      // If no document was modified, it might mean the data was the same or an issue
      console.warn("User profile update requested but no changes were made.", { userId: existingUser._id, name, bio, avatar });
      // Optionally return a different message or status if no actual change happened
      // return NextResponse.json({ success: true, message: "No changes detected or applied." });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: existingUser._id.toString(), // Return the user's actual _id
        name,
        bio,
        avatar,
      },
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}