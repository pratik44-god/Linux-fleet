
// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { Search } from "lucide-react";

// import {
//   useUser,
//   useGetAllUsersForAdmin,
// } from "~/hooks/api/auth";

// import { useGetAllNodesForAdmin } from "~/hooks/api/fleetNodes";

// import AdminHeader from "./Admin/AdminHeader";
// import AdminStats from "./Admin/AdminStats";
// import AdminUsersTable from "./Admin/AdminUsersTable";
// import UserMonitoringPanel from "./Admin/UserMonitoringPanel";

// import type { AdminNode, AdminUser } from "./Admin/types";

// const SELECTED_USER_STORAGE_KEY = "admin_selected_monitoring_user";
// const ONLINE_THRESHOLD = 45_000;
// const STATUS_REFRESH_INTERVAL = 5_000;

// type NodeWithHeartbeat = AdminNode & Record<string, any>;

// function getTimestampMilliseconds(timestamp: unknown): number | null {
//   if (
//     timestamp === null ||
//     timestamp === undefined ||
//     timestamp === ""
//   ) {
//     return null;
//   }

//   let milliseconds: number;

//   if (timestamp instanceof Date) {
//     milliseconds = timestamp.getTime();
//   } else if (
//     typeof timestamp === "number" ||
//     (typeof timestamp === "string" &&
//       /^\d+(\.\d+)?$/.test(timestamp.trim()))
//   ) {
//     const numericValue = Number(timestamp);

//     milliseconds =
//       numericValue < 1_000_000_000_000
//         ? numericValue * 1000
//         : numericValue;
//   } else {
//     milliseconds = new Date(String(timestamp)).getTime();
//   }

//   return Number.isFinite(milliseconds) ? milliseconds : null;
// }

// /**
//  * Get the newest valid heartbeat from all supported API fields.
//  */
// function getNodeHeartbeat(node: NodeWithHeartbeat): number | null {
//   const timestampFields = [
//     "reportedAt",
//     "reported_at",
//     "lastReportedAt",
//     "last_reported_at",
//     "lastReportAt",
//     "last_report_at",
//     "lastReportTimestamp",
//     "last_report_timestamp",
//     "lastSeen",
//     "last_seen",
//     "lastSeenAt",
//     "last_seen_at",
//     "lastHeartbeat",
//     "last_heartbeat",
//     "lastHeartbeatAt",
//     "last_heartbeat_at",
//     "heartbeatAt",
//     "heartbeat_at",
//   ];

//   const timestamps = timestampFields
//     .map((field) => getTimestampMilliseconds(node[field]))
//     .filter((value): value is number => value !== null);

//   return timestamps.length ? Math.max(...timestamps) : null;
// }

// /**
//  * One shared online/offline calculation for the entire Admin panel.
//  */
// function isNodeOnline(node: NodeWithHeartbeat, now: number): boolean {
//   const heartbeat = getNodeHeartbeat(node);

//   // A valid heartbeat takes priority over potentially stale status fields.
//   if (heartbeat !== null) {
//     const age = now - heartbeat;

//     return age >= -5_000 && age <= ONLINE_THRESHOLD;
//   }

//   // Use explicit boolean status only when there is no usable heartbeat.
//   if (typeof node.isOnline === "boolean") {
//     return node.isOnline;
//   }
 
//   if (typeof node.is_online === "boolean") {
//     return node.is_online;
//   }

//   const rawStatus =
//     node.status ??
//     node.connectionStatus ??
//     node.connection_status ??
//     node.state ??
//     node.nodeStatus ??
//     node.node_status;

//   const status = String(rawStatus ?? "").trim().toLowerCase();

//   return ["online", "connected", "active", "up", "healthy"].includes(
//     status
//   );
// }

// export default function AdminOverview() {
//   const {
//     user,
//     isLoading: userLoading,
//     isError: userError,
//   } = useUser();

//   const isAdmin =
//     String(user?.role ?? "").toUpperCase() === "ADMIN";

//   const usersQuery = useGetAllUsersForAdmin(isAdmin);
//   const nodesQuery = useGetAllNodesForAdmin(isAdmin);

