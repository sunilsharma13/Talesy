// app/api/users/featured/route.ts
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/dbConnect";
import { ObjectId } from "mongodb";
import { getServerSession } from 'next-auth/next'; // Import getServerSession
import { authOptions } from '@/lib/auth'; // Import authOptions

// Helper function for consistent ObjectId conversion
function toObjectId(id: string | ObjectId) {
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
  if (id instanceof ObjectId) return id;
  throw new Error('Invalid ObjectId');
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions); // Get current user session
    const currentUserId = session?.user?.id ? toObjectId(session.user.id) : null; // Convert to ObjectId

    const client = await getMongoClient();
    const db = client.db("talesy");

    // Get users with most followers (adjust limit as needed)
    const followCounts = await db.collection("follows")
      .aggregate([
        { $group: { _id: "$followingId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 } // Limiting to 8 featured users
      ])
      .toArray();

    const featuredUsersPromises = followCounts.map(async (item) => {
      const userId = item._id;

      if (!userId) return null;

      let userIdObj;
      try {
        userIdObj = toObjectId(userId);
      } catch (e) {
        console.warn(`Invalid ObjectId for featured user: ${userId}`);
        return null;
      }

      const user = await db.collection("users").findOne({ _id: userIdObj });

      if (!user) return null;

      // Calculate followers count for this user
      const followersCount = item.count; // This comes directly from the aggregation

      // Check if current user is following this featured user
      let isFollowing = false;
      if (currentUserId && userIdObj.toString() !== currentUserId.toString()) {
        const followRecord = await db.collection("follows").findOne({
          followerId: currentUserId,
          followingId: userIdObj,
        });
        isFollowing = !!followRecord;
      }

      return {
        _id: user._id.toString(), // Convert ObjectId to string for frontend consistency
        name: user.name || "Anonymous User",
        avatar: user.avatar || null,
        bio: user.bio || null,
        followers: followersCount,
        isFollowing: isFollowing,
      };
    });

    const featuredUsers = await Promise.all(featuredUsersPromises);

    const validUsers = featuredUsers.filter(
      (user): user is NonNullable<typeof user> => user !== null
    );

    return NextResponse.json(validUsers); // Return all valid featured users
  } catch (error) {
    console.error("Error fetching featured users:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}