import { z } from "../../schema";

import {
  adminProcedure,
  authenticatedProcedure,
  router,
} from "../../trpc";

import { generatePath } from "../../utils/path-generator";

import { alertService } from "../../services";

import {
  createAlertInputModel,
  createAlertOutputModel,
  getAlertByIdInputModel,
  getAllAlertsOutputModel,
  getAlertsForNodeInputModel,
  getUnreadAlertCountOutputModel,
  markAlertAsReadOutputModel,
  deleteAlertOutputModel,
  alertActionOutputModel,
} from "./model";

const TAGS = ["Alerts"];

const getPath = generatePath("/alerts");

export const alertRouter = router({

  // Create a new alert.
  createAlert: authenticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/createAlert"),
        tags: TAGS,
      },
    })
    .input(createAlertInputModel)
    .output(createAlertOutputModel)
    .mutation(async ({ ctx, input }) => {
      const alert = await alertService.createAlert({
        message: input.message,
        category: input.category,
        userId: ctx.user.id,
        nodeId: input.nodeId,
      });
      return alert;
    }),

  // Get all alerts for the authenticated user.
  getAllAlerts: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getAllAlerts"),
        tags: TAGS,
      },
    })
    .output(getAllAlertsOutputModel)
    .query(async ({ ctx }) => {
      const alerts = await alertService.getAllAlertsForUser(
        ctx.user.id,
      );

      return alerts;
    }),

  // Get alerts for a specific node.
  getAlertsForNode: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getAlertsForNode"),
        tags: TAGS,
      },
    })
    .input(getAlertsForNodeInputModel)
    .output(getAllAlertsOutputModel)
    .query(async ({ ctx, input }) => {
      const alerts = await alertService.getAlertsForNode(
        ctx.user.id,
        input.nodeId,
      );

      return alerts;
    }),

  // Get unread alerts.
  getUnreadAlerts: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getUnreadAlerts"),
        tags: TAGS,
      },
    })
    .output(getAllAlertsOutputModel)
    .query(async ({ ctx }) => {
      const alerts = await alertService.getUnreadAlerts(
        ctx.user.id,
      );

      return alerts;
    }),

  // Get unread alert count.
  getUnreadAlertCount: authenticatedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getUnreadAlertCount"),
        tags: TAGS,
      },
    })
    .output(getUnreadAlertCountOutputModel)
    .query(async ({ ctx }) => {
      const count = await alertService.getUnreadAlertCount(
        ctx.user.id,
      );

      return {
        count,
      };
    }),

  // Mark a single alert as read.
  markAlertAsRead: authenticatedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: getPath("/markAlertAsRead"),
        tags: TAGS,
      },
    })
    .input(getAlertByIdInputModel)
    .output(markAlertAsReadOutputModel)
    .mutation(async ({ ctx, input }) => {
      const alert = await alertService.markAlertAsRead(
        ctx.user.id,
        input.alertId,
      );

      return alert;
    }),

  // Mark all alerts as read.
  markAllAlertsAsRead: authenticatedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: getPath("/markAllAlertsAsRead"),
        tags: TAGS,
      },
    })
    .output(alertActionOutputModel)
    .mutation(async ({ ctx }) => {
      const alerts = await alertService.markAllAlertsAsRead(
        ctx.user.id,
      );

      return {
        success: true,
        count: alerts.length,
      };
    }),

  // Delete a single alert.
  deleteAlert: authenticatedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("/deleteAlert"),
        tags: TAGS,
      },
    })
    .input(getAlertByIdInputModel)
    .output(deleteAlertOutputModel)
    .mutation(async ({ ctx, input }) => {
      const alert = await alertService.deleteAlert(
        ctx.user.id,
        input.alertId,
      );

      return {
        success: true,
        id: alert.id,
      };
    }),

  // Delete all alerts for the authenticated user.
  deleteAllAlerts: authenticatedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("/deleteAllAlerts"),
        tags: TAGS,
      },
    })
    .output(alertActionOutputModel)
    .mutation(async ({ ctx }) => {
      const alerts = await alertService.deleteAllAlerts(
        ctx.user.id,
      );

      return {
        success: true,
        count: alerts.length,
      };
    }),

  sendingAlertMessageToUser: adminProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/sendingAlertMessageToUser"),
        tags: TAGS,
      },
    })
    .input(
      z.object({
        email: z.email(),
        message: z.string(),
}),
    )
    .output(
      z.object({
        id: z.string(),
        message: z.string(),
        category: z.enum(["CRITICAL", "WARNING"]),
        isRead: z.boolean(),
        createdAt: z.date(),
        updatedAt: z.date(),
        userId: z.string().uuid(),
        nodeId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      const alert = await alertService.sendingAlertMessageToUser(
        input.email,
        input.message,
      );

      if (!alert) {
        throw new Error("Failed to send alert message to user.");
      }

      return alert;
    })
})

