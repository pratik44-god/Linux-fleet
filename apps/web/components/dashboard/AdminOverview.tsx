"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  useUser,
  useGetAllUsersForAdmin,
} from "~/hooks/api/auth";
import { useGetAllNodesForAdmin } from "~/hooks/api/fleetNodes";

import AdminHeader from "./Admin/AdminHeader";
import AdminStats from "./Admin/AdminStats";
import AdminUsersTable from "./Admin/AdminUsersTable";
import UserMonitoringPanel from "./Admin/UserMonitoringPanel";

import type { AdminNode, AdminUser } from "./Admin/types";

const SELECTED_USER_STORAGE_KEY = "admin_selected_monitoring_user";

export default function AdminOverview() {
  // Check the currently logged-in user's role.
  const {
    user,
    isLoading: userLoading,
    isError: userError,
  } = useUser();

  const isAdmin =
    String(user?.role ?? "").toUpperCase() === "ADMIN";

  // Admin-only queries.
  const usersQuery = useGetAllUsersForAdmin(isAdmin);
  const nodesQuery = useGetAllNodesForAdmin(isAdmin);

  const [search, setSearch] = useState("");

  // Restore the selected user from localStorage.
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    null
  );

  const [selectionRestored, setSelectionRestored] = useState(false);

  /**
   * Restore the selected monitoring user after mounting.
   */
  useEffect(() => {
    try {
      const savedUserId = localStorage.getItem(
        SELECTED_USER_STORAGE_KEY
      );

      if (savedUserId) {
        setSelectedUserId(savedUserId);
      }
    } catch (error) {
      console.error(
        "Could not restore selected monitoring user:",
        error
      );
    } finally {
      setSelectionRestored(true);
    }
  }, []);

  /**
   * Persist the selected monitoring user.
   *
   * Do not save the initial null value before localStorage
   * has been restored.
   */
  useEffect(() => {
    if (!selectionRestored) return;

    try {
      if (selectedUserId) {
        localStorage.setItem(
          SELECTED_USER_STORAGE_KEY,
          selectedUserId
        );
      } else {
        localStorage.removeItem(
          SELECTED_USER_STORAGE_KEY
        );
      }
    } catch (error) {
      console.error(
        "Could not save selected monitoring user:",
        error
      );
    }
  }, [selectedUserId, selectionRestored]);

  const users = (usersQuery.users ?? []) as AdminUser[];
  const nodes = (nodesQuery.nodes ?? []) as unknown as AdminNode[];

  /**
   * Resolve the owner ID for a node.
   */
  const getNodeOwnerId = (node: AdminNode): string =>
    String(
      node.userId ??
        node.ownerId ??
        node.user?.id ??
        node.owner?.id ??
        ""
    );

  /**
   * Resolve the node ID used by the monitoring panel.
   */
  // const getNodeId = (node: AdminNode): string =>
  //   String(node.nodeId ?? node.id ?? "");

  const getNodeId = (node: AdminNode): string =>
  String(node.nodeId ?? "").trim();
  
  /**
   * Determine whether a node is online.
   */
  const isOnline = (node: AdminNode): boolean => {
    const rawStatus =
      node.status ??
      node.connectionStatus ??
      node.state ??
      node.nodeStatus;

    const status = String(rawStatus ?? "")
      .trim()
      .toLowerCase();

    const onlineStatuses = [
      "online",
      "connected",
      "active",
      "up",
      "healthy",
    ];

    const offlineStatuses = [
      "offline",
      "disconnected",
      "inactive",
      "down",
      "unhealthy",
    ];

    if (onlineStatuses.includes(status)) {
      return true;
    }

    if (offlineStatuses.includes(status)) {
      return false;
    }

    /**
     * Fallback heartbeat fields.
     * Numeric timestamps may be in seconds or milliseconds.
     */
    const timestamp =
      node.lastReportTimestamp ??
      node.last_report_timestamp ??
      node.lastSeen ??
      node.lastHeartbeat;

    if (
      timestamp === null ||
      timestamp === undefined ||
      timestamp === ""
    ) {
      return false;
    }

    let timestampMs: number;

    if (typeof timestamp === "number") {
      timestampMs =
        timestamp < 1_000_000_000_000
          ? timestamp * 1000
          : timestamp;
    } else {
      timestampMs = new Date(String(timestamp)).getTime();
    }

    if (!Number.isFinite(timestampMs)) {
      return false;
    }

    const ageMs = Date.now() - timestampMs;

    // Treat a node as online if its heartbeat is within 120 seconds.
    return ageMs >= 0 && ageMs < 120_000;
  };

  /**
   * Display only regular USER accounts.
   * ADMIN accounts are excluded.
   */
  const regularUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          String(user.role ?? "").toUpperCase() === "USER"
      ),
    [users]
  );

  /**
   * Search regular users by name, email, or role.
   */
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return regularUsers;
    }

    return regularUsers.filter((user) =>
      [user.fullName, user.name, user.email, user.role].some(
        (value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(term)
      )
    );
  }, [regularUsers, search]);

  /**
   * Resolve the selected user.
   *
   * This works after reload because selectedUserId
   * is restored from localStorage.
   */
  const selectedUser =
    regularUsers.find(
      (user) => String(user.id) === selectedUserId
    ) ?? null;

  /**
   * If the previously selected user no longer exists
   * or is no longer a regular USER, clear the selection.
   */
  useEffect(() => {
    if (!selectionRestored || usersQuery.isLoading) {
      return;
    }

    if (
      selectedUserId &&
      !regularUsers.some(
        (user) => String(user.id) === selectedUserId
      )
    ) {
      setSelectedUserId(null);
    }
  }, [
    selectionRestored,
    usersQuery.isLoading,
    selectedUserId,
    regularUsers,
  ]);

  const selectedNodes = selectedUser
    ? nodes.filter(
        (node) =>
          getNodeOwnerId(node) === String(selectedUser.id)
      )
    : [];

  /**
   * Fleet statistics.
   * These include all registered nodes.
   */
  const onlineCount = nodes.filter(isOnline).length;
  const offlineCount = Math.max(0, nodes.length - onlineCount);

  /**
   * Refresh admin data.
   */
  const handleRefresh = () => {
    if (!isAdmin) return;

    void usersQuery.refetch();
    void nodesQuery.refetch();
  };

  const isLoading = Boolean(
    usersQuery.isLoading || nodesQuery.isLoading
  );

  const hasError = Boolean(
    usersQuery.isError || nodesQuery.isError
  );

  /**
   * Wait until the current user's role has been checked.
   */
  if (userLoading) {
    return (
      <main className="min-h-screen bg-[#07111f] p-6 text-[#e8f1fc]">
        <div className="rounded-xl border border-[#1b3048] bg-[#0c1b2d] p-4 text-sm text-[#8ea4bd]">
          Checking admin access...
        </div>
      </main>
    );
  }

  /**
   * Do not render the dashboard for non-admin users.
   */
  if (userError || !isAdmin) {
    return (
      <main className="min-h-screen bg-[#07111f] p-4 text-[#e8f1fc] md:p-7">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <h1 className="font-semibold text-red-200">
            Admin access required
          </h1>

          <p className="mt-1 text-sm text-red-200/80">
            Your account does not have the ADMIN role.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full min-w-0 space-y-6 bg-[#07111f] p-4 text-[#e8f1fc] md:p-7">
      {/* Admin header */}
      <AdminHeader
        onRefresh={handleRefresh}
        refreshing={isLoading}
      />

      {/* Error message */}
      {hasError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <p className="font-medium">
            Could not load all admin data.
          </p>

          <p className="mt-1 text-red-200/80">
            Check your backend admin permissions, then try refreshing.
          </p>
        </div>
      )}

      {/* Fleet statistics */}
      <AdminStats
        users={regularUsers.length}
        nodes={nodes.length}
        online={onlineCount}
        offline={offlineCount}
      />

      {/* All regular users */}
      <section className="w-full min-w-0 overflow-hidden rounded-xl border border-[#1b3048] bg-[#0c1b2d] shadow-lg shadow-black/20">
        {/* Users section header */}
        <div className="flex flex-col gap-3 border-b border-[#1b3048] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              All users
            </h2>

            <p className="mt-1 text-xs text-[#8ea4bd]">
              Registered users in your fleet
            </p>

            <p className="mt-1 text-xs text-[#71869e]">
              Showing {filteredUsers.length} of {regularUsers.length} users
            </p>
          </div>

          {/* Search */}
          <label className="flex items-center gap-2 rounded-lg border border-[#263c55] bg-[#07111f] px-3 py-2 transition-colors focus-within:border-blue-500/60">
            <Search
              size={15}
              className="shrink-0 text-[#8ea4bd]"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, role…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#71869e] sm:w-64"
            />
          </label>
        </div>

        {/* Scrollable users table */}
        <div className="relative w-full min-w-0">
          <div
            className="
              max-h-[520px]
              w-full
              min-w-0
              overflow-x-auto
              overflow-y-auto
              overscroll-contain
              scroll-smooth
              shadow-inner
              scrollbar-thin
              scrollbar-thumb-[#263c55]
              scrollbar-track-[#07111f]
            "
          >
            <AdminUsersTable
              users={filteredUsers}
              nodes={nodes}
              getNodeOwnerId={getNodeOwnerId}
              isOnline={isOnline}
              selectedUserId={selectedUserId}
              onSelect={(id) =>
                setSelectedUserId((current) =>
                  current === id ? null : id
                )
              }
              loading={Boolean(usersQuery.isLoading)}
            />
          </div>

          {/* Scroll shadows */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-3 bg-gradient-to-b from-[#0c1b2d] to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-3 bg-gradient-to-t from-[#0c1b2d] to-transparent" />
        </div>
      </section>

      {/* Selected user monitoring - single column, full width */}
      {selectedUser && (
        <section className="grid w-full min-w-0 grid-cols-1 gap-4">
          <UserMonitoringPanel
            user={selectedUser}
            nodes={selectedNodes}
            getNodeId={getNodeId}
          />
        </section>
      )}

      {/* Footer */}
      <p className="text-xs text-[#71869e]">
        Node status is based on the backend status or the latest reported
        heartbeat. Grafana provides historical metrics; this page does not
        fabricate metric values.
      </p>
    </main>
  );
}
