import { z } from "zod";

export const fleetNodeReportInput = z.object({
  node_id: z.string().min(1).max(255).describe("Unique ID of the fleet node"),

  hostname: z.string().min(1).max(255).describe("Node hostname"),

  os: z.string().min(1).max(255).describe("Operating system"),

  kernel: z.string().min(1).max(255).describe("Kernel version"),

  architecture: z.string().min(1).max(50).describe("CPU architecture"),

  cpu_cores: z.number().int().positive().describe("Number of CPU cores"),

  cpu_usage_percent: z.number().min(0).max(100).describe("CPU usage percentage"),

  memory_total_mb: z.number().int().nonnegative().describe("Total RAM in MB"),

  memory_used_mb: z.number().int().nonnegative().describe("Used RAM in MB"),

  disk_total_mb: z.number().int().nonnegative().describe("Total disk space in MB"),

  disk_used_mb: z.number().int().nonnegative().describe("Used disk space in MB"),

  battery: z.string().max(100).nullable().optional().describe(
    "Battery status and capacity, or null if unavailable"
  ),

  reported_at: z.coerce.date().optional().describe(
    "Timestamp when the node reported its metrics"
  ),
});

export type FleetNodeReportInputType = z.infer<
  typeof fleetNodeReportInput
>;
