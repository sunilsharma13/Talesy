// app/api/auth/update-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getMongoClient } from "@/lib/dbConnect"; // <-- Yahan change kiya
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    if (!userId || typeof userId !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: "User ID and password are required and must be strings." },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(userId)) {
        return NextResponse.json(
            { error: "Invalid User ID format." },
            { status: 400 }
        );
    }

    const client = await getMongoClient(); // <-- Yahan change kiya
    const db = client.db("talesy");
    const usersCollection = db.collection("users");
    const passwordResetsCollection = db.collection("password_resets");

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount !== 1) {
      return NextResponse.json(
        { error: "Failed to update password. User not found or no changes were made." },
        { status: 400 }
      );
    }

    await passwordResetsCollection.updateOne(
        { userId: new ObjectId(userId), used: false },
        { $set: { used: true, usedAt: new Date() } }
    );

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}