// app/api/cron/weekly-digest/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';
import { sendTemplateEmail } from '@/lib/email';

export async function GET(req: Request) {
  try {
    // Verify cron job secret
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await clientPromise;
    const db = client.db('talesy');
    
    // Get all users with weekly digest enabled
    const users = await db.collection('users')
      .find({ 'emailPreferences.weeklyDigest': { $ne: false } })
      .toArray();
    
    // Calculate one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Process each user
    const emailPromises = users.map(async (user) => {
      if (!user.email) return null;
      
      // Get user ID in appropriate format (handling potential undefined)
      let userId: ObjectId | string | undefined = user._id;
      if (userId && !(userId instanceof ObjectId) && ObjectId.isValid(String(userId))) {
        userId = new ObjectId(String(userId));
      }
      
      if (!userId) {
        console.error("Invalid user ID:", user._id);
        return null;
      }
      
      // Get stats for this user in the past week
      const newFollowers = await db.collection('follows')
        .countDocuments({
          followingId: userId,
          createdAt: { $gte: oneWeekAgo }
        });
        
      const userPosts = await db.collection('writings')
        .find({ userId: userId })
        .toArray();
      
      const postIds = userPosts.map(post => String(post._id)); // toString if needed
      
      const newLikes = await db.collection('likes')
        .countDocuments({
          postId: { $in: postIds },
          createdAt: { $gte: oneWeekAgo }
        });
        
      const newComments = await db.collection('comments')
        .countDocuments({
          postId: { $in: postIds },
          createdAt: { $gte: oneWeekAgo }
        });
      
      // Only send if there's activity
      if (newFollowers > 0 || newLikes > 0 || newComments > 0) {
        try {
          await sendTemplateEmail(
            user.email,
            'weeklyDigest',
            [
              user.name || 'User',
              { newFollowers, newLikes, newComments }
            ]
          );
          console.log('Weekly digest sent to:', user.email);
        } catch (emailError) {
          console.error("Failed to send weekly digest email:", emailError);
        }
      }
      
      return null;
    });
    
    // Wait for all emails to be send
    await Promise.all(emailPromises);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Weekly digest error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}