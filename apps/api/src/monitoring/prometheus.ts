import {
  Registry,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

// Dedicated registry for Linux Fleet monitoring.
export const prometheusRegistry = new Registry();

// Collect API process metrics too.
collectDefaultMetrics({
  register: prometheusRegistry,
  prefix: "linux_fleet_api_",
});

// Every fleet metric is identified by its owner and node.
const labels = ["user_id", "node_id"] as const;

// CPU usage
export const cpuUsageGauge = new Gauge({
  name: "fleet_node_cpu_usage_percent",
  help: "CPU usage percentage of a fleet node",
  labelNames: labels,
  registers: [prometheusRegistry],
});

// CPU cores
export const cpuCoresGauge = new Gauge({
  name: "fleet_node_cpu_cores",
  help: "Number of CPU cores on a fleet node",
  labelNames: labels,
  registers: [prometheusRegistry],
});

// Memory
export const memoryUsedGauge = new Gauge({
  name: "fleet_node_memory_used_mb",
  help: "Used memory in MB",
  labelNames: labels,
  registers: [prometheusRegistry],
});

export const memoryTotalGauge = new Gauge({
  name: "fleet_node_memory_total_mb",
  help: "Total memory in MB",
  labelNames: labels,
  registers: [prometheusRegistry],
});

export const memoryUsageGauge = new Gauge({
  name: "fleet_node_memory_usage_percent",
  help: "Memory usage percentage",
  labelNames: labels,
  registers: [prometheusRegistry],
});

// Disk
export const diskUsedGauge = new Gauge({
  name: "fleet_node_disk_used_mb",
  help: "Used disk space in MB",
  labelNames: labels,
  registers: [prometheusRegistry],
});

export const diskTotalGauge = new Gauge({
  name: "fleet_node_disk_total_mb",
  help: "Total disk space in MB",
  labelNames: labels,
  registers: [prometheusRegistry],
});

export const diskUsageGauge = new Gauge({
  name: "fleet_node_disk_usage_percent",
  help: "Disk usage percentage",
  labelNames: labels,
  registers: [prometheusRegistry],
});

// Battery
export const batteryGauge = new Gauge({
  name: "fleet_node_battery_percent",
  help: "Battery percentage of a fleet node",
  labelNames: labels,
  registers: [prometheusRegistry],
});

// Last successful report received by the API.
export const lastReportGauge = new Gauge({
  name: "fleet_node_last_report_timestamp_seconds",
  help: "Unix timestamp of the last successfully received node report",
  labelNames: labels,
  registers: [prometheusRegistry],
});

// Node information
export const nodeInfoGauge = new Gauge({
  name: "fleet_node_info",
  help: "Information about a registered fleet node",
  labelNames: [
    "user_id",
    "node_id",
    "hostname",
    "os",
    "architecture",
  ],
  registers: [prometheusRegistry],
});

interface FleetMetricInput {
  node_id: string;
  hostname: string;
  os: string;
  architecture: string;
  cpu_cores: number;
  cpu_usage_percent: number;
  memory_total_mb: number;
  memory_used_mb: number;
  disk_total_mb: number;
  disk_used_mb: number;
  battery?: string | number | null;
  reported_at?: string | Date;
}

// Update Prometheus metrics after a successful database update.
export function updateFleetNodeMetrics(
  userId: string,
  report: FleetMetricInput,
) {
  const nodeId = report.node_id;

  if (!userId || !nodeId) {
    throw new Error("userId and node_id are required for fleet metrics");
  }

  const metricLabels = [userId, nodeId] as const;

  cpuUsageGauge
    .labels(...metricLabels)
    .set(report.cpu_usage_percent);

  cpuCoresGauge
    .labels(...metricLabels)
    .set(report.cpu_cores);

  memoryUsedGauge
    .labels(...metricLabels)
    .set(report.memory_used_mb);

  memoryTotalGauge
    .labels(...metricLabels)
    .set(report.memory_total_mb);

  const memoryPercent =
    report.memory_total_mb > 0
      ? (report.memory_used_mb / report.memory_total_mb) * 100
      : 0;

  memoryUsageGauge
    .labels(...metricLabels)
    .set(memoryPercent);

  diskUsedGauge
    .labels(...metricLabels)
    .set(report.disk_used_mb);

  diskTotalGauge
    .labels(...metricLabels)
    .set(report.disk_total_mb);

  const diskPercent =
    report.disk_total_mb > 0
      ? (report.disk_used_mb / report.disk_total_mb) * 100
      : 0;

  diskUsageGauge
    .labels(...metricLabels)
    .set(diskPercent);

  // Battery may be null for virtual machines.
  const batteryValue =
    typeof report.battery === "number"
      ? report.battery
      : typeof report.battery === "string"
        ? Number(
            report.battery.match(/-?\d+(?:\.\d+)?/)?.[0],
          )
        : NaN;

  if (
    Number.isFinite(batteryValue) &&
    batteryValue >= 0 &&
    batteryValue <= 100
  ) {
    batteryGauge
      .labels(...metricLabels)
      .set(batteryValue);
  } else {
    batteryGauge.remove(...metricLabels);
  }

  // Use API receive time to avoid relying on the node's clock.
  lastReportGauge
    .labels(...metricLabels)
    .set(Date.now() / 1000);

  nodeInfoGauge
    .labels(
      userId,
      nodeId,
      report.hostname,
      report.os,
      report.architecture,
    )
    .set(1);
}