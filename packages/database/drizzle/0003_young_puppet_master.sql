CREATE TYPE "public"."alert_category" AS ENUM('CRITICAL', 'WARNING');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message" text NOT NULL,
	"category" "alert_category" NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"user_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_node_id_fleet_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."fleet_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_user_id_idx" ON "alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alerts_node_id_idx" ON "alerts" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "alerts_user_created_at_idx" ON "alerts" USING btree ("user_id","created_at");