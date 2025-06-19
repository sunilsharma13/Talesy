// app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // Make sure bcryptjs is imported
import { getMongoClient } from "@/lib/dbConnect"; // <--- Change here

export async function POST(req: Request) {
  try {
    const { name, username, email, password } = await req.json();

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
        return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    const client = await getMongoClient(); // <--- Change here
    const db = client.db("talesy");
    const usersCollection = db.collection("users");

    // Convert email to lowercase for consistent storage/lookup
    const lowercasedEmail = email.toLowerCase(); 

    const existingUser = await usersCollection.findOne({ $or: [{ email: lowercasedEmail }, { username }] });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email or username." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // HASH THE PASSWORD

    const result = await usersCollection.insertOne({
      name,
      username,
      email: lowercasedEmail, // Store lowercased email
      password: hashedPassword, // Store the HASHED password
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "User registered successfully", userId: result.insertedId });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}