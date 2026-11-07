import { z } from "../../schema";

// Alert category enum.
export const alertCategoryModel = z.enum([
  "CRITICAL",
  "WARNING",
]);

export type AlertCategory = z.infer<
  typeof alertCategoryModel
>;

// Create alert input.
export const createAlertInputModel = z.object({
  message: z.string().min(1),
  category: alertCategoryModel,
  nodeId: z.string().uuid(),
});

// Get alerts for a specific node.
export const getAlertsForNodeInputModel = z.object({
  nodeId: z.string().uuid(),
});

// Get alert by ID.
export const getAlertByIdInputModel = z.object({
  alertId: z.string().uuid(),
});

// Single alert output.
export const alertOutputModel = z.object({
  id: z.string().uuid(),
  message: z.string(),
  category: alertCategoryModel,
  isRead: z.boolean(),
  userId: z.string().uuid(),
  nodeId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create alert output.
export const createAlertOutputModel =
  alertOutputModel;

// Get all alerts output.
export const getAllAlertsOutputModel = z.array(
  alertOutputModel,
);

// Mark alert as read output.
export const markAlertAsReadOutputModel =
  alertOutputModel;

// Unread alert count output.
export const getUnreadAlertCountOutputModel = z.object({
  count: z.number().int().nonnegative(),
});

// Delete alert output.
export const deleteAlertOutputModel = z.object({
  success: z.boolean(),
  id: z.string().uuid(),
});

// Common alert action output.
export const alertActionOutputModel = z.object({
  success: z.boolean(),
  count: z.number().int().nonnegative(),
});
