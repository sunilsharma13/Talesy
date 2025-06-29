// src/app/api/notifications/mark-read/route.ts
// Yeh file notifications ko read mark karne ke liye API route hai.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // NextAuth.js configuration
import dbConnect from '@/lib/dbConnect'; // Database connection utility
import Notification from '@/models/notification'; // Notification Mongoose model
import mongoose from 'mongoose'; // Mongoose ObjectIds ke liye

// PUT request handle karega notifications ko mark as read karne ke liye
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check karein ki user authenticated hai ya nahi
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Database se connect karein
    await dbConnect();

    // Request body se notificationIds aur markAsRead status extract karein
    const { notificationIds, markAsRead } = await request.json();

    // Input validation: notificationIds ek non-empty array hona chahiye aur markAsRead boolean hona chahiye
    if (!Array.isArray(notificationIds) || notificationIds.length === 0 || typeof markAsRead !== 'boolean') {
      return NextResponse.json({ message: "Invalid request body. Expected { notificationIds: string[], markAsRead: boolean }" }, { status: 400 });
    }

    // String IDs ko Mongoose ObjectId mein convert karein query ke liye
    const objectIds = notificationIds.map(id => new mongoose.Types.ObjectId(id));

    // Database mein notifications ko update karein
    // Khayal rakhein ki hum sirf current user ki notifications ko hi update kar rahe hain
    const updateResult = await Notification.updateMany(
      { _id: { $in: objectIds }, recipientId: new mongoose.Types.ObjectId(session.user.id) }, // 'recipientId' use karein
      { read: markAsRead } // 'read' status update karein
    );

    console.log(`User ${session.user.id}: Marked ${updateResult.modifiedCount} notifications as read=${markAsRead}.`);

    return NextResponse.json({ message: "Notifications updated successfully.", modifiedCount: updateResult.modifiedCount }, { status: 200 });

  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}