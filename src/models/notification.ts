// src/models/notification.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';

// Define the types for your notification document
export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId; // Changed from userId to recipientId
  senderId?: mongoose.Types.ObjectId; // The user who triggered the notification (e.g., follower, commenter)
  type: 'comment' | 'follow' | 'like' | 'message' | 'system'; // Type of notification
  message: string; // The message displayed in the notification
  link?: string; // Optional link to the related content (e.g., /post/123)
  read: boolean; // Whether the user has read the notification
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    recipientId: { // Changed from userId to recipientId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
      index: true, // Index for efficient lookup by recipient ID
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    type: {
      type: String,
      enum: ['comment', 'follow', 'like', 'message', 'system'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 250,
    },
    link: {
      type: String,
      required: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Check if the model already exists before creating it
const Notification = models.Notification || model<INotification>('Notification', NotificationSchema);
export default Notification;
