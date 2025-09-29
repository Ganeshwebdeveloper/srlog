-- Create tables for SR Logistics Fleet Management System

CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "role" text NOT NULL,
  "status" text DEFAULT 'available',
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "vehicles" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "number_plate" text NOT NULL UNIQUE,
  "type" text NOT NULL,
  "status" text NOT NULL,
  "model" text,
  "year" text,
  "fuel_type" text,
  "capacity" numeric(8, 2),
  "mileage" numeric(10, 2),
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "trips" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "driver_id" varchar NOT NULL,
  "vehicle_id" varchar NOT NULL,
  "route" text NOT NULL,
  "status" text NOT NULL,
  "start_location" text,
  "end_location" text,
  "distance" numeric(8, 2),
  "estimated_duration" numeric(6, 2),
  "fuel_consumed" numeric(8, 2),
  "driver_wage" numeric(10, 2),
  "priority" text DEFAULT 'medium',
  "notes" text,
  "start_time" timestamp,
  "end_time" timestamp,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "locations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trip_id" varchar NOT NULL,
  "latitude" numeric(10, 8) NOT NULL,
  "longitude" numeric(11, 8) NOT NULL,
  "altitude" numeric(8, 2),
  "speed" numeric(6, 2),
  "heading" numeric(6, 2),
  "accuracy" numeric(6, 2),
  "timestamp" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "db_stats" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "table_name" text NOT NULL,
  "record_count" numeric(12, 0) NOT NULL,
  "size_bytes" numeric(15, 0) NOT NULL,
  "last_updated" timestamp DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "locations" ADD CONSTRAINT "locations_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE no action ON UPDATE no action;

-- Insert sample data
INSERT INTO "users" ("name", "email", "password", "role", "status") VALUES
('John Admin', 'admin@srlogistics.com', '$2b$10$ubTkp.g4BDWCejM.hf.63.zkn1Ap73pRxNO2LQvMpO6Yy9TgC0p9a', 'admin', 'available'),
('Mike Driver', 'driver@srlogistics.com', '$2b$10$gAAttSPm6MVsQkKdlFqNUe6hRVjwuU3mqM2ens9UkyFKC7R1w3YzC', 'driver', 'available')
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "vehicles" ("number_plate", "type", "status", "model", "year", "fuel_type", "capacity", "mileage") VALUES
('TRK-001', 'Truck', 'available', 'Volvo FH16', '2023', 'diesel', 25000, 85000),
('VAN-205', 'Van', 'in_use', 'Mercedes Sprinter', '2022', 'diesel', 3500, 45000)
ON CONFLICT ("number_plate") DO NOTHING;