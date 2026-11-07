import { db, eq, and } from "@repo/database";
import {
  fleetNodesTable,
  usersTable,
} from "@repo/database/schema";
import { randomBytes, createHash } from "node:crypto";

import {
  fleetNodeReportInput,
  FleetNodeReportInputType,
} from "./model";

class FleetNodeService {
  // Register a node or update its latest metrics.
  public async registerOrUpdateNode(
    userId: string,
    payload: FleetNodeReportInputType,
    issueCredential = false
  ) {
    const report = await fleetNodeReportInput.parseAsync(payload);

    const reportedAt = report.reported_at ?? new Date();

    const metricsData = {
      hostname: report.hostname,
      os: report.os,
      kernel: report.kernel,
      architecture: report.architecture,
      cpuCores: report.cpu_cores,
      cpuUsagePercent: report.cpu_usage_percent,
      memoryTotalMB: report.memory_total_mb,
      memoryUsedMB: report.memory_used_mb,
      diskTotalMB: report.disk_total_mb,
      diskUsedMB: report.disk_used_mb,
      battery: report.battery ?? null,
      reportedAt,
      updatedAt: new Date(),
    };

    // Registration: generate and save a new credential.
    if (issueCredential) {
      const nodeCredential = randomBytes(32).toString("hex");

      const nodeCredentialHash = createHash("sha256")
        .update(nodeCredential)
        .digest("hex");

      const result = await db
        .insert(fleetNodesTable)
        .values({
          userId,
          nodeId: report.node_id,
          ...metricsData,
          nodeCredentialHash,
        })
        .onConflictDoUpdate({
          target: [
            fleetNodesTable.userId,
            fleetNodesTable.nodeId,
          ],
          set: {
            ...metricsData,
            nodeCredentialHash,
          },
        })
        .returning({
          id: fleetNodesTable.id,
          nodeId: fleetNodesTable.nodeId,
        });

      if (result.length === 0) {
        throw new Error("Failed to register fleet node");
      }

      return {
        ...result[0]!,
        nodeCredential,
      };
    }

    // Continuous reporting: update metrics without changing credentials.
    const result = await db
      .update(fleetNodesTable)
      .set(metricsData)
      .where(
        and(
          eq(fleetNodesTable.userId, userId),
          eq(fleetNodesTable.nodeId, report.node_id)
        )
      )
      .returning({
        id: fleetNodesTable.id,
        nodeId: fleetNodesTable.nodeId,
      });

    if (result.length === 0) {
      throw new Error("Fleet node not found for this user");
    }

    return {
      ...result[0]!,
      nodeCredential: null,
    };
  }

  // Authenticate a node using its original credential.
  public async authenticateNodeCredential(nodeCredential: string) {
    if (!nodeCredential || !nodeCredential.trim()) {
      return null;
    }

    const nodeCredentialHash = createHash("sha256")
      .update(nodeCredential)
      .digest("hex");

    const nodes = await db
      .select()
      .from(fleetNodesTable)
      .where(
        eq(fleetNodesTable.nodeCredentialHash, nodeCredentialHash)
      )
      .limit(1);

    return nodes[0] ?? null;
  }

  // USER: Get one node belonging to the authenticated user.
  public async getNodeByNodeId(
    userId: string,
    nodeId: string
  ) {
    const nodes = await db
      .select()
      .from(fleetNodesTable)
      .where(
        and(
          eq(fleetNodesTable.userId, userId),
          eq(fleetNodesTable.nodeId, nodeId)
        )
      );

    return nodes[0] ?? null;
  }

  // USER: Get all nodes belonging to the authenticated user.
  public async getAllNodesByUserId(userId: string) {
    return await db
      .select()
      .from(fleetNodesTable)
      .where(eq(fleetNodesTable.userId, userId));
  }

  // ADMIN: Get all registered nodes with their owner's details.
  public async getAllNodesForAdmin() {
    return await db
      .select({
        id: fleetNodesTable.id,
        nodeId: fleetNodesTable.nodeId,
        hostname: fleetNodesTable.hostname,
        os: fleetNodesTable.os,
        kernel: fleetNodesTable.kernel,
        architecture: fleetNodesTable.architecture,
        cpuCores: fleetNodesTable.cpuCores,
        cpuUsagePercent: fleetNodesTable.cpuUsagePercent,
        memoryTotalMB: fleetNodesTable.memoryTotalMB,
        memoryUsedMB: fleetNodesTable.memoryUsedMB,
        diskTotalMB: fleetNodesTable.diskTotalMB,
        diskUsedMB: fleetNodesTable.diskUsedMB,
        battery: fleetNodesTable.battery,
        reportedAt: fleetNodesTable.reportedAt,
        createdAt: fleetNodesTable.createdAt,
        updatedAt: fleetNodesTable.updatedAt,

        owner: {
          id: usersTable.id,
          fullName: usersTable.fullName,
          email: usersTable.email,
        },
      })
      .from(fleetNodesTable)
      .innerJoin(
        usersTable,
        eq(fleetNodesTable.userId, usersTable.id)
      );
  }

  // Delete a specific node only if it belongs to this user.
  public async deleteNodeByNodeId(
    userId: string,
    nodeId: string
  ) {
    const deletedNodes = await db
      .delete(fleetNodesTable)
      .where(
        and(
          eq(fleetNodesTable.userId, userId),
          eq(fleetNodesTable.nodeId, nodeId)
        )
      )
      .returning({
        id: fleetNodesTable.id,
      });

    return {
      success: deletedNodes.length > 0,
    };
  }
}

export default FleetNodeService;
