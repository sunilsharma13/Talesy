// src/models/post.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  imageUrl?: string;
  status: 'draft' | 'published';
  author: mongoose.Types.ObjectId;
  likes?: number;
  comments?: number; // Denormalized count for comments on the post
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 }, // Denormalized comment count
  tags: [{ type: String }],
}, {
  timestamps: true,
  collection: 'writings' // Or whatever your actual collection name is for posts
});

const Post = models.Post || model<IPost>('Post', PostSchema);
export default Post;