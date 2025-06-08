import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../lib/mongoClient";
import { generatePasswordResetToken } from "../../../lib/authUtils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailOrUsername } = body;

    if (!emailOrUsername) {
      return NextResponse.json(
        { error: "Email or username is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("talesy");

    // Find user by email or username
    const user = await db.collection("users").findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const token = await generatePasswordResetToken(user._id.toString());

    if (!token) {
      return NextResponse.json(
        { error: "Failed to generate OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}