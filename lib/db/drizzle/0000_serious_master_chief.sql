CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stream_url" text NOT NULL,
	"logo_url" text,
	"category_id" integer,
	"source_id" integer,
	"external_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"language" text DEFAULT 'unknown',
	"country" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_checked_at" timestamp,
	"is_healthy" boolean,
	"health_error" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"url" text,
	"server_url" text,
	"username" text,
	"password" text,
	"last_sync_at" timestamp,
	"last_successful_sync_at" timestamp,
	"channel_count" integer DEFAULT 0 NOT NULL,
	"category_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"filter_language" text DEFAULT 'all' NOT NULL,
	"filter_countries" text,
	"filter_categories" text,
	"sync_interval_hours" integer DEFAULT 0 NOT NULL,
	"next_sync_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sync_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"channels_imported" integer DEFAULT 0 NOT NULL,
	"categories_imported" integer DEFAULT 0 NOT NULL,
	"channels_deactivated" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
