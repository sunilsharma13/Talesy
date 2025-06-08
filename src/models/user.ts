// /models/user.ts
import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: String,
    email: String,
    image: String,
    userId: String,
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;
