
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { usersTable } from "./user";
import { fleetNodesTable } from "./nodes";

// Alert category enum.
export const alertCategoryEnum = pgEnum("alert_category", [
  "CRITICAL",
  "WARNING",
]);

// Alerts table.
export const alertsTable = pgTable(
  "alerts",
  {
    // Unique alert ID.
    id: uuid("id").primaryKey().defaultRandom(),

    // Alert message.
    message: text("message").notNull(),

    // Alert category.
    category: alertCategoryEnum("category").notNull(),

    // Whether the alert has been read.
    isRead: boolean("is_read").default(false).notNull(),

    // Connect alert to its owner.
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      }),

    // Connect alert to its node.
    nodeId: uuid("node_id")
      .notNull()
      .references(() => fleetNodesTable.id, {
        onDelete: "cascade",
      }),

    // Alert creation time.
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    // Alert update time.
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("alerts_user_id_idx").on(table.userId),

    index("alerts_node_id_idx").on(table.nodeId),

    index("alerts_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);
