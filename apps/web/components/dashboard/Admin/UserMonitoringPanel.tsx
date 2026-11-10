"use client";

import { ExternalLink, Monitor, Server } from "lucide-react";

import type { AdminNode, AdminUser } from "./types";
import GrafanaEmbed from "./GrafanaEmbed";

type UserMonitoringPanelProps = {
  user: AdminUser;
  nodes: AdminNode[];
  getNodeId: (node: AdminNode) => string;
};

export default function UserMonitoringPanel({
  user,
  nodes,
  getNodeId,
}: UserMonitoringPanelProps) {
  const grafanaUrl =
    process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3001";

  const dashboardUid =
    process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_UID || "linux-fleet-node";

  const userId = String(user.id ?? "").trim();

  const validNodes = nodes.filter((node) => getNodeId(node));

  /**
   * Build Grafana URL with the selected user's UUID
   * and, when provided, the actual agent node ID.
   */
  const buildUrl = (nodeId?: string) => {
    const url = new URL(`/d/${dashboardUid}`, grafanaUrl);

    url.searchParams.set("orgId", "1");
    url.searchParams.set("kiosk", "tv");
    url.searchParams.set("from", "now-1h");
    url.searchParams.set("to", "now");
    url.searchParams.set("refresh", "15s");

    // Grafana dashboard variable: userId
    url.searchParams.set("var-userId", userId);

    // Grafana dashboard variable: node
    if (nodeId) {
      url.searchParams.set("var-node", nodeId);
    }

    return url.toString();
  };

  return (
    <section className="w-full min-w-0 space-y-4 rounded-xl border border-[#1b3048] bg-[#0c1b2d] p-3 shadow-lg shadow-black/20 sm:p-4 md:p-5">
      {/* User monitoring header */}
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

      {/* Full-width node monitoring panels */}
      {!validNodes.length ? (
        <div className="rounded-lg border border-[#263c55] p-5 text-sm text-[#8ea4bd]">
          No nodes are associated with this user, or the owner field returned
          by the API needs mapping.
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-4">
          {validNodes.map((node) => {
            const id = getNodeId(node);

            const hostname =
              node.hostname || node.nodeName || node.node_name || id;

            const grafanaNodeUrl = buildUrl(id);

            return (
              <article
                key={id}
                className="w-full min-w-0 overflow-hidden rounded-lg border border-[#263c55] bg-[#07111f]"
              >
                {/* Node header */}
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

                {/* Responsive Grafana iframe */}
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
