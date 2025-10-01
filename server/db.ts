import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../shared/schema.js";

let db: any = null;
let client: postgres.Sql | null = null;
let isInitialized = false;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export async function initializeDatabase(): Promise<any> {
  if (isInitialized && db) {
    return db;
  }

  const databaseUrl = getDatabaseUrl();
  
  if (!databaseUrl) {
    console.log("DATABASE_URL not found, falling back to in-memory storage");
    isInitialized = true;
    return null;
  }

  try {
    console.log("Attempting to connect to database...");
    
    client = postgres(databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    const drizzleDb = drizzle(client, { schema });
    
    await drizzleDb.execute(sql`SELECT 1`);
    console.log("Database connection successful");
    
    db = drizzleDb;
    isInitialized = true;
    return db;
  } catch (error) {
    console.warn("Database connection failed, falling back to in-memory storage:", error);
    isInitialized = true;
    return null;
  }
}

export function getPostgresClient(): postgres.Sql | null {
  return client;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
    db = null;
    isInitialized = false;
  }
}

export { db };
