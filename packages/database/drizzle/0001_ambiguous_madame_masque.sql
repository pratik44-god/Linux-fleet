CREATE TABLE "fleet_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"node_id" varchar(255) NOT NULL,
	"hostname" varchar(255) NOT NULL,
	"os" varchar(255) NOT NULL,
	"kernel" varchar(255) NOT NULL,
	"architecture" varchar(50) NOT NULL,
	"cpu_cores" integer NOT NULL,
	"cpu_usage_percent" double precision NOT NULL,
	"memory_total_mb" integer NOT NULL,
	"memory_used_mb" integer NOT NULL,
	"disk_total_mb" integer NOT NULL,
	"disk_used_mb" integer NOT NULL,
	"battery" varchar(100),
	"reported_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fleet_nodes" ADD CONSTRAINT "fleet_nodes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fleet_nodes_user_node_unique" ON "fleet_nodes" USING btree ("user_id","node_id");