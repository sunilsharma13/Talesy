import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongoClient";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { userId, password } = req.body;

  if (!userId || !password) {
    res.status(400).json({ error: "User ID and password are required" });
    return;
  }

  try {
    const client = await clientPromise;
    const db = client.db("talesy");

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount !== 1) {
      return res.status(400).json({ error: "Failed to update password" });
    }

    // Optionally delete any existing password reset tokens for this user (clean up)
    await db.collection("passwordResets").deleteMany({ userId });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
