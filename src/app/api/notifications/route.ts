// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// import { ObjectId } from "mongodb"; // <--- REMOVE THIS LINE
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose"; // <--- Keep this to access mongoose.Types.ObjectId

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const db = mongoose.connection.db!;
    
    const notifications = await db
      .collection("notifications")
      .find({ recipientId: new mongoose.Types.ObjectId(session.user.id as string) }) // <--- CHANGE HERE
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
    
    await dbConnect();
    const db = mongoose.connection.db!;
    
    const notification = {
      recipientId: new mongoose.Types.ObjectId(recipientId as string), // <--- CHANGE HERE
      type,
      actorId: actorId ? new mongoose.Types.ObjectId(actorId as string) : null, // <--- CHANGE HERE
      targetId: targetId ? new mongoose.Types.ObjectId(targetId as string) : null, // <--- CHANGE HERE
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