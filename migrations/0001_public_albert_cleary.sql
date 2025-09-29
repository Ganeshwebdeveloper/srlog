CREATE TABLE "db_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" text NOT NULL,
	"record_count" numeric(12, 0) NOT NULL,
	"size_bytes" numeric(15, 0) NOT NULL,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "altitude" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "speed" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "heading" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "accuracy" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "start_location" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "end_location" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "distance" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "estimated_duration" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "fuel_consumed" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "driver_wage" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "priority" text DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'available';--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "year" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "fuel_type" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "capacity" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "mileage" numeric(10, 2);