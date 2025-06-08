import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongoClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { token } = req.body;

  if (!token || token.length !== 4) {
    res.status(400).json({ error: "Invalid token" });
    return;
  }

  try {
    const client = await clientPromise;
    const db = client.db("talesy");

    // Find OTP record and check if not expired (e.g., 15 mins)
    const resetRecord = await db.collection("passwordResets").findOne({ token });

    if (!resetRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const now = new Date();
    const createdAt = new Date(resetRecord.createdAt);
    const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

    if (diffMinutes > 15) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Return success with userId so frontend can save or query on next step
    return res.status(200).json({ userId: resetRecord.userId });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
