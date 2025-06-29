// src/models/commentLike.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface ICommentLike extends Document {
  userId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId; // The ID of the comment that was liked
  createdAt: Date;
}

const CommentLikeSchema: Schema<ICommentLike> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetId: { // The ID of the comment (or post, etc.) that was liked
      type: Schema.Types.ObjectId,
      ref: 'Comment', // Reference to the Comment model
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt
  }
);

// Ensure a user can only like a specific comment once
CommentLikeSchema.index({ userId: 1, targetId: 1 }, { unique: true });

const CommentLike = models.CommentLike || model<ICommentLike>('CommentLike', CommentLikeSchema);

export default CommentLike;