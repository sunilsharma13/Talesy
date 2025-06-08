import mongoose, { Schema, Document, models, model } from "mongoose";

export interface WritingDocument extends Document {
  title: string;
  content: string;
  imageUrl: string;
  userId: string;
  status: "draft" | "published";
  createdAt: Date;
}

const WritingSchema = new Schema<WritingDocument>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  userId: { type: String, required: true },
  status: { type: String, enum: ["draft", "published"], default: "published" },
  createdAt: { type: Date, default: Date.now },
});

const Writing = models.Writing || model<WritingDocument>("Writing", WritingSchema);

export default Writing;
