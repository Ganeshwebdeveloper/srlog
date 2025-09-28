import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access (admin or driver)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<"admin" | "driver">(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numberPlate: text("number_plate").notNull().unique(),
  type: text("type").notNull(), // truck, van, car, etc.
  status: text("status").notNull().$type<"available" | "in_use" | "maintenance">(),
  model: text("model"),
  year: text("year"),
  fuelType: text("fuel_type").$type<"diesel" | "petrol" | "electric" | "hybrid">(),
  capacity: decimal("capacity", { precision: 8, scale: 2 }), // kg or liters
  mileage: decimal("mileage", { precision: 10, scale: 2 }), // km
  createdAt: timestamp("created_at").defaultNow(),
});

// Trips table
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id),
  route: text("route").notNull(),
  status: text("status").notNull().$type<"assigned" | "in_progress" | "completed" | "cancelled">(),
  startLocation: text("start_location"),
  endLocation: text("end_location"),
  distance: decimal("distance", { precision: 8, scale: 2 }), // km
  estimatedDuration: decimal("estimated_duration", { precision: 6, scale: 2 }), // hours
  fuelConsumed: decimal("fuel_consumed", { precision: 8, scale: 2 }), // liters
  priority: text("priority").$type<"low" | "medium" | "high" | "urgent">().default("medium"),
  notes: text("notes"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Locations table for real-time tracking
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  altitude: decimal("altitude", { precision: 8, scale: 2 }), // meters
  speed: decimal("speed", { precision: 6, scale: 2 }), // km/h
  heading: decimal("heading", { precision: 6, scale: 2 }), // degrees
  accuracy: decimal("accuracy", { precision: 6, scale: 2 }), // meters
  timestamp: timestamp("timestamp").defaultNow(),
});

// Database statistics table for monitoring
export const dbStats = pgTable("db_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tableName: text("table_name").notNull(),
  recordCount: decimal("record_count", { precision: 12, scale: 0 }).notNull(),
  sizeBytes: decimal("size_bytes", { precision: 15, scale: 0 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  startTime: true,
  endTime: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  timestamp: true,
});

export const insertDbStatsSchema = createInsertSchema(dbStats).omit({
  id: true,
  lastUpdated: true,
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertDbStats = z.infer<typeof insertDbStatsSchema>;
export type DbStats = typeof dbStats.$inferSelect;
