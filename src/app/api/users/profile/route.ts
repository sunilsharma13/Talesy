// src/app/api/users/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMongoClient } from "@/lib/dbConnect"; // Keep this import, we'll use getMongoClient
// import { ObjectId } from "mongodb"; // <--- REMOVE THIS LINE
import mongoose from "mongoose"; // <--- Add this import

// Helper function for consistent ObjectId conversion (Updated)
function toObjectId(id: string | mongoose.Types.ObjectId) { // <--- Changed type
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id); // <--- Use mongoose.Types.ObjectId
  if (id instanceof mongoose.Types.ObjectId) return id; // <--- Check against mongoose.Types.ObjectId
  throw new Error('Invalid ObjectId');
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await getMongoClient(); // Use getMongoClient for the raw client
    const db = client.db("talesy"); // Get the db from the raw client

    // Prefer using _id from session if available, otherwise fallback to email
    let userQuery;
    try {
      // Ensure toObjectId uses mongoose.Types.ObjectId
      userQuery = { _id: toObjectId(session.user.id) };
    } catch (e) {
      userQuery = { email: session.user.email };
    }

    const user = await db.collection("users").findOne(userQuery);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name || "",
        avatar: user.avatar || "",
        bio: user.bio || "",
      },
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}