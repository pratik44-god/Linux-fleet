"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CircleAlert,
  Clock3,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import { useUser } from "~/hooks/api/auth";
import {
  useGetAllNodes,
  useGetAllNodesForAdmin,
} from "~/hooks/api/fleetNodes";
import {
  useGetAllAlerts,
  useSendingAlertMessageToUser,
} from "~/hooks/api/alert";

type NodeOwner = {
  id?: string;
  fullName?: string;
  email?: string;
};

type FleetNode = {
  id?: string;
  nodeId?: string;
  hostname?: string;
  os?: string;
  cpuCores?: number;
  cpuUsagePercent?: number;
  memoryTotalMB?: number;
  memoryUsedMB?: number;
  diskTotalMB?: number;
  diskUsedMB?: number;
  reportedAt?: string | Date | null;
  owner?: NodeOwner | null;
};

type AlertSeverity = "critical" | "warning" | "info";
type AlertMetric = "CPU" | "RAM" | "Disk" | "Node";

type FleetAlert = {
  id: string;
  nodeKey: string;
  nodeId: string;
  hostname: string;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  metric: AlertMetric;
  severity: AlertSeverity;
  title: string;
  message: string;
  value?: number;
  threshold?: number;
  createdAt: number;
  acknowledged: boolean;
  sentToDashboard: boolean;
};

const CPU_WARNING_THRESHOLD = 80;
const CPU_CRITICAL_THRESHOLD = 90;
const CPU_SPIKE_DELTA = 25;

const RAM_CRITICAL_THRESHOLD = 90;

const DISK_WARNING_THRESHOLD = 80;
const DISK_CRITICAL_THRESHOLD = 90;

const STALE_NODE_THRESHOLD_MS = 2 * 60 * 1000;

const MESSAGE_POLL_INTERVAL_MS = 5000;

function toNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function getUsagePercent(used: unknown, total: unknown): number | null {
  const usedValue = toNumber(used);
  const totalValue = toNumber(total);

  if (
    usedValue === null ||
    totalValue === null ||
    totalValue <= 0 ||
    usedValue < 0
  ) {
    return null;
  }

  return Math.min(100, Math.max(0, (usedValue / totalValue) * 100));
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}

