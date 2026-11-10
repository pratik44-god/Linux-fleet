"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Battery,
  ChevronDown,
  ChevronUp,
  Clock3,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useGetAllNodes } from "~/hooks/api/fleetNodes";
import { useUser } from "~/hooks/api/auth";

import NodeOnboarding from "~/components/dashboard/NodeOnboarding";
import AdminOverview from "~/components/dashboard/AdminOverview";
import GrafanaEmbed from "~/components/dashboard/Admin/GrafanaEmbed";

type FleetNode = Record<string, any>;

const ONLINE_THRESHOLD = 45_000;

/* GRAFANA CONFIGURATION */

const GRAFANA_URL =
  process.env.NEXT_PUBLIC_GRAFANA_URL ?? "https://linuxfleet-grafana.thankfultree-46fa2ae1.uaenorth.azurecontainerapps.io";

const GRAFANA_DASHBOARD_UID =
  process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_UID ??
  "linux-fleet-node";

/**
 * Builds the Grafana dashboard URL.
 *
 * No nodeId:
 *   Displays the complete fleet dashboard.
 *
 * With nodeId:
 *   Displays the dashboard filtered for a specific node.
 */
function buildGrafanaUrl(nodeId?: string) {
  const params = new URLSearchParams({
    orgId: "1",
    kiosk: "tv",
    from: "now-1h",
    to: "now",
    refresh: "15s",
  });

  if (nodeId) {
    params.set("var-nodeId", nodeId);
  }

  return (
    `${GRAFANA_URL}/d/${GRAFANA_DASHBOARD_UID}` +
    `?${params.toString()}`
  );
}

/* GENERAL HELPERS */

