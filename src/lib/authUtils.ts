import { customAlphabet } from 'nanoid';
// REMOVED: import clientPromise from './mongoClient'; // This line is removed as we are using Mongoose now
import { sendEmail } from './email';
import { ObjectId } from 'mongodb'; // Keep this if you need to work with raw MongoDB ObjectIds for specific cases
import dbConnect from './dbConnect'; // Import your Mongoose dbConnect utility
import User from '../models/user'; // Import your Mongoose User model (adjust path if needed, assuming src/lib and src/models)
import mongoose from 'mongoose'; // Import mongoose to get the connection.db if needed for non-modeled collections

const generateToken = customAlphabet('0123456789', 4);

export async function generatePasswordResetToken(userId: string) {
  try {
    // Connect to the database and destructure the returned 'db' object
    // This ensures Mongoose is connected and returns the native MongoDB Db object.
    const { db } = await dbConnect(); // <-- CORRECTED LINE

    const token = generateToken();

    // Use the native MongoDB Db object 'db' to interact with collections that
    // might not have a dedicated Mongoose schema (like 'passwordResets').
    const result = await db.collection('passwordResets').insertOne({
      userId, // Store as string if that's how it's stored in your passwordResets collection
      token,
      createdAt: new Date(),
    });

    if (result?.acknowledged) {
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;

      // Use the Mongoose User model to find the user
      // User.findById() is generally preferred over db.collection('users').findOne()
      // when you have a Mongoose model for User.
      const user = await User.findById(userId);

      const userEmail = user?.email || null;

      if (userEmail) {
        await sendEmail(
          userEmail,
          "Password Reset Request",
          `Your OTP for password reset is: ${token}`,
          `<div>Your OTP is: <strong>${token}</strong></div>`
        );
        return token;
      } else {
        console.error("❌ Cannot send OTP. Invalid user email or ID.", user);
        throw new Error("Cannot reset password. No user or email found.");
      }
    }
  } catch (error) {
    console.error("❌ Error creating OTP or sending reset email:", error);
    return null;
  }
  return null;
}