// app/api/users/search/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongoClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const client = await clientPromise;
    const db = client.db("talesy");

    const users = await db
      .collection("users")
      .find({
        name: { $regex: query, $options: "i" },
      })
      .project({ password: 0 }) // never return password
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error("User search failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
