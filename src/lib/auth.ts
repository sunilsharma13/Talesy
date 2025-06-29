// lib/auth.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { getMongoClient } from "@/lib/dbConnect";
import dbConnect from "@/lib/dbConnect"; 
import mongoose from "mongoose"; 
import bcrypt from "bcryptjs";
import { ObjectId } from 'mongodb'; // NextAuth is already returning string IDs, but keep for type safety if needed
import User from "@/models/user"; // <--- Zaroori: Make sure this import is correct and User model is defined

// Step 1: Extend NextAuth's built-in types to include your custom fields.
// *** BAHUT ZAROORI HAI YE BLOCKS SAHI HONA ***

// For the `session` object available on the client and server (`useSession`, `getServerSession`)
declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Explicitly define id as string for the session user
      avatar?: string | null;
      bio?: string | null;
      isActive: boolean;    // <--- THIS MUST BE HERE
      // Note: tokenVersion is kept in JWT token only, not directly in Session.user
    } & import("next-auth").DefaultSession["user"]; // Merge with default session user fields (name, email, image)
  }

  // For the `user` object returned from providers (like CredentialsProvider)
  interface User {
    id: string; // Ensure user.id is always a string when coming from authorize/adapter
    avatar?: string | null;
    bio?: string | null;
    isActive: boolean;    // <--- THIS MUST BE HERE
    tokenVersion: number; // <--- THIS MUST BE HERE
  }
}

// For the `JWT` token
declare module "next-auth/jwt" {
  interface JWT {
    // DefaultJWT already includes `id`, `name`, `email`, `picture`.
    avatar?: string | null;
    bio?: string | null;
    isActive: boolean;    // <--- THIS MUST BE HERE
    tokenVersion: number; // <--- THIS MUST BE HERE
  }
}

// *** END OF ZAROORI BLOCKS ***


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
                    // Use Mongoose User model directly to find user
                    const user = await User.findOne({
                        $or: [
                            { username: credentials.loginIdentifier },
                            { email: credentials.loginIdentifier }
                        ]
                    }).select('+password'); // Explicitly select password as it's `select: false`

                    if (!user) {
                        console.log("User not found for identifier:", credentials.loginIdentifier);
                        return null; 
                    }

                    // Check if user is active (new logic)
                    if (!user.isActive) {
                        console.log("Login failed: Account is deactivated for user:", user.email);
                        // Instead of just returning null, you can throw an error to trigger pages.error
                        // throw new Error("Account is deactivated. Please contact support.");
                        return null; // Return null for generic failed login (shows a standard error)
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
                        id: user._id.toString(), // Must be a string
                        name: user.name || null,
                        email: user.email || null,
                        image: user.image || null,
                        avatar: user.avatar || null,
                        bio: user.bio || null,
                        isActive: user.isActive,      // <--- Pass isActive from DB user to NextAuth's User object
                        tokenVersion: user.tokenVersion // <--- Pass tokenVersion from DB user
                    };
                } catch (error: any) {
                    console.error("Error in authorize function:", error.message || error);
                    // Handle specific errors if needed, otherwise return null for generic failure
                    // if (error.message === "Account is deactivated. Please contact support.") {
                    //     throw error; // Propagate for specific error page handling
                    // }
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
            // Your existing JWT callback logic
            if (user) {
                token.id = user.id; 
                token.avatar = user.avatar;
                token.bio = user.bio;
                token.isActive = user.isActive;     
                token.tokenVersion = user.tokenVersion;
            } else if (token.id) {
                await dbConnect();
                const dbUser = await User.findById(token.id);
                if (dbUser) {
                    token.isActive = dbUser.isActive;
                    token.tokenVersion = dbUser.tokenVersion;
                } else {
                    token.isActive = false;
                    token.tokenVersion = -1; // Indicate a mismatch for logout
                }
            }
            return token;
        },

        async session({ session, token }) {
            // *** IMPORTANT CHANGES HERE ***

            console.log("--- Session Callback ---");
            console.log("Incoming Token:", JSON.stringify(token, null, 2));

            // Assign basic user ID and custom fields from token to session
            session.user.id = token.id as string; 
            session.user.avatar = token.avatar;
            session.user.bio = token.bio;
            session.user.isActive = token.isActive as boolean; // This assignment should now work due to your type declarations

            // Check if user is inactive OR if token version indicates logout
            if (!token.isActive || token.tokenVersion === -1) {
                console.log(`Session rejected for user: ${token.id}. Reason: Inactive or Token Version Mismatch. Forcing logout.`);
                
                // Force session expiry to log the user out
                session.expires = new Date(0).toISOString(); // Set expiry to a very old date (Unix epoch)
                
                // Clear user data (optional, but good practice for an invalid session)
                session.user = {} as typeof session.user; // Clear user data to match the expired session
                
                return session; // Return the modified, expired session
            }

            console.log("Session valid and returned.");
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