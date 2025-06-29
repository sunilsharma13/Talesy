// src/models/comment.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId | null; // Null for top-level comments
  likesCount: number; // Denormalized count of likes for performance
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema<IComment> = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment', // A comment can be a reply to another comment
      default: null,
    },
    likesCount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for efficient querying
CommentSchema.index({ postId: 1, parentId: 1 });
CommentSchema.index({ userId: 1 });

const Comment = models.Comment || model<IComment>('Comment', CommentSchema);
export default Comment;