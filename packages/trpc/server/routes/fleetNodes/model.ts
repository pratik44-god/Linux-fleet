import { z } from "zod";

export const fleetNodeReportInputModel = z.object({
  node_id: z.string().min(1).max(255),
  hostname: z.string().min(1).max(255),
  os: z.string().min(1).max(255),
  kernel: z.string().min(1).max(255),
  architecture: z.string().min(1).max(50),

  cpu_cores: z.number().int().positive(),
  cpu_usage_percent: z.number().min(0).max(100),

  memory_total_mb: z.number().int().nonnegative(),
  memory_used_mb: z.number().int().nonnegative(),

  disk_total_mb: z.number().int().nonnegative(),
  disk_used_mb: z.number().int().nonnegative(),

  battery: z.string().max(100).nullable().optional(),

  reported_at: z.coerce.date().optional(),
});

export const getNodeByNodeIdInputModel = z.object({
  nodeId: z.string().min(1).max(255),
});

export const deleteNodeByNodeIdInputModel = z.object({
  nodeId: z.string().min(1).max(255),
});

export const fleetNodeOutputModel = z.object({
  id: z.string().uuid(),

  nodeId: z.string(),
  hostname: z.string(),
  os: z.string(),
  kernel: z.string(),
  architecture: z.string(),

  cpuCores: z.number(),
  cpuUsagePercent: z.number(),

  memoryTotalMB: z.number(),
  memoryUsedMB: z.number(),

  diskTotalMB: z.number(),
  diskUsedMB: z.number(),

  battery: z.string().nullable(),

  reportedAt: z.date().nullable(),
});

export const getNodeByNodeIdOutputModel =
  fleetNodeOutputModel.nullable();

export const getAllNodesOutputModel = z.array(
  fleetNodeOutputModel
);

export const deleteNodeOutputModel = z.object({
  success: z.boolean(),
});

export type FleetNodeReportInputModelType = z.infer<
  typeof fleetNodeReportInputModel
>;

export type FleetNodeOutputModelType = z.infer<
  typeof fleetNodeOutputModel
>;

export const fleetNodeReportOutputModel = z.object({
  id: z.string().uuid(),
  nodeId: z.string(),
  nodeCredential: z.string().nullable(),
});

export type FleetNodeReportOutputModelType = z.infer<typeof fleetNodeReportOutputModel>;



export const getAllNodesForAdminOutputModel = z.object({
  id: z.string().uuid(),
  nodeId: z.string(),
  hostname: z.string(),
  os: z.string(),
  kernel: z.string(),
  architecture: z.string(),
  cpuCores: z.number(),
  cpuUsagePercent: z.number(),
  memoryTotalMB: z.number(),
  memoryUsedMB: z.number(),
  diskTotalMB: z.number(),
  diskUsedMB: z.number(),
  battery: z.string().nullable(),
  reportedAt: z.date().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),

  owner: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.email(),
  }),
});