import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  pgEnum
} from "drizzle-orm/pg-core";
export const userTypeEnum = pgEnum("user_type_enum", ["USER", "ADMIN"]);


export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  googleId: varchar("google_id", {length: 255}).notNull().unique(),
  fullName: varchar("full_name", { length: 80 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),

  profileImageUrl: text("profile_image_url"),

  role: userTypeEnum("role").default("USER").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
