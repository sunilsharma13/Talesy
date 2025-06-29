// src/app/api/users/profile/update/route.ts (Updated)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMongoClient } from "@/lib/dbConnect";
import { ObjectId } from "mongodb"; // <--- Use mongodb's ObjectId

// Helper function for consistent ObjectId conversion
function toObjectId(id: string) { // <--- Only string input, returns mongodb.ObjectId
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid ObjectId string');
  }
  return new ObjectId(id);
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Include coverImage in destructured body
    const { name, bio, avatar, coverImage } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db("talesy");

    let userIdObj: ObjectId;
    try {
      userIdObj = toObjectId(session.user.id);
    } catch (e) {
      console.error("Invalid session user ID format:", session.user.id, e);
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const existingUser = await db.collection("users").findOne({ _id: userIdObj });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare update fields
    const updateFields: { [key: string]: any } = {
      name,
      bio: bio || null,
      avatar: avatar || null,
      updatedAt: new Date(),
    };

    // Only add coverImage to update if it was provided
    if (coverImage !== undefined) {
      updateFields.coverImage = coverImage || null;
    }

    const updateResult = await db.collection("users").updateOne(
      { _id: existingUser._id },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount === 0) {
      console.warn("User profile update requested but no changes were made.", { userId: existingUser._id, name, bio, avatar, coverImage });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: existingUser._id.toString(), // Use _id consistently
        name,
        bio,
        avatar,
        coverImage: coverImage, // Return the updated coverImage
      },
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}