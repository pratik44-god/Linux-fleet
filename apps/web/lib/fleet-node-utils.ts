export type FleetNode = {
  nodeId?: string;
  node_id?: string;
  hostname?: string;
  os?: string;
  kernel?: string;
  architecture?: string;
  cpuCores?: number;
  cpu_cores?: number;
  cpuUsagePercent?: number;
  cpu_usage_percent?: number;
  memoryTotalMb?: number;
  memory_total_mb?: number;
  memoryUsedMb?: number;
  memory_used_mb?: number;
  diskTotalMb?: number;
  disk_total_mb?: number;
  diskUsedMb?: number;
  disk_used_mb?: number;
  battery?: number | string | null | {
    percentage?: number;
    percent?: number;
    level?: number;
    state?: string;
    status?: string;
  };
  reportedAt?: string | Date | null;
  reported_at?: string | Date | null;
};

export function getNodeId(node: FleetNode): string {
  return node.nodeId ?? node.node_id ?? "";
}

export function getCpuUsage(node: FleetNode): number | null {
  const value = node.cpuUsagePercent ?? node.cpu_usage_percent;
  return typeof value === "number" ? value : null;
}

export function getMemoryUsage(node: FleetNode): number | null {
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

export function getDiskUsage(node: FleetNode): number | null {
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

export function getBatteryPercentage(node: FleetNode): number | null {
  const battery = node.battery;

  if (typeof battery === "number") {
    return battery;
  }

  if (typeof battery === "string") {
    const parsed = Number(battery);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (battery && typeof battery === "object") {
    const value =
      battery.percentage ?? battery.percent ?? battery.level;

    return typeof value === "number" ? value : null;
  }

  return null;
}

export function getLastReportedAt(node: FleetNode): Date | null {
  const value = node.reportedAt ?? node.reported_at;

  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function getNodeStatus(
  node: FleetNode,
): "online" | "offline" | "unknown" {
  const lastReported = getLastReportedAt(node);

  if (!lastReported) {
    return "unknown";
  }

  // Agents report every 15 seconds. Allow some network delay.
  const ageInSeconds = (Date.now() - lastReported.getTime()) / 1000;

  return ageInSeconds <= 45 ? "online" : "offline";
}

export function formatMegabytes(value?: number): string {
  if (typeof value !== "number") {
    return "—";
  }

  return `${(value / 1024).toFixed(1)} GB`;
}

export function formatLastReport(node: FleetNode): string {
  const date = getLastReportedAt(node);

  if (!date) {
    return "No report";
  }

  return date.toLocaleString();
}