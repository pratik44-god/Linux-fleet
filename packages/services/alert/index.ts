import {
  db,
  eq,
  and,
  desc,
  gte,
} from "@repo/database";

import {
  alertsTable,
  fleetNodesTable,
  usersTable,
} from "@repo/database/schema";
import { success } from "zod";

const USAGE_THRESHOLD = 90;
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

class AlertService {

  // Create a new alert.
  public async createAlert(payload: {
    message: string;
    category: "CRITICAL" | "WARNING";
    userId: string;
    nodeId: string;
  }) {
    // Verify that the node belongs to the user.
    const node = await db
      .select({
        id: fleetNodesTable.id,
      })
      .from(fleetNodesTable)
      .where(
        and(
          eq(fleetNodesTable.id, payload.nodeId),
          eq(fleetNodesTable.userId, payload.userId),
        ),
      );

    if (!node.length) {
      throw new Error(
        "Node not found or does not belong to this user",
      );
    }

    const alert = await db
      .insert(alertsTable)
      .values({
        message: payload.message,
        category: payload.category,
        userId: payload.userId,
        nodeId: payload.nodeId,
      })
      .returning();

    return alert[0]!;
  }

  // Get all alerts for a user.
  public async getAllAlertsForUser(userId: string) {
    return await db
      .select()
      .from(alertsTable)
      .where(eq(alertsTable.userId, userId))
      .orderBy(desc(alertsTable.createdAt));
  }

  // Get alerts for a specific node.
  public async getAlertsForNode(
    userId: string,
    nodeId: string,
  ) {
    return await db
      .select()
      .from(alertsTable)
      .where(
        and(
          eq(alertsTable.userId, userId),
          eq(alertsTable.nodeId, nodeId),
        ),
      )
      .orderBy(desc(alertsTable.createdAt));
  }

  // Get unread alerts for a user.
  public async getUnreadAlerts(userId: string) {
    return await db
      .select()
      .from(alertsTable)
      .where(
        and(
          eq(alertsTable.userId, userId),
          eq(alertsTable.isRead, false),
        ),
      )
      .orderBy(desc(alertsTable.createdAt));
  }

  // Get unread alert count.
  public async getUnreadAlertCount(userId: string) {
    const alerts = await db
      .select({
        id: alertsTable.id,
      })
      .from(alertsTable)
      .where(
        and(
          eq(alertsTable.userId, userId),
          eq(alertsTable.isRead, false),
        ),
      );

    return alerts.length;
  }

  // Mark a single alert as read.
  public async markAlertAsRead(
    userId: string,
    alertId: string,
  ) {
    const alert = await db
      .update(alertsTable)
      .set({
        isRead: true,
      })
      .where(
        and(
          eq(alertsTable.id, alertId),
          eq(alertsTable.userId, userId),
        ),
      )
      .returning();

    if (!alert.length) {
      throw new Error(
        "Alert not found or does not belong to this user",
      );
    }

    return alert[0]!;
  }

  // Mark all alerts as read.
  public async markAllAlertsAsRead(userId: string) {
    return await db
      .update(alertsTable)
      .set({
        isRead: true,
      })
      .where(
        and(
          eq(alertsTable.userId, userId),
          eq(alertsTable.isRead, false),
        ),
      )
      .returning();
  }

  // Delete a single alert.
  public async deleteAlert(
    userId: string,
    alertId: string,
  ) {
    const alert = await db
      .delete(alertsTable)
      .where(
        and(
          eq(alertsTable.id, alertId),
          eq(alertsTable.userId, userId),
        ),
      )
      .returning();

    if (!alert.length) {
      throw new Error(
        "Alert not found or does not belong to this user",
      );
    }

    return alert[0]!;
  }

  // Delete all alerts for a user.
  public async deleteAllAlerts(userId: string) {
    return await db
      .delete(alertsTable)
      .where(eq(alertsTable.userId, userId))
      .returning();
  }

  // Check CPU and RAM usage and create alerts.
  public async checkNodeUsageAndCreateAlerts(payload: {
    userId: string;
    nodeId: string;
    cpuUsagePercent: number;
    memoryUsagePercent: number;
  }) {
    const {
      userId,
      nodeId,
      cpuUsagePercent,
      memoryUsagePercent,
    } = payload;

    // Verify node ownership.
    const node = await db
      .select({
        id: fleetNodesTable.id,
      })
      .from(fleetNodesTable)
      .where(
        and(
          eq(fleetNodesTable.id, nodeId),
          eq(fleetNodesTable.userId, userId),
        ),
      );

    if (!node.length) {
      throw new Error(
        "Node not found or does not belong to this user",
      );
    }

    const alertsToCreate: {
      message: string;
      category: "WARNING";
      userId: string;
      nodeId: string;
    }[] = [];

    // Check CPU usage.
    if (cpuUsagePercent > USAGE_THRESHOLD) {
      const message = "CPU usage is above 90%";

      const shouldCreate =
        await this.shouldCreateUsageAlert(
          userId,
          nodeId,
          message,
        );

      if (shouldCreate) {
        alertsToCreate.push({
          message: `${message}: ${cpuUsagePercent.toFixed(2)}%`,
          category: "WARNING",
          userId,
          nodeId,
        });
      }
    }

    // Check RAM usage.
    if (memoryUsagePercent > USAGE_THRESHOLD) {
      const message = "RAM usage is above 90%";

      const shouldCreate =
        await this.shouldCreateUsageAlert(
          userId,
          nodeId,
          message,
        );

      if (shouldCreate) {
        alertsToCreate.push({
          message: `${message}: ${memoryUsagePercent.toFixed(2)}%`,
          category: "WARNING",
          userId,
          nodeId,
        });
      }
    }

    if (alertsToCreate.length === 0) {
      return [];
    }

    return await db
      .insert(alertsTable)
      .values(alertsToCreate)
      .returning();
  }

  // Check whether an alert can be created after cooldown.
 
private async shouldCreateUsageAlert(
  userId: string,
  nodeId: string,
  message: string,
): Promise<boolean> {
  const cooldownStart = new Date(
    Date.now() - ALERT_COOLDOWN_MS,
  );

  const recentAlert = await db
    .select({
      id: alertsTable.id,
    })
    .from(alertsTable)
    .where(
      and(
        eq(alertsTable.userId, userId),
        eq(alertsTable.nodeId, nodeId),
        gte(
          alertsTable.createdAt,
          cooldownStart,
        ),
      ),
    )
    .orderBy(desc(alertsTable.createdAt))
    .limit(1);

  // Check whether a recent alert exists for this metric.
  const metricPrefix = message.startsWith("CPU")
    ? "CPU"
    : "RAM";

  const hasRecentMetricAlert = recentAlert.some(
    (alert) => alert.id,
  );

  return !hasRecentMetricAlert;
}

  public async sendingAlertMessageToUser(email: string, message: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (!user) {
      throw new Error("User not found");
    }

    const [node] = await db
      .select({
        id: fleetNodesTable.id,
      })
      .from(fleetNodesTable)
      .where(eq(fleetNodesTable.userId, user.id))
      .limit(1);

    if (!node) {
      throw new Error("User has no fleet nodes");
    }

    const [alert] = await db
      .insert(alertsTable)
      .values({
        message,
        category: "CRITICAL",
        userId: user.id,
        nodeId: node.id,
        isRead: true,
      })
      .returning();

    return alert;
  }
}

// Named export used by route.ts.

export default AlertService;
