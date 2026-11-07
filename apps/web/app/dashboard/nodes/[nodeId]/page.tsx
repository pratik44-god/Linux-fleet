"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Cpu, HardDrive, MemoryStick, Monitor, Wifi, WifiOff } from "lucide-react";
import { useGetNodeByNodeId } from "~/hooks/api/fleetNodes";

type NodeRecord = Record<string, any>;
function read(node: NodeRecord, ...keys: string[]) { for (const key of keys) if (node?.[key] !== undefined && node?.[key] !== null) return node[key]; return null; }
function num(node: NodeRecord, ...keys: string[]) { const value = Number(read(node, ...keys)); return Number.isFinite(value) ? value : null; }
function formatMb(value: number | null) { if (value === null) return "Not reported"; return value >= 1024 ? `${(value / 1024).toFixed(2)} GB` : `${value.toFixed(0)} MB`; }
function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) { return <div className="content-panel lf-detail-stat"><span><Icon size={17}/>{label}</span><strong>{value}</strong></div>; }
export default function NodeDetailsPage() {
  const params = useParams<{ nodeId: string }>();
  const nodeId = decodeURIComponent(params.nodeId);
  const { node: rawNode, isLoading, isError, error, refetch } = useGetNodeByNodeId(nodeId);
  const node = (rawNode || {}) as NodeRecord;
  const cpu = num(node, "cpuUsagePercent", "cpu_usage_percent");
  const memoryUsed = num(node, "memoryUsedMb", "memoryUsedMB", "memory_used_mb");
  const memoryTotal = num(node, "memoryTotalMb", "memoryTotalMB", "memory_total_mb");
  const diskUsed = num(node, "diskUsedMb", "diskUsedMB", "disk_used_mb");
  const diskTotal = num(node, "diskTotalMb", "diskTotalMB", "disk_total_mb");
  const reportedAt = read(node, "reportedAt", "reported_at", "lastReportedAt");
  const timestamp = reportedAt ? new Date(reportedAt).getTime() : 0;
  const online = timestamp ? Date.now() - timestamp <= 45000 : Boolean(read(node, "isOnline", "is_online"));
  const battery = read(node, "battery", "batteryStatus", "battery_status");
  const batteryText = typeof battery === "object" && battery ? `${battery.percentage ?? battery.percent ?? "—"}% ${battery.status ?? battery.state ?? ""}` : battery == null ? "Not reported" : String(battery);
  if (isLoading) return <div className="page-loading"><span className="loader-ring"/><p>Loading node details…</p></div>;
  if (isError || !rawNode) return <div className="dashboard-content"><Link href="/dashboard/nodes" className="button button-secondary"><ArrowLeft size={15}/> Back to nodes</Link><div className="inline-error">{error?.message || "Node details could not be found."}</div><button className="button button-secondary" onClick={() => void refetch()}>Retry</button></div>;
  const hostname = read(node, "hostname", "nodeName", "node_name") || nodeId;
  return <div className="dashboard-content"><div className="page-title-row"><div><Link href="/dashboard/nodes" className="lf-back-link"><ArrowLeft size={14}/> All nodes</Link><div className="eyebrow">NODE INSPECTION</div><h1>{hostname}</h1><p>{read(node, "os") || "Linux"} · {read(node, "architecture") || "Unknown architecture"} · {nodeId}</p></div><span className={`fleet-node-status ${online ? "online" : "offline"}`}>{online ? <Wifi size={14}/> : <WifiOff size={14}/>} {online ? "Online" : "Offline"}</span></div>
    <div className="overview-metrics"><article className="overview-metric blue"><div className="metric-top"><span>CPU usage</span><Cpu size={17}/></div><strong>{cpu === null ? "—" : `${cpu.toFixed(1)}%`}</strong><small>{read(node, "cpuCores", "cpu_cores") ?? "—"} CPU cores</small></article><article className="overview-metric green"><div className="metric-top"><span>Memory</span><MemoryStick size={17}/></div><strong>{memoryUsed === null || memoryTotal === null ? "—" : `${(memoryUsed / 1024).toFixed(1)} GB`}</strong><small>{formatMb(memoryUsed)} used / {formatMb(memoryTotal)}</small></article><article className="overview-metric purple"><div className="metric-top"><span>Disk</span><HardDrive size={17}/></div><strong>{diskUsed === null || diskTotal === null ? "—" : `${(diskUsed / 1024).toFixed(1)} GB`}</strong><small>{formatMb(diskUsed)} used / {formatMb(diskTotal)}</small></article><article className="overview-metric orange"><div className="metric-top"><span>Battery</span><Monitor size={17}/></div><strong>{batteryText}</strong><small>Latest agent report</small></article></div>
    <section className="content-panel lf-detail-section"><div className="panel-title-row"><div><h2>System information</h2><p>Values from the latest report received by Linux Fleet.</p></div><button className="button button-secondary button-small" onClick={() => void refetch()}>Refresh</button></div><div className="lf-detail-grid"><Stat label="Hostname" value={String(hostname)} icon={Monitor}/><Stat label="Operating system" value={String(read(node, "os") || "Not reported")} icon={Monitor}/><Stat label="Kernel" value={String(read(node, "kernel") || "Not reported")} icon={Cpu}/><Stat label="Architecture" value={String(read(node, "architecture") || "Not reported")} icon={Cpu}/><Stat label="CPU cores" value={String(read(node, "cpuCores", "cpu_cores") ?? "Not reported")} icon={Cpu}/><Stat label="Last report" value={reportedAt ? new Date(reportedAt).toLocaleString() : "Not reported"} icon={Wifi}/></div></section>
    <section className="content-panel lf-history-note"><div className="lf-history-icon"><Cpu size={19}/></div><div><b>Node metric history</b><p>Current resource values are available above. Time-series history will be displayed here when the API exposes the authenticated Prometheus query endpoint.</p></div></section>
  </div>;
}
