// src/app/api/posts/user/[id]/route.ts (This is where the content should be)
import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid ObjectId string');
  }
  return new ObjectId(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const session = await getServerSession(authOptions);

    if (!session || session.user?.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized: You can only view your own stories here.' }, { status: 403 });
    }

    let currentUserIdObj: ObjectId;
    try {
      currentUserIdObj = toObjectId(userId);
    } catch (e) {
      console.error("Invalid userId format for posts API:", userId, e);
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db('talesy');

    const postsCollection = db.collection('writings');
    const followsCollection = db.collection('follows');

    const storiesRaw = await postsCollection.aggregate([
      {
        $match: {
          author: currentUserIdObj,
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      {
        $unwind: '$authorDetails'
      },
      {
        $lookup: {
          from: 'follows',
          localField: 'authorDetails._id',
          foreignField: 'followingId',
          as: 'authorFollowersList'
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          imageUrl: 1,
          createdAt: 1,
          likes: { $ifNull: ["$likes", 0] },
          comments: { $ifNull: ["$comments", 0] },
          status: 1,
          author: {
            _id: '$authorDetails._id',
            name: '$authorDetails.name',
            avatar: { $ifNull: ['$authorDetails.avatar', '$authorDetails.image', '/default-avatar.png'] },
            email: '$authorDetails.email',
            bio: '$authorDetails.bio',
            coverImage: '$authorDetails.coverImage',
            followers: { $size: '$authorFollowersList' },
          },
        }
      }
    ]).toArray();

    const stories = storiesRaw.map(story => ({
      ...story,
      author: {
        ...story.author,
        isFollowing: false,
      },
      isLikedByCurrentUser: false,
    }));

    return NextResponse.json(stories);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}