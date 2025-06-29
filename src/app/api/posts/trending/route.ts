// app/api/posts/trending/route.ts
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions); // Get current user session
    const currentUserId = session?.user?.id ? toObjectId(session.user.id) : null; // Convert to ObjectId

    const client = await getMongoClient();
    const db = client.db("talesy");

    // Find published stories with the most likes and comments
    const stories = await db.collection("writings")
      .find({ status: "published" })
      .sort({ likes: -1, comments: -1, createdAt: -1 })
      .limit(6)
      .toArray();

    // Enhance stories with full author information including followers and isFollowing
    const enhancedStories = await Promise.all(
      stories.map(async (story) => {
        const authorId = story.userId; // Assuming userId is the author's _id

        // Get author data
        let author = null;
        let followersCount = 0;
        let isFollowing = false;

        if (authorId && ObjectId.isValid(authorId)) {
          const authorObjectId = toObjectId(authorId);

          author = await db.collection("users").findOne(
            { _id: authorObjectId },
            { projection: { _id: 1, name: 1, avatar: 1, bio: 1 } } // Fetch bio as well
          );

          // Get follower count for this author
          followersCount = await db.collection("follows").countDocuments({
            followingId: authorObjectId,
          });

          // Check if current user is following this author
          if (currentUserId && authorObjectId.toString() !== currentUserId.toString()) {
            const followRecord = await db.collection("follows").findOne({
              followerId: currentUserId,
              followingId: authorObjectId,
            });
            isFollowing = !!followRecord;
          }
        }

        return {
          ...story,
          author: {
            _id: author?._id || "unknown", // Ensure _id is always present
            name: author?.name || "Unknown User",
            avatar: author?.avatar || null,
            bio: author?.bio || null, // Include bio
            followers: followersCount,
            isFollowing: isFollowing,
          }
        };
      })
    );

    return NextResponse.json(enhancedStories);
  } catch (error) {
    console.error("Error fetching trending stories:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}