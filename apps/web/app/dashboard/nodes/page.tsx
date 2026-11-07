"use client";

import { useState } from "react";
import { Plus, RefreshCw, Monitor, Cpu, MemoryStick, HardDrive } from "lucide-react";
import { useGetAllNodes } from "~/hooks/api/fleetNodes";
import NodeOnboarding from "~/components/dashboard/NodeOnboarding";

export default function NodesPage() {
  const { nodes: data, isLoading, refetch } = useGetAllNodes();
  const [open, setOpen] = useState(false);
  const nodes: any[] = Array.isArray(data) ? data as any[] : (data as any)?.nodes || [];
  return <div className="dashboard-content">
    <div className="page-title-row"><div><div className="eyebrow">FLEET INVENTORY</div><h1>Nodes</h1><p>Every machine registered to your workspace.</p></div><div className="page-actions"><button className="button button-secondary" onClick={() => refetch()}><RefreshCw size={15}/> Refresh</button><button className="button button-primary" onClick={() => setOpen(true)}><Plus size={16}/> Add node</button></div></div>
    {isLoading ? <div className="page-loading"><span className="loader-ring"/></div> : nodes.length === 0 ? <section className="empty-fleet-card compact-empty"><div className="empty-device"><Monitor size={30}/></div><h2>No nodes registered yet</h2><p>Add your first Linux machine to start collecting infrastructure reports.</p><button className="button button-primary" onClick={() => setOpen(true)}><Plus size={16}/> Add your first node</button></section> :
      <section className="content-panel"><div className="panel-title-row"><div><h2>Registered machines <span className="count-badge">{nodes.length}</span></h2><p>Resource details from the latest agent reports.</p></div></div><div className="node-list">{nodes.map((node: any, i) => <article className="node-row node-row-simple" key={node.nodeId || node.node_id || i}><div className="node-avatar"><Monitor size={19}/></div><div className="node-identity"><b>{node.hostname || node.nodeId || node.node_id || "Linux node"}</b><span>{node.os || "Linux"} · {node.kernel || "Kernel information unavailable"}</span></div><span className="node-status is-online"><i/>{node.status || "Registered"}</span><div className="node-resource"><span><Cpu size={13}/> CPU cores</span><b>{node.cpuCores ?? node.cpu_cores ?? "—"}</b></div><div className="node-resource"><span><MemoryStick size={13}/> Memory</span><b>{node.memoryTotalMb ?? node.memory_total_mb ? `${node.memoryTotalMb ?? node.memory_total_mb} MB` : "—"}</b></div><div className="node-resource"><span><HardDrive size={13}/> Disk</span><b>{node.diskTotalMb ?? node.disk_total_mb ? `${node.diskTotalMb ?? node.disk_total_mb} MB` : "—"}</b></div></article>)}</div></section>}
    {open && <NodeOnboarding onClose={() => setOpen(false)}/>}
  </div>;
}
