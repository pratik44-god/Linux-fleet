export type AdminUser = {
  id: string | number;
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  emailVerified?: boolean | null;
};

export type AdminNode = {
  nodeStatus: string | null | undefined;
  state: string | null | undefined;
  lastHeartbeat: any;
  id?: string | number;
  nodeId?: string | number;
  userId?: string | number | null;
  ownerId?: string | number | null;
  user?: { id?: string | number; fullName?: string; email?: string } | null;
  owner?: { id?: string | number; fullName?: string; email?: string } | null;
  hostname?: string | null;
  nodeName?: string | null;
  node_name?: string | null;
  os?: string | null;
  operatingSystem?: string | null;
  status?: string | null;
  connectionStatus?: string | null;
  lastReportTimestamp?: string | number | null;
  last_report_timestamp?: string | number | null;
  lastSeen?: string | number | null;
  updatedAt?: string | Date | null;
};
