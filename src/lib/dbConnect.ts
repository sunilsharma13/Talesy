// src/lib/dbConnect.ts
import mongoose from 'mongoose';
import { Db, MongoClient } from 'mongodb';

// IMPORTS FOR YOUR MODELS:
// Make sure these paths are correct relative to dbConnect.ts
// Assuming dbConnect.ts is in src/lib and models are in src/models
import '@/models/post';    // Corrected path if models are directly in src/models
import '@/models/writing'; // Assuming you have a Writing model if not covered by Post
import '@/models/user';     // Import your User model
import '@/models/comment';
import '@/models/commentLike';
import '@/models/notification'; // <--- NEW: Added import for Notification model here

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, clientPromise: null };
}

async function dbConnect(): Promise<{ conn: typeof mongoose; db: Db }> {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection.');
    return { conn: cached.conn, db: cached.conn.connection.db! };
  }

  if (!cached.promise) {
    console.log('Attempting to connect to MongoDB...');
    
    // <--- NEW: Added this line to suppress strictQuery warning and ensure consistent behavior
    mongoose.set('strictQuery', true); 
    // -----------------------------------------------------------------------------------

    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((m) => {
      console.log('✅ Connected to MongoDB Atlas successfully.');

      if (!m.connection) {
          console.error("CRITICAL ERROR: Mongoose connected but connection object is missing or null!");
          throw new Error("Mongoose connection not available after connection.");
      }

      try {
        const mongooseClient = (m.connection as any).client;

          if (!mongooseClient) {
              console.error("Mongoose client is unexpectedly null or undefined!");
               throw new Error("Mongoose client not available after connection.");
           }

          const mongoClient: MongoClient = mongooseClient as MongoClient;
           cached.clientPromise = Promise.resolve(mongoClient);
       } catch (err) {
           console.error("Failed to retrieve MongoDB client from Mongoose connection:", err);
            throw new Error("Failed to retrieve MongoDB client.");
        }

      console.log('Cached clientPromise set.');
      return m;
    })
    .catch((error) => {
        console.error('❌ MongoDB connection FAILED in promise chain:', error.message);
        console.error('Full connection error object:', error);
        cached.promise = null;
        cached.conn = null;
        cached.clientPromise = null;
        throw error;
    });
  }

  cached.conn = await cached.promise;
  return { conn: cached.conn, db: cached.conn.connection.db! };
}

export async function getMongoClient(): Promise<MongoClient> {
    await dbConnect();
    if (!cached.clientPromise) {
        console.error("CRITICAL: cached.clientPromise is null after dbConnect. Something went wrong.");
        throw new Error("MongoClient promise not available.");
    }
    return cached.clientPromise;
}

export default dbConnect;