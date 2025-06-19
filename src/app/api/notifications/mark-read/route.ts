// app/api/notifications/mark-read/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // Yahan change kiya hai: mongoose.connection.db!
    const db = mongoose.connection.db!;
    
    await db.collection("notifications").updateMany(
      { recipientId: new ObjectId(session.user.id as string), read: false },
      { $set: { read: true } }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}