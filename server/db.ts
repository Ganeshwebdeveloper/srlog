import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

let db: any = null;

// Async function to initialize database with connectivity check
export async function initializeDatabase(): Promise<any> {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not found, falling back to in-memory storage");
    return null;
  }

  try {
    console.log("Attempting to connect to database...");
    const client = postgres(process.env.DATABASE_URL);
    const drizzleDb = drizzle(client, { schema });
    
    // Test connectivity with a simple query
    await drizzleDb.execute(sql`SELECT 1`);
    console.log("Database connection successful");
    
    db = drizzleDb;
    return db;
  } catch (error) {
    console.warn("Database connection failed, falling back to in-memory storage:", error);
    return null;
  }
}

export { db };