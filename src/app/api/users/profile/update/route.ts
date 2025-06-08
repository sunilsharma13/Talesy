// app/api/users/profile/update/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongoClient";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { name, bio, avatar } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("talesy");
    
    // Find the user first to ensure they exist
    let userQuery: any = { email: session.user.email };
    
    const existingUser = await db.collection("users").findOne(userQuery);
    
    if (!existingUser) {
      // If user not found by email, try by ID (if available)
      if (session.user.id) {
        // Try with ObjectId if it's valid
        if (ObjectId.isValid(session.user.id)) {
          existingUser = await db.collection("users").findOne({ 
            _id: new ObjectId(session.user.id) 
          });
        } 
        
        // If still not found, try with string ID
        if (!existingUser) {
          existingUser = await db.collection("users").findOne({ 
            _id: session.user.id 
          });
        }
      }
      
      if (!existingUser) {
        return NextResponse.json(
          { error: "User not found" }, 
          { status: 404 }
        );
      }
    }
    
    // Now update the user with the right query
    let updateQuery: any;
    
    if (existingUser._id instanceof ObjectId) {
      updateQuery = { _id: existingUser._id };
    } else if (typeof existingUser._id === 'string') {
      updateQuery = { _id: existingUser._id };
    } else {
      updateQuery = { email: session.user.email };
    }
    
    // Update user with new data
    await db.collection("users").updateOne(
      updateQuery,
      {
        $set: {
          name,
          bio,
          avatar,
          updatedAt: new Date()
        }
      }
    );
    
    // Return success response
    return NextResponse.json({
      success: true,
      user: {
        name,
        bio,
        avatar
      }
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}