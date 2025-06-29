// migrate-data.ts
// This file should be in your project's main folder.

import mongoose from 'mongoose';
// IMPORTS: Note the '.js' extensions here.
// Node.js (with ts-node/esm) needs these explicit extensions for module resolution.
// The paths assume your models are in 'src/models/' and migrate-data.ts is in the project root.
import Post from './src/models/post.js';
import Writing from './src/models/writing.js';
import User from './src/models/user.js';

async function migrateData() {
  // Your MongoDB connection string.
  // Make sure this is correct!
  const MONGODB_URI = 'mongodb+srv://Talesy_13:HelloTalesy@talesy.qrlgvg8.mongodb.net/talesy?retryWrites=true&w=majority';

  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not set. Please configure it in this script.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB se connect ho gaya hai migration ke liye.');

    // --- Posts Migration ---
    console.log('Posts ko migrate karna shuru kar rahe hain...');
    const postsToMigrate = await Post.find({ userId: { $exists: true, $ne: null } });

    for (const post of postsToMigrate) {
      if (mongoose.Types.ObjectId.isValid(post.userId)) {
        post.author = new mongoose.Types.ObjectId(post.userId);
        await post.save();
        console.log(`Post ID theek kiya: ${post._id}. Purana userId: ${post.userId} -> Naya author: ${post.author}`);
      } else {
        console.warn(`Post ID: ${post._id} ko skip kar rahe hain, kyunki userId sahi nahin hai: ${post.userId}`);
      }
    }
    console.log('Posts ki migration poori ho gayi.');

    // --- Writings Migration ---
    console.log('Writings ko migrate karna shuru kar rahe hain...');
    const writingsToMigrate = await Writing.find({ userId: { $exists: true, $ne: null } });

    for (const writing of writingsToMigrate) {
      if (mongoose.Types.ObjectId.isValid(writing.userId)) {
        writing.author = new mongoose.Types.ObjectId(writing.userId);
        await writing.save();
        console.log(`Writing ID theek kiya: ${writing._id}. Purana userId: ${writing.userId} -> Naya author: ${writing.author}`);
      } else {
        console.warn(`Writing ID: ${writing._id} ko skip kar rahe hain, kyunki userId sahi nahin hai: ${writing.userId}`);
      }
    }
    console.log('Writings ki migration poori ho gayi.');

  } catch (error) {
    console.error('Migration mein galti ho gayi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB se disconnect ho gaya.');
    process.exit(0);
  }
}

migrateData();