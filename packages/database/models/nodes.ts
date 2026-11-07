import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";


export const fleetNodesTable = pgTable(
  "fleet_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Connect each node to its owner.
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      }),

    // Node identity and operating system.
    nodeId: varchar("node_id", { length: 255 }).notNull(),

    hostname: varchar("hostname", { length: 255 }).notNull(),

    os: varchar("os", { length: 255 }).notNull(),

    kernel: varchar("kernel", { length: 255 }).notNull(),

    architecture: varchar("architecture", {
      length: 50,
    }).notNull(),

    // CPU metrics.
    cpuCores: integer("cpu_cores").notNull(),

    cpuUsagePercent: doublePrecision(
      "cpu_usage_percent",
    ).notNull(),

    // Memory metrics in MB.
    memoryTotalMB: integer("memory_total_mb").notNull(),

    memoryUsedMB: integer("memory_used_mb").notNull(),

    // Disk metrics in MB.
    diskTotalMB: integer("disk_total_mb").notNull(),

    diskUsedMB: integer("disk_used_mb").notNull(),

    // Optional: desktops and VMs may not have battery data.
    battery: varchar("battery", { length: 100 }),

    // Time when the node generated its latest report.
    reportedAt: timestamp("reported_at", {
      withTimezone: true,
    }).notNull(),

    nodeCredentialHash: varchar("node_credential_hash", {
  length: 64,
}).notNull().unique(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("fleet_nodes_user_node_unique").on(
      table.userId,
      table.nodeId,
    ),
  ],
);
