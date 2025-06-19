// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/dbConnect"; // <-- Yahan change kiya
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp } = body;

    if (!otp || typeof otp !== 'string' || otp.length !== 6 || isNaN(Number(otp))) {
      return NextResponse.json(
        { error: "Invalid OTP format. Must be a 6-digit number string." },
        { status: 400 }
      );
    }

    const client = await getMongoClient(); // <-- Yahan change kiya
    const db = client.db("talesy");
    const passwordResetsCollection = db.collection("password_resets");

    const resetRecord = await passwordResetsCollection.findOne({
      otp: otp,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid, used, or expired OTP." },
        { status: 400 }
      );
    }

    return NextResponse.json({ userId: resetRecord.userId.toString() });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}