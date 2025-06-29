// src/app/api/posts/trending/route.ts

export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/dbConnect";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb'; // NEW: Use ObjectId from 'mongodb'

// Helper function for consistent ObjectId conversion using 'mongodb' ObjectId
function toObjectId(id: string | ObjectId): ObjectId {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  throw new Error('Invalid ObjectId format provided to toObjectId helper.');
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    let currentUserId: ObjectId | null = null; // Use ObjectId from 'mongodb'
    if (session?.user?.id) {
      try {
        currentUserId = toObjectId(session.user.id);
      } catch (e) {
        console.warn("Invalid session user ID for ObjectId conversion:", session.user.id, e);
      }
    }

    const client = await getMongoClient();
    const db = client.db("talesy");

    const stories = await db.collection("writings")
      .find({ status: "published" })
      .sort({ likes: -1, comments: -1, createdAt: -1 })
      .limit(6)
      .toArray();

    const enhancedStories = await Promise.all(
      stories.map(async (story) => {
        // Ensure story.userId is converted to ObjectId from 'mongodb'
        let authorId: ObjectId | null = null;
        if (story.userId && ObjectId.isValid(story.userId)) {
          authorId = toObjectId(story.userId);
        } else {
          console.warn(`Invalid author ID for story ${story._id}: ${story.userId}`);
        }

        let author = null;
        let followersCount = 0;
        let isFollowing = false;

        if (authorId) { // Proceed only if authorId is a valid ObjectId
          author = await db.collection("users").findOne(
            { _id: authorId }, // NEW: Use ObjectId from 'mongodb' here
            { projection: { _id: 1, name: 1, avatar: 1, bio: 1 } }
          );

          followersCount = await db.collection("follows").countDocuments({
            followingId: authorId, // NEW: Use ObjectId from 'mongodb' here
          });

          if (currentUserId && authorId.toString() !== currentUserId.toString()) {
            const followRecord = await db.collection("follows").findOne({
              followerId: currentUserId,
              followingId: authorId, // NEW: Use ObjectId from 'mongodb' here
            });
            isFollowing = !!followRecord;
          }
        }

        return {
          ...story,
          author: {
            _id: author?._id?.toString() || (authorId ? authorId.toString() : "unknown"),
            name: author?.name || "Unknown User",
            avatar: author?.avatar || null,
            bio: author?.bio || null,
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