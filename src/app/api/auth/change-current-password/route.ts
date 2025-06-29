// app/api/auth/change-current-password/route.ts (Updated Code with detailed logs)

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Your NextAuth.js config
import User from "@/models/user"; // Your Mongoose User model
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect"; // Your DB connection utility

export async function POST(request: Request) {
  // Connect to the database
  await dbConnect(); 
  console.log("API Route: /api/auth/change-current-password POST request received.");

  try {
    // Get the user session from NextAuth.js
    const session = await getServerSession(authOptions);

    console.log("API Route: Session object from getServerSession:", session); // **LOG 1: Check entire session**

    // Check if session or user/ID exists
    if (!session || !session.user || !session.user.id) {
      console.log("Unauthorized: No session or user ID found. Session:", session); // **LOG 2: If session is missing data**
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }

    console.log("API Route: User ID from session:", session.user.id); // **LOG 3: Confirm user ID from session**

    // Parse the request body to get passwords
    const { oldPassword, newPassword } = await request.json();
    console.log("API Route: Received passwords (old/new lengths):", oldPassword ? oldPassword.length : 0, newPassword ? newPassword.length : 0); // **LOG 4: Check if passwords received**

    // Basic validation for passwords
    if (!oldPassword || !newPassword) {
      console.log("Bad Request: Old and/or new password missing.");
      return new Response(JSON.stringify({ message: "Old and new password are required" }), { status: 400 });
    }
    
    if (newPassword.length < 8) {
        console.log("Bad Request: New password too short.");
        return new Response(JSON.stringify({ message: "New password must be at least 8 characters long" }), { status: 400 });
    }

    // Find the user in the database by their ID and include the hashed password
    const user = await User.findById(session.user.id).select('+password'); // '+password' ensures password field is fetched

    console.log("API Route: User found in DB for ID:", user ? user._id : "None"); // **LOG 5: Confirm user found in DB**

    // If user not found (shouldn't happen if session is valid, but good to check)
    if (!user) {
      console.log(`Unauthorized: User with ID ${session.user.id} not found in DB.`); // **LOG 6: If user not found in DB**
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }

    // Verify the old password provided by the user against the hashed password in the database
    console.log("API Route: Comparing old password...");
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    console.log("API Route: Old password match result:", isMatch); // **LOG 7: This is the most critical log!**

    if (!isMatch) {
      console.log("Unauthorized: Old password does not match."); // **LOG 8: If old password is incorrect**
      return new Response(JSON.stringify({ message: "Incorrect old password" }), { status: 401 });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save(); // Save the user with the new hashed password

    console.log("Password updated successfully for user:", user._id);
    return new Response(JSON.stringify({ message: "Password updated successfully!" }), { status: 200 });

  } catch (error: any) {
    // Catch any other unexpected errors during the process
    console.error("Error in password change API:", error);
    // You might want to return a more specific error message in production
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}