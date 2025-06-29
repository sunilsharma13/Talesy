// next-auth.d.ts

// Make sure to import all necessary types
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

// Declare module for "next-auth" to augment its interfaces
declare module "next-auth" {
  // Augment the Session interface
  interface Session {
    user: {
      id: string; // Your custom 'id' property (should always be present if logged in)
      // Properties from DefaultSession["user"] will be merged here implicitly
      // or explicitly using `& DefaultSession["user"]`
      avatar?: string | null; // Your custom 'avatar' property
      bio?: string | null;    // Your custom 'bio' property
    } & DefaultSession["user"]; // Important: Intersect with DefaultSession's user

    // ADD THIS LINE: This declares accessToken on the Session object
    accessToken?: string;
  }

  // Augment the User interface (the type of 'user' passed to callbacks, e.g., in `jwt({ user })`)
  interface User extends DefaultUser { // Important: Extend DefaultUser
    id: string; // Your custom 'id' property
    avatar?: string | null; // Your custom 'avatar' property
    bio?: string | null;    // Your custom 'bio' property
  }
}

// Declare module for "next-auth/jwt" to augment its interfaces
declare module "next-auth/jwt" {
  // Augment the JWT interface
  interface JWT extends DefaultJWT { // Important: Extend DefaultJWT
    id?: string; // Your custom 'id' property in the JWT
    avatar?: string | null; // Your custom 'avatar' property in the JWT
    bio?: string | null;    // Your custom 'bio' property in the JWT

    // ADD THIS LINE: This declares accessToken on the JWT token
    accessToken?: string;
  }
}