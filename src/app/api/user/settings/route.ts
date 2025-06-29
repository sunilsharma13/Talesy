// src/app/api/user/settings/route.ts
import { NextResponse } from 'next/server'; // Use NextResponse for Next.js 13/14 App Router
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Your NextAuth.js config
import dbConnect from '@/lib/dbConnect'; // Assuming you have a dbConnect utility
import User from '@/models/user'; // Your User Mongoose model

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) { // Ensure user.id is available from session
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect(); // Connect to your database
    
    // Fetch user settings, including notificationSettings
    const user = await User.findById(session.user.id).select('name email username bio avatar image coverImage notificationSettings');

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userSettings = {
      email: user.email,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar || user.image, // Prefer avatar, fallback to image
      coverImage: user.coverImage,
      notificationSettings: user.notificationSettings || { comments: true, follows: true, likes: true, messages: true } // Ensure defaults if not set
    };

    return NextResponse.json(userSettings, { status: 200 });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// --- ADDED: PUT request to update user settings including notifications ---
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        // Destructure all possible fields you expect to update, including notifications
        const { name, username, bio, avatar, coverImage, notificationSettings } = body;

        await dbConnect();
        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json('User not found', { status: 404 });
        }

        // Update general profile fields if they are present in the body
        if (name !== undefined) user.name = name;
        if (username !== undefined) user.username = username;
        if (bio !== undefined) user.bio = bio;
        if (avatar !== undefined) user.avatar = avatar;
        if (coverImage !== undefined) user.coverImage = coverImage;

        // --- ADDED: Update Notification Settings ---
        if (notificationSettings !== undefined && typeof notificationSettings === 'object') {
            // Validate incoming notification settings types
            if (
                typeof notificationSettings.comments === 'boolean' &&
                typeof notificationSettings.follows === 'boolean' &&
                typeof notificationSettings.likes === 'boolean' &&
                typeof notificationSettings.messages === 'boolean'
            ) {
                user.notificationSettings = {
                    ...user.notificationSettings, // Keep existing if not provided
                    ...notificationSettings // Override with new values
                };
            } else {
                return NextResponse.json('Invalid notification settings data in request body.', { status: 400 });
            }
        }
        // --- END ADDED ---

        await user.save();

        return NextResponse.json({
            message: 'User settings updated successfully',
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                username: user.username,
                bio: user.bio,
                avatar: user.avatar || user.image,
                coverImage: user.coverImage,
                notificationSettings: user.notificationSettings // Return updated settings
            }
        });

    } catch (error) {
        console.error('Error updating user settings:', error);
        return NextResponse.json('Internal Server Error', { status: 500 });
    }
}