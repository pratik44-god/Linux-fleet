
"use client";

import {
  ExternalLink,
  Monitor,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";

import type { AdminNode, AdminUser } from "./types";
import GrafanaEmbed from "./GrafanaEmbed";

type UserMonitoringPanelProps = {
  user: AdminUser;
  nodes: AdminNode[];
  getNodeId: (node: AdminNode) => string;
  isOnline: (node: AdminNode) => boolean;
};

export default function UserMonitoringPanel({
  user,
  nodes,
  getNodeId,
  isOnline,
}: UserMonitoringPanelProps) {
  const grafanaUrl =
    process.env.NEXT_PUBLIC_GRAFANA_URL ||
    "https://grafana.its-pratik.dev";

  const dashboardUid =
    process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_UID ||
    "linux-fleet-node";

  const userId = String(user.id ?? "").trim();

  const validNodes = nodes.filter((node) => getNodeId(node));

  const onlineCount = validNodes.filter(isOnline).length;
  const offlineCount = validNodes.length - onlineCount;

  const buildUrl = (nodeId?: string) => {
    const url = new URL(`/d/${dashboardUid}`, grafanaUrl);

    url.searchParams.set("orgId", "1");
    url.searchParams.set("kiosk", "tv");
    url.searchParams.set("from", "now-1h");
    url.searchParams.set("to", "now");
    url.searchParams.set("refresh", "15s");

    // Match the exact Grafana variable names.
    url.searchParams.set("var-userid", userId);

    if (nodeId) {
      url.searchParams.set("var-nodeid", nodeId);
    }

    return url.toString();
  };

  return (
    <section className="w-full min-w-0 space-y-4 rounded-xl border border-[#1b3048] bg-[#0c1b2d] p-3 shadow-lg shadow-black/20 sm:p-4 md:p-5">
      <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-blue-400">
            <Monitor size={16} />
            <span className="text-xs uppercase tracking-wide">
              User monitoring
            </span>
          </div>

          <h2 className="mt-2 text-lg font-semibold">
            {user.fullName || user.name || user.email || "Selected user"}
          </h2>

          <p className="mt-1 text-xs text-[#8ea4bd]">
            {user.email} · {validNodes.length} registered node(s)
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              <Wifi size={13} />
              {onlineCount} online
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-rose-300">
              <WifiOff size={13} />
              {offlineCount} offline
            </span>
          </div>
        </div>

        <a
          href={buildUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium transition hover:bg-blue-500"
        >
          <ExternalLink size={15} />
          Open user fleet in Grafana
        </a>
      </div>

      {!validNodes.length ? (
        <div className="rounded-lg border border-[#263c55] p-5 text-sm text-[#8ea4bd]">
          No nodes are associated with this user, or the owner field returned
          by the API needs mapping.
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-4">
          {validNodes.map((node) => {
            const id = getNodeId(node);
            const online = isOnline(node);

            const hostname =
              node.hostname || node.nodeName || node.node_name || id;

            const grafanaNodeUrl = buildUrl(id);

            return (
              <article
                key={id}
                className="w-full min-w-0 overflow-hidden rounded-lg border border-[#263c55] bg-[#07111f]"
              >
                <div className="flex min-w-0 flex-col justify-between gap-3 border-b border-[#263c55] px-3 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                      <Server
                        size={14}
                        className="shrink-0 text-blue-400"
                      />
                      <span className="truncate">{hostname}</span>
                    </div>

                    <p className="mt-1 truncate text-xs text-[#8ea4bd]">
                      Node ID: {id}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        online
                          ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300"
                          : "inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300"
                      }
                    >
                      {online ? <Wifi size={13} /> : <WifiOff size={13} />}
                      {online ? "Online" : "Offline"}
                    </span>

                    <a
                      href={grafanaNodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-[#304761] px-2 py-1 text-xs transition hover:bg-[#142943]"
                    >
                      <ExternalLink size={12} />
                      Open Grafana
                    </a>
                  </div>
                </div>

                <div className="h-[480px] w-full min-w-0 sm:h-[520px] lg:h-[560px]">
                  <GrafanaEmbed
                    src={grafanaNodeUrl}
                    title={`Grafana metrics for ${hostname}`}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
