// src/app/api/posts/route.ts (Updated to include author's followers count)
import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const url = new URL(req.url);
    const publishedOnly = url.searchParams.get('publishedOnly') === 'true';
    const sortOrder = url.searchParams.get('sortOrder') || 'latest';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const fetchFollowingFeed = url.searchParams.get('following') === 'true';

    const client = await getMongoClient();
    const db = client.db('talesy');
    const postsCollection = db.collection('writings');
    const usersCollection = db.collection('users'); // Need this to get user's followers
    const followsCollection = db.collection('follows');

    let query: any = {};
    if (publishedOnly) {
      query.status = 'published';
    }

    let sort: any = { createdAt: -1 };

    if (fetchFollowingFeed) {
      if (!session?.user?.id) {
        return NextResponse.json({ message: 'Authentication required for following feed.' }, { status: 401 });
      }

      const currentUserIdObj = new ObjectId(session.user.id);

      const followedUsersRecords = await followsCollection.find(
        { followerId: currentUserIdObj }
      ).project({ followingId: 1, _id: 0 }).toArray();

      const followedUserIds = followedUsersRecords.map(record => record.followingId);

      if (followedUserIds.length === 0) {
        return NextResponse.json([]);
      }

      query.author = { $in: followedUserIds };
    }

    const posts = await postsCollection.aggregate([
      { $match: query },
      { $sort: sort },
      { $limit: limit },
      {
        $lookup: {
          from: 'users', // The collection name for users
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      {
        $unwind: '$authorDetails'
      },
      // NEW: Look up followers for each author from the 'follows' collection
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
          likes: 1,
          comments: 1,
          status: 1,
          'author._id': '$authorDetails._id',
          'author.name': '$authorDetails.name',
          'author.avatar': '$authorDetails.avatar',
          'author.followers': { $size: '$authorFollowersList' }, // Get count of followers
        }
      }
    ]).toArray();

    // Now, let's inject `isFollowing` property into each author object for *all* fetched posts
    // This part runs AFTER the aggregation to check `isFollowing` status for the *current user* for *each author*
    const postsWithIsFollowing = await Promise.all(posts.map(async (post: any) => {
      let isFollowingAuthor = false;
      if (session?.user?.id && post.author?._id) {
        const currentUserIdObj = new ObjectId(session.user.id);
        const authorIdObj = new ObjectId(post.author._id);
        const followRecord = await followsCollection.findOne({
          followerId: currentUserIdObj,
          followingId: authorIdObj,
        });
        isFollowingAuthor = !!followRecord;
      }
      return {
        ...post,
        author: {
          ...post.author,
          isFollowing: isFollowingAuthor,
        }
      };
    }));


    return NextResponse.json(postsWithIsFollowing);

  } catch (error) {
    console.error('Error fetching feed stories:', error);
    return NextResponse.json({ error: 'Failed to fetch feed stories.' }, { status: 500 });
  }
}