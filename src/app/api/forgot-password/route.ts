import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongoClient";
import { generatePasswordResetToken } from "../../../lib/authUtils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { emailOrUsername } = req.body;

  if (!emailOrUsername) {
    res.status(400).json({ error: "Email or username is required" });
    return;
  }

  try {
    const client = await clientPromise;
    const db = client.db("talesy");

    // Find user by email or username
    const user = await db.collection("users").findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = await generatePasswordResetToken(user._id.toString());

    if (!token) {
      return res.status(500).json({ error: "Failed to generate OTP" });
    }

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
