// src/app/api/users/profile/route.ts (Updated - Focus on the projection)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMongoClient } from "@/lib/dbConnect";
import { ObjectId } from "mongodb"; // Use mongodb's ObjectId

// Helper function for consistent ObjectId conversion
function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid ObjectId string');
  }
  return new ObjectId(id);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await getMongoClient();
    const db = client.db("talesy"); // Your database name

    const userCollection = db.collection("users");
    const followsCollection = db.collection("follows");

    let userIdObj: ObjectId;
    try {
      userIdObj = toObjectId(session.user.id);
    } catch (e) {
      console.error("Invalid session user ID format:", session.user.id, e);
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Fetch user details
    const user = await userCollection.findOne(
      { _id: userIdObj },
      // *** THIS IS THE FIX: Only include fields, exclude password implicitly by not listing it ***
      { projection: { _id: 1, name: 1, email: 1, username: 1, avatar: 1, image: 1, bio: 1, coverImage: 1 } }
      // Alternatively, if you only want to exclude 'password' and nothing else, you could do:
      // { projection: { password: 0 } } // But this would include ALL other fields.
      // Since you explicitly listed fields, this current fix is best.
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch follower count for the current user
    const followersCount = await followsCollection.countDocuments({
      followingId: userIdObj,
    });

    // Fetch following count for the current user
    const followingCount = await followsCollection.countDocuments({
      followerId: userIdObj,
    });

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name || "",
        email: user.email || "",
        username: user.username || null,
        avatar: user.avatar || user.image || "/default-avatar.png",
        bio: user.bio || "",
        coverImage: user.coverImage || "",
        followersCount: followersCount,
        followingCount: followingCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}