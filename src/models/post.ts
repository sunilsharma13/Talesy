import mongoose, { Schema, model, models } from "mongoose";

const postSchema = new Schema(
  {
    title: String,
    content: String,
    imageUrl: String,
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    userId: {
      type: String, // ✅ MUST be String, not ObjectId
      required: true,
    },
  },
  { timestamps: true }
);

const Post = models.Post || model("Post", postSchema);
export default Post;
