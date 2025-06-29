// app/api/auth/logout-all/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Your NextAuth.js config
import User from "@/models/user"; // Your Mongoose User model
import dbConnect from "@/lib/dbConnect"; // Your DB connection utility

export async function POST(request: Request) {
  await dbConnect();
  console.log("API Route: /api/auth/logout-all POST request received.");

  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      console.log("Unauthorized: No session or user ID found for logout-all.");
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }

    const userId = session.user.id;
    console.log(`Attempting to log out all devices for user ID: ${userId}`);

    // Increment the tokenVersion for this user in the database
    // This will invalidate all existing JWTs for this user in the 'session' callback
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { tokenVersion: 1 } }, // Increment tokenVersion by 1
      { new: true }                 // Return the updated document
    );

    if (!user) {
      console.log(`Not Found: User with ID ${userId} not found for logout-all.`);
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    console.log(`User ${userId} tokenVersion incremented to ${user.tokenVersion}. All old tokens are now invalidated.`);

    return new Response(JSON.stringify({ message: "Successfully logged out from all other devices." }), { status: 200 });

  } catch (error: any) {
    console.error("Error in logout-all devices API:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}