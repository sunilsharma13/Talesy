// auth.ts (or route.ts depending on your setup)
import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { getMongoClient } from "@/lib/dbConnect";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ObjectId } from 'mongodb';

type AugmentedJWT = {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    avatar?: string | null;
    bio?: string | null;
} & import("next-auth/jwt").DefaultJWT;

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(getMongoClient(), { databaseName: "talesy" }), 
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                loginIdentifier: { label: "Username or Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("--- authorize function called ---");
                console.log("Attempting login for:", credentials?.loginIdentifier);

                if (!credentials?.loginIdentifier || !credentials?.password) {
                    console.log("Missing credentials.");
                    return null;
                }

                try {
                    await dbConnect();
                    // Yahan change kiya hai: mongoose.connection.db!
                    const db = mongoose.connection.db!; 

                    const user = await db.collection("users").findOne({
                        $or: [
                            { username: credentials.loginIdentifier },
                            { email: credentials.loginIdentifier }
                        ]
                    });

                    if (!user) {
                        console.log("User not found for identifier:", credentials.loginIdentifier);
                        return null; 
                    }

                    console.log("User found. Attempting password comparison for:", user.username || user.email);

                    if (!user.password || typeof user.password !== 'string') {
                        console.log("User password field is missing or invalid in DB for:", user.username || user.email);
                        return null;
                    }

                    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isPasswordValid) {
                        console.log("Password comparison failed for user:", user.username || user.email);
                        return null;
                    }

                    console.log("Login successful for user:", user.username || user.email);
                    return {
                        id: user._id.toString(),
                        name: user.name || "",
                        email: user.email || "",
                        image: user.image || "",
                        avatar: user.avatar || "",
                        bio: user.bio || "",
                    };
                } catch (error) {
                    console.error("Error in authorize function:", error);
                    return null;
                }
            }
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email || "";
                token.image = user.image || "";
                token.avatar = token.avatar || "";
                token.bio = token.bio || "";
            }
            return token;
        },
        async session({ session, token: rawToken }) {
            const token = rawToken as AugmentedJWT;

            session.user = {
                id: token.id as string,
                name: token.name,
                email: token.email,
                image: token.image,
                avatar: token.avatar,
                bio: token.bio || "",
            } as DefaultSession["user"] & { id: string, avatar?: string | null, bio?: string | null };

            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/error",
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);