function formatMB(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} GB`;
  }

  return `${Math.round(value)} MB`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function getNodeKey(node: FleetNode): string {
  return String(node.id ?? node.nodeId ?? node.hostname ?? "unknown-node");
}

function getNodeName(node: FleetNode): string {
  return node.hostname || node.nodeId || "Unknown node";
}

function getReportedAtMs(node: FleetNode): number | null {
  if (!node.reportedAt) {
    return null;
  }

  const timestamp = new Date(node.reportedAt).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
}

function getSeverityStyles(severity: AlertSeverity) {
  if (severity === "critical") {
    return {
      badge: "border-red-500/20 bg-red-500/10 text-red-400",
      icon: "text-red-400",
      dot: "bg-red-400",
    };
  }

  if (severity === "warning") {
    return {
      badge: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      icon: "text-amber-400",
      dot: "bg-amber-400",
    };
  }

  return {
    badge: "border-sky-500/20 bg-sky-500/10 text-sky-400",
    icon: "text-sky-400",
    dot: "bg-sky-400",
  };
}

function getMetricIcon(metric: AlertMetric) {
  if (metric === "CPU") {
    return Cpu;
  }

  if (metric === "RAM") {
    return MemoryStick;
  }

  if (metric === "Disk") {
    return HardDrive;
  }

  return Activity;
}

export default function AlertsPage() {
  const { user } = useUser();

  const isAdmin = String(user?.role ?? "").toUpperCase() === "ADMIN";

  const {
    nodes: userNodes = [],
    isLoading: isUserNodesLoading,
    isError: isUserNodesError,
    refetch: refetchUserNodes,
  } = useGetAllNodes();

  const {
    nodes: adminNodes = [],
    isLoading: isAdminNodesLoading,
    isError: isAdminNodesError,
    refetch: refetchAdminNodes,
  } = useGetAllNodesForAdmin(isAdmin);

  // Admin sends messages through this mutation.
  const {
    sendingAlertMessageToUserAsync,
  } = useSendingAlertMessageToUser();

  // Logged-in user receives messages through this query.
  const {
    alerts: receivedAlerts = [],
    isLoading: isReceivedAlertsLoading,
    isError: isReceivedAlertsError,
    refetch: refetchReceivedAlerts,
  } = useGetAllAlerts();

  const nodes = (isAdmin ? adminNodes : userNodes) as FleetNode[];

  const isLoading = isAdmin ? isAdminNodesLoading : isUserNodesLoading;
  const isError = isAdmin ? isAdminNodesError : isUserNodesError;

  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "critical" | "warning" | "unread"
  >("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  // Sending message state.
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);
  const [sentAlertIds, setSentAlertIds] = useState<Set<string>>(new Set());

  // Local acknowledgement state for messages received from the backend.
  const [receivedAcknowledgedIds, setReceivedAcknowledgedIds] = useState<
    Set<string>
  >(new Set());

  const previousCpuValues = useRef<Map<string, number>>(new Map());
  const initializedCpuValues = useRef(false);
  const activeAlertKeys = useRef<Set<string>>(new Set());

  const currentUserId = user?.id ? String(user.id) : undefined;

  const visibleNodes = useMemo(() => {
    if (isAdmin) {
      return nodes;
    }

    return nodes.filter((node) => {
      if (!node.owner?.id || !currentUserId) {
        return true;
      }

      return node.owner.id === currentUserId;
    });
  }, [currentUserId, isAdmin, nodes]);

  // Convert backend messages into the existing frontend alert format.
  const receivedMessages = useMemo<FleetAlert[]>(() => {
    if (isAdmin || !Array.isArray(receivedAlerts)) {
      return [];
    }

    return receivedAlerts.map((item) => {
      const category = String(item.category ?? "").toUpperCase();

      const severity: AlertSeverity =
        category === "CRITICAL"
          ? "critical"
          : category === "WARNING"
            ? "warning"
            : "info";

      const timestamp = new Date(item.createdAt).getTime();

      return {
        id: String(item.id),
        nodeKey: String(item.nodeId ?? "admin-message"),
        nodeId: String(item.nodeId ?? "admin-message"),
        hostname: "Message from administrator",
        metric: "Node",
        severity,
        title: "Message from admin",
        message: String(item.message ?? ""),
        createdAt: Number.isFinite(timestamp) ? timestamp : Date.now(),
        acknowledged:
          Boolean(item.isRead) ||
          receivedAcknowledgedIds.has(String(item.id)),
        sentToDashboard: true,
      };
    });
  }, [isAdmin, receivedAlerts, receivedAcknowledgedIds]);

  // Combine locally detected metric alerts with backend messages.
  const allAlerts = useMemo(() => {
    const combined = [...receivedMessages, ...alerts];

    return combined.sort((a, b) => b.createdAt - a.createdAt);
  }, [alerts, receivedMessages]);

  // Poll for new messages while the user's dashboard is open.
  useEffect(() => {
    if (isAdmin) {
      return;
    }

    const interval = window.setInterval(() => {
      void refetchReceivedAlerts();
    }, MESSAGE_POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [isAdmin, refetchReceivedAlerts]);

  // Detect alerts from current node metrics.
  useEffect(() => {
    if (!visibleNodes.length) {
      return;
    }

    const now = Date.now();
    const nextCpuValues = new Map<string, number>();
    const newAlerts: FleetAlert[] = [];

    function addAlert(
      node: FleetNode,
      metric: AlertMetric,
      ruleKey: string,
      severity: AlertSeverity,
      title: string,
      message: string,
      value?: number,
      threshold?: number
    ) {
      const nodeKey = getNodeKey(node);
      const dedupeKey = `${nodeKey}:${ruleKey}`;

      if (activeAlertKeys.current.has(dedupeKey)) {
        return;
      }

      activeAlertKeys.current.add(dedupeKey);

      newAlerts.push({
        id: `${dedupeKey}:${now}`,
        nodeKey,
        nodeId: node.nodeId || nodeKey,
        hostname: getNodeName(node),
        ownerId: node.owner?.id,
        ownerName: node.owner?.fullName,
        ownerEmail: node.owner?.email,
        metric,
        severity,
        title,
        message,
        value,
        threshold,
        createdAt: now,
        acknowledged: false,
        sentToDashboard: false,
      });
    }

    for (const node of visibleNodes) {
      const nodeKey = getNodeKey(node);
      const hostname = getNodeName(node);

      const cpuUsage = toNumber(node.cpuUsagePercent);

      const ramUsage = getUsagePercent(
        node.memoryUsedMB,
        node.memoryTotalMB
      );

      const diskUsage = getUsagePercent(
        node.diskUsedMB,
        node.diskTotalMB
      );

      if (cpuUsage !== null) {
        nextCpuValues.set(nodeKey, cpuUsage);

        if (cpuUsage >= CPU_CRITICAL_THRESHOLD) {
          addAlert(
            node,
            "CPU",
            "cpu-critical",
            "critical",
            "Critical CPU usage",
            `${hostname} is using ${formatPercent(
              cpuUsage
            )} CPU, above the ${CPU_CRITICAL_THRESHOLD}% critical threshold.`,
            cpuUsage,
            CPU_CRITICAL_THRESHOLD
          );
        } else if (cpuUsage >= CPU_WARNING_THRESHOLD) {
          addAlert(
            node,
            "CPU",
            "cpu-warning",
            "warning",
            "High CPU usage",
            `${hostname} is using ${formatPercent(
              cpuUsage
            )} CPU, above the ${CPU_WARNING_THRESHOLD}% warning threshold.`,
            cpuUsage,
            CPU_WARNING_THRESHOLD
          );
        }

        const previousCpu = previousCpuValues.current.get(nodeKey);

        if (
          initializedCpuValues.current &&
          previousCpu !== undefined &&
          cpuUsage - previousCpu >= CPU_SPIKE_DELTA
        ) {
          addAlert(
            node,
            "CPU",
            "cpu-spike",
            "warning",
            "Rapid CPU increase detected",
            `${hostname} CPU usage increased from ${formatPercent(
              previousCpu
            )} to ${formatPercent(
              cpuUsage
            )} since the previous node update.`,
            cpuUsage,
            CPU_SPIKE_DELTA
          );
        }
      }

      if (ramUsage !== null && ramUsage >= RAM_CRITICAL_THRESHOLD) {
        addAlert(
          node,
          "RAM",
          "ram-critical",
          "critical",
          "Critical RAM usage",
          `${hostname} is using ${formatPercent(
            ramUsage
          )} of its memory.`,
          ramUsage,
          RAM_CRITICAL_THRESHOLD
        );
      }

      if (diskUsage !== null && diskUsage >= DISK_CRITICAL_THRESHOLD) {
        addAlert(
          node,
          "Disk",
          "disk-critical",
          "critical",
          "Critical disk usage",
          `${hostname} is using ${formatPercent(
            diskUsage
          )} of its disk capacity.`,
          diskUsage,
          DISK_CRITICAL_THRESHOLD
        );
      } else if (
        diskUsage !== null &&
        diskUsage >= DISK_WARNING_THRESHOLD
      ) {
        addAlert(
          node,
          "Disk",
          "disk-warning",
          "warning",
          "High disk usage",
          `${hostname} is using ${formatPercent(
            diskUsage
          )} of its disk capacity.`,
          diskUsage,
          DISK_WARNING_THRESHOLD
        );
      }

      const reportedAt = getReportedAtMs(node);

      if (
        reportedAt !== null &&
        now - reportedAt >= STALE_NODE_THRESHOLD_MS
      ) {
        addAlert(
          node,
          "Node",
          "node-stale",
          "critical",
          "Node data is stale",
          `${hostname} has not reported updated metrics for more than 2 minutes.`
        );
      }
    }

    previousCpuValues.current = nextCpuValues;
    initializedCpuValues.current = true;

    if (newAlerts.length > 0) {
      setAlerts((currentAlerts) => [
        ...newAlerts,
        ...currentAlerts,
      ]);

      setToastMessage(
        `${newAlerts.length} new alert${
          newAlerts.length === 1 ? "" : "s"
        } detected`
      );
    }
  }, [visibleNodes]);

  // Automatically dismiss toast.
  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToastMessage(null);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  // Show a toast when a new backend message arrives.
  const previousReceivedCount = useRef(0);

  useEffect(() => {
    if (isAdmin || isReceivedAlertsLoading || isReceivedAlertsError) {
      return;
    }

    if (receivedMessages.length > previousReceivedCount.current) {
      const newestMessage = receivedMessages[0];

      if (newestMessage) {
        setToastMessage("You received a new message from the administrator");
      }
    }

    previousReceivedCount.current = receivedMessages.length;
  }, [
    isAdmin,
    isReceivedAlertsLoading,
    isReceivedAlertsError,
    receivedMessages,
  ]);

  const filteredAlerts = useMemo(() => {
    if (activeFilter === "critical") {
      return allAlerts.filter(
        (alert) => alert.severity === "critical"
      );
    }

    if (activeFilter === "warning") {
      return allAlerts.filter(
        (alert) => alert.severity === "warning"
      );
    }

    if (activeFilter === "unread") {
      return allAlerts.filter(
        (alert) => !alert.acknowledged
      );
    }

    return allAlerts;
  }, [activeFilter, allAlerts]);

  const criticalCount = allAlerts.filter(
    (alert) =>
      alert.severity === "critical" && !alert.acknowledged
  ).length;

  const warningCount = allAlerts.filter(
    (alert) =>
      alert.severity === "warning" && !alert.acknowledged
  ).length;

  const unreadCount = allAlerts.filter(
    (alert) => !alert.acknowledged
  ).length;

  // Refresh node metrics and received messages.
  const handleRefresh = async () => {
    if (isAdmin) {
      await refetchAdminNodes();
    } else {
      await Promise.all([
        refetchUserNodes(),
        refetchReceivedAlerts(),
      ]);
    }
  };

  // Frontend-only acknowledgement.
  const acknowledgeAlert = (alertId: string) => {
    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, acknowledged: true }
          : alert
      )
    );

    setReceivedAcknowledgedIds((current) => {
      const updated = new Set(current);
      updated.add(alertId);
      return updated;
    });
  };

  // Frontend-only acknowledge all.
  const acknowledgeAll = () => {
    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) => ({
        ...alert,
        acknowledged: true,
      }))
    );

    setReceivedAcknowledgedIds((current) => {
      const updated = new Set(current);

      receivedMessages.forEach((alert) => {
        updated.add(alert.id);
      });

      return updated;
    });

    setToastMessage("All alerts marked as acknowledged");
  };

  // Admin sends a message to the selected user's account.
  const sendAlertToDashboard = async (alert: FleetAlert) => {
    if (!alert.ownerEmail) {
      setToastMessage("User email is not available");
      return;
    }

    if (sentAlertIds.has(alert.id)) {
      return;
    }

    try {
      setSendingAlertId(alert.id);

      await sendingAlertMessageToUserAsync({
        email: alert.ownerEmail,
        message: alert.message,
      });

      setSentAlertIds((current) => {
        const updated = new Set(current);
        updated.add(alert.id);
        return updated;
      });

      setToastMessage(
        `Alert message sent successfully to ${alert.ownerEmail}`
      );
    } catch (error) {
      console.error("Failed to send alert message:", error);

      setToastMessage(
        "Failed to send alert message. Please try again."
      );
    } finally {
      setSendingAlertId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <Bell size={16} />
              <span>Workspace</span>
              <span>/</span>
              <span className="text-slate-200">Alerts</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {isAdmin ? "Fleet alerts" : "My alerts"}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {isAdmin
                ? "Monitor resource alerts across users and Linux nodes."
                : "Monitor CPU, memory, disk, and node health for your machines."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRules((current) => !current)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              <ShieldCheck size={16} />
              Alert rules
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Rule information */}
        {showRules && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-100">
                Current default rules
              </h2>

              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close alert rules"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <div className="mb-2 flex items-center gap-2 text-slate-300">
                  <Cpu size={16} />
                  <span className="text-sm font-medium">CPU</span>
                </div>
                <p className="text-sm text-slate-400">
                  Warning at {CPU_WARNING_THRESHOLD}%, critical at{" "}
                  {CPU_CRITICAL_THRESHOLD}%, or a rise of {CPU_SPIKE_DELTA}+
                  percentage points between updates.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <div className="mb-2 flex items-center gap-2 text-slate-300">
                  <MemoryStick size={16} />
                  <span className="text-sm font-medium">RAM</span>
                </div>
                <p className="text-sm text-slate-400">
                  Critical alert at {RAM_CRITICAL_THRESHOLD}% memory usage.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <div className="mb-2 flex items-center gap-2 text-slate-300">
                  <HardDrive size={16} />
                  <span className="text-sm font-medium">Disk</span>
                </div>
                <p className="text-sm text-slate-400">
                  Warning at {DISK_WARNING_THRESHOLD}% and critical at{" "}
                  {DISK_CRITICAL_THRESHOLD}% disk usage.
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              These are starting thresholds, not universal workload baselines.
              CPU spike detection compares consecutive values received by this
              page.
            </p>
          </div>
        )}

        {/* Stats - all four cards preserved */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Unread alerts</span>
              <Bell size={17} className="text-slate-400" />
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {unreadCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Awaiting acknowledgement
            </p>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Critical</span>
              <CircleAlert size={17} className="text-red-400" />
            </div>
            <div className="mt-3 text-3xl font-semibold text-red-400">
              {criticalCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Requires attention
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Warnings</span>
              <AlertTriangle size={17} className="text-amber-400" />
            </div>
            <div className="mt-3 text-3xl font-semibold text-amber-400">
              {warningCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Resource usage elevated
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Monitored nodes</span>
              <Activity size={17} className="text-slate-400" />
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {visibleNodes.length}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isAdmin ? "Across all users" : "Your registered nodes"}
            </p>
          </div>
        </div>

        {/* Alert list */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-100">
                Alert activity
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Alerts are generated from the latest node metrics received.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activeFilter}
                onChange={(event) =>
                  setActiveFilter(
                    event.target.value as
                      | "all"
                      | "critical"
                      | "warning"
                      | "unread"
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:border-slate-500"
                aria-label="Filter alerts"
              >
                <option value="all">All alerts</option>
                <option value="critical">Critical</option>
                <option value="warning">Warnings</option>
                <option value="unread">Unread</option>
              </select>

              <button
                type="button"
                onClick={acknowledgeAll}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCheck size={16} />
                Acknowledge all
              </button>
            </div>
          </div>

          {isLoading || (!isAdmin && isReceivedAlertsLoading) ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-400">
              <RefreshCw size={17} className="animate-spin" />
              Loading node metrics…
            </div>
          ) : isError ? (
            <div className="p-10 text-center">
              <AlertCircle
                className="mx-auto mb-3 text-red-400"
                size={24}
              />
              <p className="font-medium text-slate-200">
                Unable to load node metrics
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Refresh the page or check your API connection.
              </p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                <Check size={22} className="text-emerald-400" />
              </div>
              <h3 className="font-medium text-slate-200">
                {allAlerts.length === 0
                  ? "No alerts detected"
                  : "No alerts match this filter"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {allAlerts.length === 0
                  ? "Your monitored nodes are not currently triggering the configured rules."
                  : "Try selecting a different alert filter."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredAlerts.map((alert) => {
                const severityStyles = getSeverityStyles(alert.severity);
                const MetricIcon = getMetricIcon(alert.metric);

                const isSending = sendingAlertId === alert.id;
                const isSent = sentAlertIds.has(alert.id);

                const isReceivedMessage = receivedMessages.some(
                  (message) => message.id === alert.id
                );

                return (
                  <div
                    key={alert.id}
                    className={`p-4 transition hover:bg-slate-800/30 ${
                      alert.acknowledged ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 ${severityStyles.icon}`}
                        >
                          <MetricIcon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-slate-100">
                              {alert.title}
                            </h3>

                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${severityStyles.badge}`}
                            >
                              {alert.severity}
                            </span>

                            {isReceivedMessage && (
                              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-300">
                                Admin message
                              </span>
                            )}

                            {alert.acknowledged && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                                <Check size={11} />
                                Acknowledged
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm leading-6 text-slate-400">
                            {alert.message}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <Activity size={13} />
                              {alert.hostname}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={13} />
                              {formatTime(alert.createdAt)}
                            </span>

                            {alert.value !== undefined && (
                              <span>
                                Current:{" "}
                                <span className="font-medium text-slate-300">
                                  {formatPercent(alert.value)}
                                </span>
                              </span>
                            )}

                            {alert.threshold !== undefined && (
                              <span>
                                Rule:{" "}
                                <span className="font-medium text-slate-300">
                                  {alert.metric === "CPU" &&
                                  alert.title.includes("Rapid")
                                    ? `+${alert.threshold} points`
                                    : `${alert.threshold}%`}
                                </span>
                              </span>
                            )}
                          </div>

                          {isAdmin && (
                            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                              <p className="text-xs font-medium text-slate-300">
                                {alert.ownerName || "Owner not available"}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {alert.ownerEmail ||
                                  "Owner email not available"}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-600">
                                Node ID: {alert.nodeId}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => sendAlertToDashboard(alert)}
                            disabled={
                              isSent ||
                              isSending ||
                              !alert.ownerEmail
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSent ? (
                              <>
                                <Check size={14} />
                                Message sent
                              </>
                            ) : isSending ? (
                              <>
                                <RefreshCw
                                  size={14}
                                  className="animate-spin"
                                />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send size={14} />
                                Send to user dashboard
                              </>
                            )}
                          </button>
                        )}

                        {!alert.acknowledged && (
                          <button
                            type="button"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
                          >
                            <Check size={14} />
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs leading-5 text-slate-600">
          Alerts are detected locally. Messages sent by administrators are
          retrieved from your account and refreshed every 5 seconds.
        </p>
      </div>

      {/* In-app toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex max-w-md items-start gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 shadow-2xl"
        >
          <div className="mt-0.5 rounded-full bg-sky-500/10 p-1.5 text-sky-400">
            <Bell size={15} />
          </div>

          <p className="flex-1 text-sm leading-5 text-slate-200">
            {toastMessage}
          </p>

          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
