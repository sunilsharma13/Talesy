// app/api/notifications/mark-read/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("talesy");
    
    // Mark all notifications as read for the current user
    await db.collection("notifications").updateMany(
      { recipientId: session.user.id, read: false },
      { $set: { read: true } }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}