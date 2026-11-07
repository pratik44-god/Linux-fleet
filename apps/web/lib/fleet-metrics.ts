
export type FleetNodeMetrics = {
  nodeId: string;
  hostname: string;
  cpuUsage: number | null;
  memoryUsage: number | null;
  diskUsage: number | null;
  batteryPercentage: number | null;
  status: "online" | "offline" | "unknown";
  lastReportedAt: Date | null;
};

// Convert memory from MB to GB.
export function formatMegabytes(value?: number): string {
  if (typeof value !== "number") {
    return "—";
  }

  return `${(value / 1024).toFixed(1)} GB`;
}

// Get CPU usage.
export function getCpuUsage(node: any): number | null {
  const value =
    node.cpuUsagePercent ??
    node.cpu_usage_percent;

  return typeof value === "number" ? value : null;
}

// Get memory usage percentage.
export function getMemoryUsage(node: any): number | null {
  const used = node.memoryUsedMb ?? node.memory_used_mb;
  const total = node.memoryTotalMb ?? node.memory_total_mb;

  if (
    typeof used !== "number" ||
    typeof total !== "number" ||
    total <= 0
  ) {
    return null;
  }

  return Math.round((used / total) * 100);
}

// Get disk usage percentage.
export function getDiskUsage(node: any): number | null {
  const used = node.diskUsedMb ?? node.disk_used_mb;
  const total = node.diskTotalMb ?? node.disk_total_mb;

  if (
    typeof used !== "number" ||
    typeof total !== "number" ||
    total <= 0
  ) {
    return null;
  }

  return Math.round((used / total) * 100);
}

// Get node's last reported timestamp.
export function getLastReportedAt(node: any): Date | null {
  const value = node.reportedAt ?? node.reported_at;

  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

// Determine node status.
export function getNodeStatus(
  node: any
): "online" | "offline" | "unknown" {
  const lastReported = getLastReportedAt(node);

  if (!lastReported) return "unknown";

  const ageInSeconds =
    (Date.now() - lastReported.getTime()) / 1000;

  return ageInSeconds <= 45 && ageInSeconds >= 0
    ? "online"
    : "offline";
}

// Prepare fleet metrics.
export function getFleetNodeMetrics(node: any): FleetNodeMetrics {
  return {
    nodeId: node.nodeId ?? node.node_id ?? "",
    hostname: node.hostname ?? "Unknown",
    cpuUsage: getCpuUsage(node),
    memoryUsage: getMemoryUsage(node),
    diskUsage: getDiskUsage(node),
    batteryPercentage:
      typeof node.battery === "number"
        ? node.battery
        : typeof node.battery === "object" && node.battery !== null
          ? node.battery.percentage ??
            node.battery.percent ??
            node.battery.level ??
            null
          : null,
    status: getNodeStatus(node),
    lastReportedAt: getLastReportedAt(node),
  };
}
