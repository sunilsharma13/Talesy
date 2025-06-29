// src/models/writing.ts
import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

export interface IWriting extends mongoose.Document {
  title: string;
  content: string;
  imageUrl?: string; // Add this line
  author: mongoose.Types.ObjectId;
  genre: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  likes: number; // Add this
  comments: number; // Add this
  status: 'draft' | 'published'; // Add this
  tags?: string[]; // Add this
}

const WritingSchema = new Schema<IWriting>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: { // <--- ADD THIS
      type: String,
      default: "", // Default to empty string if no image
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    genre: {
      type: String,
      default: "", // Consider default for optional fields
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    likes: { // <--- ADD THIS
      type: Number,
      default: 0,
    },
    comments: { // <--- ADD THIS
      type: Number,
      default: 0,
    },
    status: { // <--- ADD THIS
      type: String,
      enum: ['draft', 'published'], // Enforce specific values
      default: 'draft',
    },
    tags: { // <--- ADD THIS
      type: [String], // Array of strings
      default: [],
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // No need for transform here if userId is removed from interface
    toObject: { virtuals: true },
  }
);

const Writing = models.Writing || model<IWriting>("Writing", WritingSchema);

export default Writing;