//   const [search, setSearch] = useState("");
//   const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
//   const [selectionRestored, setSelectionRestored] = useState(false);
//   const [now, setNow] = useState(() => Date.now());
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   useEffect(() => {
//     try {
//       const savedUserId = localStorage.getItem(
//         SELECTED_USER_STORAGE_KEY
//       );

//       if (savedUserId) {
//         setSelectedUserId(savedUserId);
//       }
//     } catch (error) {
//       console.error("Could not restore selected monitoring user:", error);
//     } finally {
//       setSelectionRestored(true);
//     }
//   }, []);

//   useEffect(() => {
//     if (!selectionRestored) return;

//     try {
//       if (selectedUserId) {
//         localStorage.setItem(
//           SELECTED_USER_STORAGE_KEY,
//           selectedUserId
//         );
//       } else {
//         localStorage.removeItem(SELECTED_USER_STORAGE_KEY);
//       }
//     } catch (error) {
//       console.error("Could not save selected monitoring user:", error);
//     }
//   }, [selectedUserId, selectionRestored]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setNow(Date.now());
//     }, STATUS_REFRESH_INTERVAL);

//     return () => clearInterval(interval);
//   }, []);

//   const users = (usersQuery.users ?? []) as AdminUser[];

//   const nodes = (nodesQuery.nodes ?? []) as unknown as NodeWithHeartbeat[];

//   const getNodeOwnerId = (node: AdminNode): string =>
//     String(
//       node.userId ??
//         node.ownerId ??
//         node.user?.id ??
//         node.owner?.id ??
//         ""
//     );

//   const getNodeId = (node: AdminNode): string =>
//     String(node.nodeId ?? "").trim();

//   const regularUsers = useMemo(
//     () =>
//       users.filter(
//         (user) => String(user.role ?? "").toUpperCase() === "USER"
//       ),
//     [users]
//   );

//   const filteredUsers = useMemo(() => {
//     const term = search.trim().toLowerCase();

//     if (!term) return regularUsers;

//     return regularUsers.filter((user) =>
//       [user.fullName, user.name, user.email, user.role].some((value) =>
//         String(value ?? "").toLowerCase().includes(term)
//       )
//     );
//   }, [regularUsers, search]);

//   const selectedUser =
//     regularUsers.find(
//       (user) => String(user.id) === selectedUserId
//     ) ?? null;

//   useEffect(() => {
//     if (!selectionRestored || usersQuery.isLoading) return;

//     if (
//       selectedUserId &&
//       !regularUsers.some(
//         (user) => String(user.id) === selectedUserId
//       )
//     ) {
//       setSelectedUserId(null);
//     }
//   }, [
//     selectionRestored,
//     usersQuery.isLoading,
//     selectedUserId,
//     regularUsers,
//   ]);

//   const selectedNodes = selectedUser
//     ? nodes.filter(
//         (node) =>
//           getNodeOwnerId(node) === String(selectedUser.id)
//       )
//     : [];

//   // Calculate all Admin statistics from the same status function.
//   const onlineCount = nodes.filter((node) =>
//     isNodeOnline(node, now)
//   ).length;

//   const offlineCount = Math.max(0, nodes.length - onlineCount);

//   async function handleRefresh() {
//     if (!isAdmin || isRefreshing) return;

//     setIsRefreshing(true);

//     try {
//       await Promise.all([
//         usersQuery.refetch(),
//         nodesQuery.refetch(),
//       ]);

//       setNow(Date.now());
//     } catch (error) {
//       console.error("Failed to refresh admin dashboard:", error);
//     } finally {
//       setIsRefreshing(false);
//     }
//   }

//   const isLoading = Boolean(
//     usersQuery.isLoading || nodesQuery.isLoading
//   );

//   const hasError = Boolean(
//     usersQuery.isError || nodesQuery.isError
//   );

//   if (userLoading) {
//     return (
//       <main className="min-h-screen bg-[#07111f] p-6 text-[#e8f1fc]">
//         <div className="rounded-xl border border-[#1b3048] bg-[#0c1b2d] p-4 text-sm text-[#8ea4bd]">
//           Checking admin access...
//         </div>
//       </main>
//     );
//   }

//   if (userError || !isAdmin) {
//     return (
//       <main className="min-h-screen bg-[#07111f] p-4 text-[#e8f1fc] md:p-7">
//         <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
//           <h1 className="font-semibold text-red-200">
//             Admin access required
//           </h1>
//           <p className="mt-1 text-sm text-red-200/80">
//             Your account does not have the ADMIN role.
//           </p>
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="min-h-screen w-full min-w-0 space-y-6 bg-[#07111f] p-4 text-[#e8f1fc] md:p-7">
//       <AdminHeader
//         onRefresh={handleRefresh}
//         refreshing={isRefreshing || isLoading}
//       />

//       {hasError && (
//         <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
//           <p className="font-medium">
//             Could not load all admin data.
//           </p>
//           <p className="mt-1 text-red-200/80">
//             Check your backend admin permissions, then try refreshing.
//           </p>
//         </div>
//       )}

//       <AdminStats
//         users={regularUsers.length}
//         nodes={nodes.length}
//         online={onlineCount}
//         offline={offlineCount}
//       />

//       <section className="w-full min-w-0 overflow-hidden rounded-xl border border-[#1b3048] bg-[#0c1b2d] shadow-lg shadow-black/20">
//         <div className="flex flex-col gap-3 border-b border-[#1b3048] p-4 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h2 className="font-semibold">All users</h2>
//             <p className="mt-1 text-xs text-[#8ea4bd]">
//               Registered users in your fleet
//             </p>
//             <p className="mt-1 text-xs text-[#71869e]">
//               Showing {filteredUsers.length} of {regularUsers.length} users
//             </p>
//           </div>

//           <label className="flex items-center gap-2 rounded-lg border border-[#263c55] bg-[#07111f] px-3 py-2 transition-colors focus-within:border-blue-500/60">
//             <Search
//               size={15}
//               className="shrink-0 text-[#8ea4bd]"
//             />
//             <input
//               value={search}
//               onChange={(event) => setSearch(event.target.value)}
//               placeholder="Search name, email, role…"
//               className="w-full bg-transparent text-sm outline-none placeholder:text-[#71869e] sm:w-64"
//             />
//           </label>
//         </div>

//         <div className="relative w-full min-w-0">
//           <div
//             className="
//               max-h-[520px] w-full min-w-0
//               overflow-x-auto overflow-y-auto
//               overscroll-contain scroll-smooth shadow-inner
//               scrollbar-thin scrollbar-thumb-[#263c55]
//               scrollbar-track-[#07111f]
//             "
//           >
//             <AdminUsersTable
//               users={filteredUsers}
//               nodes={nodes}
//               getNodeOwnerId={getNodeOwnerId}
//               isOnline={(node) =>
//                 isNodeOnline(node as NodeWithHeartbeat, now)
//               }
//               selectedUserId={selectedUserId}
//               onSelect={(id) =>
//                 setSelectedUserId((current) =>
//                   current === id ? null : id
//                 )
//               }
//               loading={Boolean(usersQuery.isLoading)}
//             />
//           </div>

//           <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-3 bg-gradient-to-b from-[#0c1b2d] to-transparent" />
//           <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-3 bg-gradient-to-t from-[#0c1b2d] to-transparent" />
//         </div>
//       </section>

//       {selectedUser && (
//         <section className="grid w-full min-w-0 grid-cols-1 gap-4">
//           <UserMonitoringPanel
//             user={selectedUser}
//             nodes={selectedNodes}
//             getNodeId={getNodeId}
//             isOnline={(node) =>
//               isNodeOnline(node as NodeWithHeartbeat, now)
//             }
//           />
//         </section>
//       )}

//       <p className="text-xs text-[#71869e]">
//         Node status is based on the newest available heartbeat.
//         Nodes are considered online when their last report was received
//         within 45 seconds. Status refreshes every 5 seconds.
//       </p>
//     </main>
//   );
// }


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
const ONLINE_THRESHOLD = 45_000;
const STATUS_REFRESH_INTERVAL = 5_000;

type NodeWithHeartbeat = AdminNode & Record<string, any>;

function getTimestampMilliseconds(timestamp: unknown): number | null {
  if (
    timestamp === null ||
    timestamp === undefined ||
    timestamp === ""
  ) {
    return null;
  }

  let milliseconds: number;

  if (timestamp instanceof Date) {
    milliseconds = timestamp.getTime();
  } else if (
    typeof timestamp === "number" ||
    (typeof timestamp === "string" &&
      /^\d+(\.\d+)?$/.test(timestamp.trim()))
  ) {
    const numericValue = Number(timestamp);

    milliseconds =
      numericValue < 1_000_000_000_000
        ? numericValue * 1000
        : numericValue;
  } else {
    milliseconds = new Date(String(timestamp)).getTime();
  }

  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function getNodeHeartbeat(node: NodeWithHeartbeat): number | null {
  const timestampFields = [
    "reportedAt",
    "reported_at",
    "lastReportedAt",
    "last_reported_at",
    "lastReportAt",
    "last_report_at",
    "lastReportTimestamp",
    "last_report_timestamp",
    "lastSeen",
    "last_seen",
    "lastSeenAt",
    "last_seen_at",
    "lastHeartbeat",
    "last_heartbeat",
    "lastHeartbeatAt",
    "last_heartbeat_at",
    "heartbeatAt",
    "heartbeat_at",
  ];

  const timestamps = timestampFields
    .map((field) => getTimestampMilliseconds(node[field]))
    .filter((value): value is number => value !== null);

  return timestamps.length ? Math.max(...timestamps) : null;
}

function isNodeOnline(node: NodeWithHeartbeat, now: number): boolean {
  const heartbeat = getNodeHeartbeat(node);

  if (heartbeat !== null) {
    const age = now - heartbeat;
    return age >= -5_000 && age <= ONLINE_THRESHOLD;
  }

  if (typeof node.isOnline === "boolean") {
    return node.isOnline;
  }

  if (typeof node.is_online === "boolean") {
    return node.is_online;
  }

  const rawStatus =
    node.status ??
    node.connectionStatus ??
    node.connection_status ??
    node.state ??
    node.nodeStatus ??
    node.node_status;

  const status = String(rawStatus ?? "").trim().toLowerCase();

  return ["online", "connected", "active", "up", "healthy"].includes(
    status
  );
}

export default function AdminOverview() {
  const {
    user,
    isLoading: userLoading,
    isError: userError,
  } = useUser();

  const isAdmin =
    String(user?.role ?? "").toUpperCase() === "ADMIN";

  const usersQuery = useGetAllUsersForAdmin(isAdmin);
  const nodesQuery = useGetAllNodesForAdmin(isAdmin);

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectionRestored, setSelectionRestored] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    try {
      const savedUserId = localStorage.getItem(
        SELECTED_USER_STORAGE_KEY
      );

      if (savedUserId) {
        setSelectedUserId(savedUserId);
      }
    } catch (error) {
      console.error("Could not restore selected monitoring user:", error);
    } finally {
      setSelectionRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!selectionRestored) return;

    try {
      if (selectedUserId) {
        localStorage.setItem(
          SELECTED_USER_STORAGE_KEY,
          selectedUserId
        );
      } else {
        localStorage.removeItem(SELECTED_USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Could not save selected monitoring user:", error);
    }
  }, [selectedUserId, selectionRestored]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, STATUS_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const users = (usersQuery.users ?? []) as AdminUser[];

  const nodes = (nodesQuery.nodes ?? []) as unknown as NodeWithHeartbeat[];

  const getNodeOwnerId = (node: AdminNode): string =>
    String(
      node.userId ??
        node.ownerId ??
        node.user?.id ??
        node.owner?.id ??
        ""
    ).trim();

  const getNodeId = (node: AdminNode): string =>
    String(node.nodeId ?? "").trim();

  const regularUsers = useMemo(
    () =>
      users.filter(
        (user) => String(user.role ?? "").toUpperCase() === "USER"
      ),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return regularUsers;

    return regularUsers.filter((user) =>
      [user.fullName, user.name, user.email, user.role].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [regularUsers, search]);

  const selectedUser =
    regularUsers.find(
      (user) => String(user.id) === selectedUserId
    ) ?? null;

  useEffect(() => {
    if (!selectionRestored || usersQuery.isLoading) return;

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
          getNodeOwnerId(node) === String(selectedUser.id).trim()
      )
    : [];

  // TEMPORARY DEBUGGING: verify selected user and node ownership.
  useEffect(() => {
    console.log("===== LINUXFLEET USER MAPPING =====");

    console.log("Selected User:", {
      selectedUserId,
      actualUserId: selectedUser?.id,
      name: selectedUser?.fullName || selectedUser?.name,
      email: selectedUser?.email,
    });

    console.log("All users:", regularUsers.map((item) => ({
      id: item.id,
      name: item.fullName || item.name,
      email: item.email,
    })));

    console.table(
      nodes.map((node) => ({
        nodeId: getNodeId(node),
        ownerId: getNodeOwnerId(node),
        hostname: node.hostname,
      }))
    );

    console.log(
      "Nodes passed to monitoring panel:",
      selectedNodes.map((node) => ({
        nodeId: getNodeId(node),
        ownerId: getNodeOwnerId(node),
      }))
    );

    console.log("==================================");
  }, [selectedUserId, selectedUser, regularUsers, nodes, selectedNodes]);

  const onlineCount = nodes.filter((node) =>
    isNodeOnline(node, now)
  ).length;

  const offlineCount = Math.max(0, nodes.length - onlineCount);

  async function handleRefresh() {
    if (!isAdmin || isRefreshing) return;

    setIsRefreshing(true);

    try {
      await Promise.all([
        usersQuery.refetch(),
        nodesQuery.refetch(),
      ]);

      setNow(Date.now());
    } catch (error) {
      console.error("Failed to refresh admin dashboard:", error);
    } finally {
      setIsRefreshing(false);
    }
  }

  const isLoading = Boolean(
    usersQuery.isLoading || nodesQuery.isLoading
  );

  const hasError = Boolean(
    usersQuery.isError || nodesQuery.isError
  );

  if (userLoading) {
    return (
      <main className="min-h-screen bg-[#07111f] p-6 text-[#e8f1fc]">
        <div className="rounded-xl border border-[#1b3048] bg-[#0c1b2d] p-4 text-sm text-[#8ea4bd]">
          Checking admin access...
        </div>
      </main>
    );
  }

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
      <AdminHeader
        onRefresh={handleRefresh}
        refreshing={isRefreshing || isLoading}
      />

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

      <AdminStats
        users={regularUsers.length}
        nodes={nodes.length}
        online={onlineCount}
        offline={offlineCount}
      />

      <section className="w-full min-w-0 overflow-hidden rounded-xl border border-[#1b3048] bg-[#0c1b2d] shadow-lg shadow-black/20">
        <div className="flex flex-col gap-3 border-b border-[#1b3048] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">All users</h2>
            <p className="mt-1 text-xs text-[#8ea4bd]">
              Registered users in your fleet
            </p>
            <p className="mt-1 text-xs text-[#71869e]">
              Showing {filteredUsers.length} of {regularUsers.length} users
            </p>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-[#263c55] bg-[#07111f] px-3 py-2 transition-colors focus-within:border-blue-500/60">
            <Search size={15} className="shrink-0 text-[#8ea4bd]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, role…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#71869e] sm:w-64"
            />
          </label>
        </div>

        <div className="relative w-full min-w-0">
          <div className="max-h-[520px] w-full min-w-0 overflow-x-auto overflow-y-auto overscroll-contain scroll-smooth shadow-inner scrollbar-thin scrollbar-thumb-[#263c55] scrollbar-track-[#07111f]">
            <AdminUsersTable
              users={filteredUsers}
              nodes={nodes}
              getNodeOwnerId={getNodeOwnerId}
              isOnline={(node) =>
                isNodeOnline(node as NodeWithHeartbeat, now)
              }
              selectedUserId={selectedUserId}
              onSelect={(id) =>
                setSelectedUserId((current) =>
                  current === id ? null : id
                )
              }
              loading={Boolean(usersQuery.isLoading)}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-3 bg-gradient-to-b from-[#0c1b2d] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-3 bg-gradient-to-t from-[#0c1b2d] to-transparent" />
        </div>
      </section>

      {selectedUser && (
        <section className="grid w-full min-w-0 grid-cols-1 gap-4">
          <UserMonitoringPanel
            user={selectedUser}
            nodes={selectedNodes}
            getNodeId={getNodeId}
            isOnline={(node) =>
              isNodeOnline(node as NodeWithHeartbeat, now)
            }
          />
        </section>
      )}

      <p className="text-xs text-[#71869e]">
        Node status is based on the newest available heartbeat.
        Nodes are considered online when their last report was received
        within 45 seconds. Status refreshes every 5 seconds.
      </p>
    </main>
  );
}
