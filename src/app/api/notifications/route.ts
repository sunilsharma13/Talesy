// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("talesy");
    
    // Fetch notifications for the current user
    const notifications = await db
      .collection("notifications")
      .find({ recipientId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { type, actorId, targetId, message } = await req.json();
    const recipientId = session.user.id;
    
    if (!type || !message) {
      return NextResponse.json({ error: "Invalid notification data" }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("talesy");
    
    // Create the notification
    const notification = {
      recipientId,
      type,
      actorId: actorId || null,
      targetId: targetId || null,
      message,
      read: false,
      createdAt: new Date()
    };
    
    const result = await db.collection("notifications").insertOne(notification);
    
    return NextResponse.json({
      _id: result.insertedId,
      ...notification
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}