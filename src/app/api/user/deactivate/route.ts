// app/api/user/deactivate/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Your NextAuth.js config
import User from "@/models/user"; // Your Mongoose User model
import dbConnect from "@/lib/dbConnect"; // Your DB connection utility

export async function DELETE(request: Request) {
  await dbConnect();
  console.log("API Route: /api/user/deactivate DELETE request received.");

  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      console.log("Unauthorized: No session or user ID found for deactivation.");
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }

    const userId = session.user.id;
    console.log(`Attempting to deactivate user with ID: ${userId}`);

    // Find the user and set isActive to false
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false }, // Set isActive to false
      { new: true }        // Return the updated document
    );

    if (!user) {
      console.log(`Not Found: User with ID ${userId} not found for deactivation.`);
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    console.log(`User ${userId} successfully deactivated (isActive: false).`);

    return new Response(JSON.stringify({ message: "Account deactivated successfully. You will be logged out." }), { status: 200 });

  } catch (error: any) {
    console.error("Error in account deactivation API:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}