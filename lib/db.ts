import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not set. Copy .env.example to .env.local and add your " +
      "MongoDB Atlas connection string.",
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * In development, Turbopack/HMR re-evaluates modules on every edit. Without a
 * cache that would open a brand-new MongoDB connection each time and quickly
 * exhaust the Atlas connection pool. Stashing the connection on `globalThis`
 * keeps it a true singleton across reloads (and across route handlers).
 */
declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis._mongooseCache ?? {
  conn: null,
  promise: null,
};
globalThis._mongooseCache = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    // Non-null assertion is safe: the module throws on load if `MONGODB_URI`
    // is missing, so it is always a string by the time this runs.
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset so the next call can retry instead of reusing a rejected promise.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