function getValue(
  node: FleetNode,
  keys: string[],
  fallback: any = null
) {
  for (const key of keys) {
    const value = node?.[key];

    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return fallback;
}

function readNumber(
  node: FleetNode,
  keys: string[],
  fallback = 0
): number {
  const value = getValue(node, keys);

  if (value === null) {
    return fallback;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function getNodeId(node: FleetNode, index: number) {
  return String(
    getValue(node, ["nodeId", "node_id", "id"], `node-${index}`)
  );
}

function getNodeName(node: FleetNode) {
  return getValue(
    node,
    [
      "hostname",
      "nodeName",
      "node_name",
      "nodeId",
      "node_id",
    ],
    "Unnamed node"
  );
}

function getOperatingSystem(node: FleetNode) {
  return getValue(
    node,
    ["os", "operatingSystem", "operating_system"],
    "Linux"
  );
}

function getArchitecture(node: FleetNode) {
  return getValue(
    node,
    ["architecture", "arch"],
    "Unknown architecture"
  );
}

function getKernel(node: FleetNode) {
  return getValue(
    node,
    ["kernel", "kernelVersion", "kernel_version"],
    "Not available"
  );
}

function getReportedTimestamp(node: FleetNode) {
  return getValue(node, [
    "reportedAt",
    "reported_at",
    "lastReportedAt",
    "last_reported_at",
  ]);
}

function getTimestampMilliseconds(
  timestamp: any
): number | null {
  if (!timestamp) {
    return null;
  }

  let milliseconds: number;

  if (typeof timestamp === "number") {
    milliseconds =
      timestamp < 1_000_000_000_000
        ? timestamp * 1000
        : timestamp;
  } else {
    milliseconds = new Date(timestamp).getTime();
  }

  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function isNodeOnline(node: FleetNode, now: number) {
  const timestamp = getTimestampMilliseconds(
    getReportedTimestamp(node)
  );

  if (timestamp !== null) {
    return now - timestamp <= ONLINE_THRESHOLD;
  }

  if (typeof node.isOnline === "boolean") {
    return node.isOnline;
  }

  if (typeof node.is_online === "boolean") {
    return node.is_online;
  }

  return String(node.status || "").toLowerCase() === "online";
}

/* STORAGE FORMATTING */

function formatStorage(value: number) {
  if (value <= 0) {
    return "—";
  }

  if (value >= 1024) {
    return `${(value / 1024).toFixed(2)} GB`;
  }

  return `${value.toFixed(0)} MB`;
}

function getPercentage(used: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(Math.max((used / total) * 100, 0), 100);
}

function formatLastSeen(timestamp: any, now: number) {
  const milliseconds = getTimestampMilliseconds(timestamp);

  if (milliseconds === null) {
    return "No report received";
  }

  const difference = Math.max(0, now - milliseconds);

  if (difference < 5_000) {
    return "Just now";
  }

  if (difference < 60_000) {
    return `${Math.floor(difference / 1000)} seconds ago`;
  }

  if (difference < 3_600_000) {
    return `${Math.floor(difference / 60_000)} minutes ago`;
  }

  return new Date(milliseconds).toLocaleString();
}

/* BATTERY INFORMATION */

function getBatteryPercentage(node: FleetNode): number | null {
  const battery = getValue(
    node,
    ["battery", "batteryStatus", "battery_status"],
    null
  );

  let rawValue: unknown = null;

  if (typeof battery === "number" || typeof battery === "string") {
    rawValue = battery;
  } else if (battery && typeof battery === "object") {
    rawValue =
      battery.percentage ??
      battery.percent ??
      battery.batteryPercentage ??
      battery.battery_percentage;
  }

  if (
    rawValue === null ||
    rawValue === undefined ||
    rawValue === ""
  ) {
    rawValue = getValue(
      node,
      ["batteryPercentage", "battery_percentage"],
      null
    );
  }

  if (
    rawValue === null ||
    rawValue === undefined ||
    rawValue === ""
  ) {
    return null;
  }

  const percentage = Number(rawValue);

  if (!Number.isFinite(percentage)) {
    return null;
  }

  return Math.min(100, Math.max(0, percentage));
}

function getBatteryInformation(node: FleetNode) {
  const percentage = getBatteryPercentage(node);

  if (percentage === null) {
    return "Not available";
  }

  const battery = getValue(
    node,
    ["battery", "batteryStatus", "battery_status"],
    null
  );

  let state: string | null = null;

  if (battery && typeof battery === "object") {
    state = battery.status ?? battery.state ?? null;
  }

  return `${percentage.toFixed(0)}%${state ? ` · ${state}` : ""}`;
}

/* METRIC CARD */

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: any) {
  const isRed = tone === "red";

  return (
    <article
      className={`overview-metric ${isRed
          ? "!border-red-200 !bg-red-50"
          : "!border-green-200 !bg-green-50"
        }`}
    >
      <div className="metric-top">
        <span>{title}</span>

        <span
          className={`metric-icon-small ${isRed
              ? "!bg-red-100 !text-red-600"
              : "!bg-green-100 !text-green-600"
            }`}
        >
          <Icon size={17} />
        </span>
      </div>

      <strong
        className={
          isRed
            ? "!text-red-600"
            : "!text-green-600"
        }
      >
        {value}
      </strong>

      <small>{detail}</small>
    </article>
  );
}
/* RESOURCE METRIC */

function ResourceMetric({
  title,
  icon: Icon,
  total,
  percentage,
  displayUsed,
  displayTotal,
}: any) {
  const safePercentage = Math.min(
    Math.max(percentage, 0),
    100
  );

  return (

    <div className="fleet-resource-card">
      <div className="fleet-resource-heading">

        <span>
          <Icon size={15} />
          {title}
        </span>

        <strong>
          {total > 0 ? `${percentage.toFixed(1)}%` : "—"}
        </strong>
      </div>

      <div className="fleet-resource-progress">
        <div style={{ width: `${safePercentage}%` }} />
      </div>

      <div className="fleet-resource-values">
        <span>{displayUsed}</span>
        <span>{displayTotal}</span>
      </div>
    </div>
  );
}

/* GRAFANA FLEET DASHBOARD */

function GrafanaDashboard() {
  const grafanaDashboardUrl = useMemo(
    () => buildGrafanaUrl(),
    []
  );

  return (
    <section className="content-panel fleet-grafana-panel">
      <div className="panel-title-row">
        <div>
          <h2>Fleet monitoring</h2>
          <p>
            Historical CPU, memory, battery, and node availability
            metrics powered by Grafana and Prometheus.
          </p>
        </div>

        <span className="live-indicator">
          <i /> LIVE
        </span>
      </div>

      <div className="h-[480px] min-h-0  overflow-hidden rounded-xl sm:h-[520px] lg:h-[560px]">
        <GrafanaEmbed
          src={grafanaDashboardUrl}
          title="Grafana Fleet Monitoring Dashboard"
        />
      </div>
    </section>
  );
}

/* NODE CARD */

function NodeCard({
  node,
  index,
  now,
}: {
  node: FleetNode;
  index: number;
  now: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const name = getNodeName(node);
  const nodeId = getNodeId(node, index);
  const online = isNodeOnline(node, now);

  const os = getOperatingSystem(node);
  const architecture = getArchitecture(node);
  const kernel = getKernel(node);

  const cpu = readNumber(node, [
    "cpuUsagePercent",
    "cpu_usage_percent",
  ]);

  const cpuCores = readNumber(node, ["cpuCores", "cpu_cores"]);

  const memoryUsed = readNumber(node, [
    "memoryUsedMB",
    "memoryUsedMb",
    "memory_used_mb",
  ]);

  const memoryTotal = readNumber(node, [
    "memoryTotalMB",
    "memoryTotalMb",
    "memory_total_mb",
  ]);

  const diskUsed = readNumber(node, [
    "diskUsedMB",
    "diskUsedMb",
    "disk_used_mb",
  ]);

  const diskTotal = readNumber(node, [
    "diskTotalMB",
    "diskTotalMb",
    "disk_total_mb",
  ]);

  const memoryPercentage = getPercentage(memoryUsed, memoryTotal);
  const diskPercentage = getPercentage(diskUsed, diskTotal);

  const battery = getBatteryInformation(node);
  const reportedAt = getReportedTimestamp(node);

  return (
    <article className="fleet-node-card">
      <div className="fleet-node-main">
        <div className="fleet-node-identity">
          <div className="fleet-node-avatar">
            <Monitor size={22} />
          </div>

          <div className="fleet-node-name">
            <h3>{name}</h3>

            <p>
              {os} <span>·</span> {architecture}
            </p>

            <span className="fleet-node-id">
              ID: {nodeId}
            </span>
          </div>
        </div>

        <div
          className={`fleet-node-status ${online ? "online" : "offline"
            }`}
        >
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          {online ? "Online" : "Offline"}
        </div>

        <button
          type="button"
          className="fleet-node-expand"
          onClick={() => setExpanded((previous) => !previous)}
          aria-expanded={expanded}
        >
          {expanded ? "Hide details" : "View details"}

          {expanded ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      </div>

      <div className="fleet-node-resources">
        <ResourceMetric
          title="CPU"
          icon={Cpu}
          total={100}
          percentage={cpu}
          displayUsed={`${cpu.toFixed(1)}%`}
          displayTotal={cpuCores > 0 ? `${cpuCores} cores` : "—"}
        />

        <ResourceMetric
          title="Memory"
          icon={MemoryStick}
          total={memoryTotal}
          percentage={memoryPercentage}
          displayUsed={formatStorage(memoryUsed)}
          displayTotal={formatStorage(memoryTotal)}
        />

        <ResourceMetric
          title="Disk"
          icon={HardDrive}
          total={diskTotal}
          percentage={diskPercentage}
          displayUsed={formatStorage(diskUsed)}
          displayTotal={formatStorage(diskTotal)}
        />
      </div>

      {expanded && (
        <div className="fleet-node-details">
          <div className="fleet-detail-item">
            <span>
              <Monitor size={15} /> Hostname
            </span>
            <strong>{name}</strong>
          </div>

          <div className="fleet-detail-item">
            <span>
              <Server size={15} /> Operating system
            </span>
            <strong>{os}</strong>
          </div>

          <div className="fleet-detail-item">
            <span>
              <Terminal size={15} /> Kernel
            </span>
            <strong>{kernel}</strong>
          </div>

          <div className="fleet-detail-item">
            <span>
              <Cpu size={15} /> CPU cores
            </span>
            <strong>{cpuCores || "Not available"}</strong>
          </div>

          <div className="fleet-detail-item">
            <span>
              <Battery size={15} /> Battery
            </span>
            <strong>{battery}</strong>
          </div>

          <div className="fleet-detail-item">
            <span>
              <Clock3 size={15} /> Last report
            </span>
            <strong>{formatLastSeen(reportedAt, now)}</strong>
          </div>

          <div className="fleet-detail-item">
            <span>
              <MemoryStick size={15} /> RAM
            </span>
            <strong>
              {formatStorage(memoryUsed)} / {formatStorage(memoryTotal)}
            </strong>
          </div>

          <div className="fleet-detail-item">
            <span>
              <HardDrive size={15} /> Storage
            </span>
            <strong>
              {formatStorage(diskUsed)} / {formatStorage(diskTotal)}
            </strong>
          </div>

          <div className="fleet-detail-item">
            <span>
              <Activity size={15} /> CPU usage
            </span>
            <strong>{cpu.toFixed(2)}%</strong>
          </div>
        </div>
      )}

      <div className="fleet-node-footer">
        <span>
          <span
            className={`fleet-status-dot ${online ? "online" : "offline"
              }`}
          />

          {online
            ? "Reporting normally"
            : "Waiting for agent report"}
        </span>

        <span>
          Last seen: {formatLastSeen(reportedAt, now)}
        </span>
      </div>
    </article>
  );
}

/* NORMAL USER DASHBOARD */

function UserOverview() {
  const {
    nodes: rawNodes,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllNodes();

  const { user } = useUser();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 5_000);

    return () => clearInterval(interval);
  }, []);

  const nodes = useMemo(() => {
    if (Array.isArray(rawNodes)) {
      return rawNodes;
    }

    if (Array.isArray((rawNodes as any)?.nodes)) {
      return (rawNodes as any).nodes;
    }

    return [];
  }, [rawNodes]);

  const onlineNodes = nodes.filter((node: FleetNode) =>
    isNodeOnline(node, now)
  );

  const offlineNodes = nodes.length - onlineNodes.length;

  const averageCpu = nodes.length
    ? nodes.reduce(
      (sum: number, node: FleetNode) =>
        sum +
        readNumber(node, [
          "cpuUsagePercent",
          "cpu_usage_percent",
        ]),
      0
    ) / nodes.length
    : 0;

  const averageMemory = nodes.length
    ? nodes.reduce((sum: number, node: FleetNode) => {
      const used = readNumber(node, [
        "memoryUsedMB",
        "memoryUsedMb",
        "memory_used_mb",
      ]);

      const total = readNumber(node, [
        "memoryTotalMB",
        "memoryTotalMb",
        "memory_total_mb",
      ]);

      return sum + getPercentage(used, total);
    }, 0) / nodes.length
    : 0;

  const batteryNodes = nodes.filter(
    (node: FleetNode) => getBatteryPercentage(node) !== null
  );

  const averageBattery = batteryNodes.length
    ? batteryNodes.reduce(
      (sum: number, node: FleetNode) =>
        sum + (getBatteryPercentage(node) ?? 0),
      0
    ) / batteryNodes.length
    : null;

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      await refetch();
      setNow(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-loading">
        <span className="loader-ring" />
        <p>Loading your fleet...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">WORKSPACE OVERVIEW</div>

          <h1>Good to see you.</h1>

          <p>
            Here's what's happening across your Linux infrastructure.
          </p>
        </div>

        <button
          className="button button-secondary refresh-button"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            size={15}
            className={isRefreshing ? "fleet-spin" : ""}
          />

          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {isError && (
        <div className="inline-error">
          <WifiOff size={17} />

          <span>
            We couldn't load your nodes.{" "}
            {error?.message ||
              "Check the API connection and try again."}
          </span>
        </div>
      )}

      {nodes.length === 0 ? (
        <section className="empty-fleet-card">
          <div className="empty-orbit">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />

            <div className="empty-device">
              <Monitor size={34} />
              <span>+</span>
            </div>
          </div>

          <div className="eyebrow">
            YOUR WORKSPACE IS READY
          </div>

          <h2>Start with your first Linux node.</h2>

          <p>
            Your fleet is empty for now. Generate a registration
            token and install the agent on a Linux machine. Once it
            sends its first report, your machine will show up here.
          </p>

          <button
            className="button button-primary button-large"
            onClick={() => setShowOnboarding(true)}
          >
            <Plus size={17} />
            Add your first node
          </button>

          <div className="empty-trust">
            <span>
              <ShieldCheck size={14} />
              Token-based registration
            </span>

            <span>
              <Activity size={14} />
              Live reports every 15s
            </span>
          </div>
        </section>
      ) : (
        <>
          {/* OVERVIEW METRICS */}

          <div className="overview-metrics">
            <MetricCard
              title="Total nodes"
              value={nodes.length}
              detail="Registered machines"
              icon={Monitor}
              tone="blue"
            />
            <MetricCard
              title="Online nodes"
              value={onlineNodes.length}
              detail="Currently reporting"
              icon={Wifi}
              tone="green"
            />

            <MetricCard
              title="Offline nodes"
              value={offlineNodes}
              detail="Not currently reporting"
              icon={WifiOff}
              tone={offlineNodes > 0 ? "red" : "green"}
            />

            <MetricCard
              title="Average CPU"
              value={`${averageCpu.toFixed(1)}%`}
              detail={`Average memory: ${averageMemory.toFixed(1)}%`}
              icon={Cpu}
              tone="purple"
            />
          </div>

          {/* GRAFANA MONITORING */}

          <GrafanaDashboard
            key={nodes.map((node: FleetNode, index: number) => getNodeId(node, index)).join("|")}
          />

          {/* YOUR NODES */}

          <section
            style={{ marginTop: 20 }}
            className="content-panel fleet-list-panel"
          >
            <div className="panel-title-row">
              <div>
                <h2>Your nodes</h2>

                <p>
                  Live system information from your registered
                  Linux machines.
                </p>
              </div>

              <div className="panel-actions">
                <span className="live-indicator">
                  <i /> LIVE
                </span>

                <button
                  className="button button-primary button-small"
                  onClick={() => setShowOnboarding(true)}
                >
                  <Plus size={15} />
                  Add node
                </button>
              </div>
            </div>

            <div className="fleet-node-list">
              {nodes.map((node: FleetNode, index: number) => (
                <NodeCard
                  key={getNodeId(node, index)}
                  node={node}
                  index={index}
                  now={now}
                />
              ))}
            </div>
          </section>

          {/* MONITORING PROMO */}

          <div className="monitoring-promo">
            <div className="promo-icon">
              <Activity size={21} />
            </div>

            <div>
              <b>Go deeper with live monitoring</b>

              <p>
                Open Grafana dashboards and Prometheus metrics
                for detailed investigation.
              </p>
            </div>
          </div>
        </>
      )}

      <div className="dashboard-footer">
        <span>
          Linux Fleet · Infrastructure visibility
        </span>

        <span>
          <i className="pulse-dot" />
          Polling interval: 15 seconds
        </span>
      </div>

      {showOnboarding && (
        <NodeOnboarding
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}

/* ROLE-BASED DASHBOARD ENTRY */

export default function Overview() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="page-loading">
        <span className="loader-ring" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (user?.role === "ADMIN") {
    return <AdminOverview />;
  }

  return <UserOverview />;
}