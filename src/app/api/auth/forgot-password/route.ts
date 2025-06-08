import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoClient";
import { sendEmail } from "@/lib/email"; // ✅ using your helper
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const { emailOrUsername } = await req.json();

  if (!emailOrUsername) {
    return NextResponse.json(
      { error: "Email or username is required" },
      { status: 400 }
    );
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Try to find the user by email or name
    const user = await usersCollection.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { name: emailOrUsername },
      ],
    });

    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const email = user.email.toLowerCase();
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

    console.log("OTP for", email, "is", otp);

    // Save the OTP in a temporary collection
    await db.collection("password_resets").updateOne(
      { email },
      { $set: { otp, createdAt: new Date() } },
      { upsert: true }
    );

    // Send email using reusable helper
    const result = await sendEmail(
      email,
      "Your OTP for resetting password",
      `Your OTP is ${otp}`,
      `<p>Your OTP is: <strong>${otp}</strong></p>`
    );

    if (!result.success) {
      console.error("Failed to send email:", result.error);
      return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
