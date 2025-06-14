// src/lib/mongoClient.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// Global is used here to maintain a cached connection across hot reloads in development
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient>;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
