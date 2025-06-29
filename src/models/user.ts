// src/models/user.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  username?: string;
  password?: string;
  image?: string;
  avatar?: string;
  bio?: string;
  coverImage?: string;
  isActive: boolean;
  tokenVersion: number;
  // --- ADDED: Notification Settings ---
  notificationSettings: {
    comments: boolean;
    follows: boolean;
    likes: boolean;
    messages: boolean; // Added another common option
  };
  // --- END ADDED ---
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    image: {
      type: String,
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    // --- ADDED: Notification Settings Schema Definition ---
    notificationSettings: {
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
    },
    // --- END ADDED ---
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);
export default User;