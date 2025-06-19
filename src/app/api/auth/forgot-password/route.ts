// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/dbConnect"; // <-- Yahan change kiya
import { sendEmail } from "@/lib/email";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  const { emailOrUsername } = await req.json();

  if (!emailOrUsername) {
    return NextResponse.json(
      { error: "Email or username is required" },
      { status: 400 }
    );
  }

  try {
    const client = await getMongoClient(); // <-- Yahan change kiya
    const db = client.db("talesy");
    const usersCollection = db.collection("users");
    const passwordResetsCollection = db.collection("password_resets");

    const user = await usersCollection.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername },
      ],
    });

    if (!user || !user.email) {
      return NextResponse.json({ success: true, message: "If your account exists, an OTP has been sent to your email." });
    }

    const email = user.email.toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // OTP valid for 15 minutes

    await passwordResetsCollection.updateOne(
      { userId: user._id },
      { $set: { otp, email, expiresAt, createdAt: new Date(), used: false } },
      { upsert: true }
    );

    const result = await sendEmail(
      email,
      "Talesy: Your Password Reset OTP",
      `Your One-Time Password (OTP) for resetting your Talesy password is: ${otp}. This OTP is valid for 15 minutes.`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Talesy Password Reset OTP</h2>
        <p style="color: #555;">Hi ${user.name || 'there'},</p>
        <p style="color: #555;">You recently requested to reset your password for your Talesy account.</p>
        <p style="color: #555;">Your One-Time Password (OTP) is:</p>
        <h3 style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; color: #007bff; border-radius: 5px;">${otp}</h3>
        <p style="color: #555;">This OTP is valid for the next 15 minutes. Please do not share this code with anyone.</p>
        <p style="color: #555;">If you did not request a password reset, please ignore this email.</p>
        <p style="color: #777; font-size: 12px; text-align: center; margin-top: 20px;">Thanks,<br/>The Talesy Team</p>
      </div>
      `
    );

    if (!result.success) {
      console.error("Failed to send email:", result.error);
      return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}