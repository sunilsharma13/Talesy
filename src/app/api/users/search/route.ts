// app/api/users/search/route.ts
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/dbConnect"; // <--- Change here
import { ObjectId } from "mongodb"; // Added ObjectId import for potential future use or consistency

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const client = await getMongoClient(); // <--- Change here
    const db = client.db("talesy");

    const users = await db
      .collection("users")
      .find({
        // Search by name or username (case-insensitive)
        $or: [
          { name: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } }, // Assuming users have a username field
        ],
      })
      .project({ password: 0, email: 0, emailPreferences: 0 }) // never return sensitive info
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error("User search failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}