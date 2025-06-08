// app/api/users/profile/update/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongoClient";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, bio, avatar } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("talesy");

    // Find the user first to ensure they exist
    let existingUser = await db.collection("users").findOne({ email: session.user.email });

    if (!existingUser && session.user.id) {
      if (ObjectId.isValid(session.user.id)) {
        existingUser = await db.collection("users").findOne({
          _id: new ObjectId(session.user.id),
        });
      }
    }

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user with new data
    await db.collection("users").updateOne(
      { _id: existingUser._id },
      {
        $set: {
          name,
          bio,
          avatar,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      user: {
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
