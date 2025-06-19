// app/api/cron/weekly-digest/route.ts
import { NextResponse } from 'next/server';
import { getMongoClient } from "@/lib/dbConnect"; // <-- Yahan change kiya
import { ObjectId } from 'mongodb';
import { sendTemplateEmail } from '@/lib/email';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      console.warn("Unauthorized attempt to access weekly digest cron job.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await getMongoClient(); // <-- Yahan change kiya
    const db = client.db('talesy');
    
    const users = await db.collection('users')
      .find({ 'emailPreferences.weeklyDigest': { $ne: false } })
      .toArray();
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const emailPromises = users.map(async (user) => {
      if (!user.email || typeof user.email !== 'string') {
        console.warn(`Skipping weekly digest for user with invalid email: ${user.email}`);
        return null;
      }
      
      let userId: ObjectId;
      if (user._id instanceof ObjectId) {
        userId = user._id;
      } else if (typeof user._id === 'string' && ObjectId.isValid(user._id)) {
        userId = new ObjectId(user._id);
      } else {
        console.error("Invalid or missing user ID for digest processing:", user._id);
        return null;
      }
      
      const newFollowers = await db.collection('follows')
        .countDocuments({
          followingId: userId,
          createdAt: { $gte: oneWeekAgo }
        });
        
      const userPosts = await db.collection('writings')
        .find({ userId: userId })
        .toArray();
      
      const postObjectIds = userPosts.map(post => post._id); 
      
      const newLikes = await db.collection('likes')
        .countDocuments({
          postId: { $in: postObjectIds },
          createdAt: { $gte: oneWeekAgo }
        });
        
      const newComments = await db.collection('comments')
        .countDocuments({
          postId: { $in: postObjectIds },
          createdAt: { $gte: oneWeekAgo }
        });
      
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
        } catch (emailError: any) {
          console.error(`Failed to send weekly digest email to ${user.email}:`, emailError.message || emailError);
        }
      }
      
      return null;
    });
    
    await Promise.allSettled(emailPromises);
    
    return NextResponse.json({ success: true, message: "Weekly digest process initiated." });
  } catch (error: any) {
    console.error('Weekly digest error:', error.message || error);
    return NextResponse.json({ 
      error: 'Server error', 
      message: error.message || 'Unknown error during weekly digest processing' 
    }, { status: 500 });
  }
}