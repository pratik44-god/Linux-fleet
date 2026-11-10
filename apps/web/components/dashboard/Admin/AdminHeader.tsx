import { Activity, RefreshCw } from "lucide-react";

export default function AdminHeader({ onRefresh, refreshing }: { onRefresh: () => void; refreshing: boolean }) {
  return <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div><div className="mb-2 flex items-center gap-2 text-sm text-blue-400"><Activity size={16}/><span>Linux Fleet · Administration</span></div><h1 className="text-2xl font-semibold tracking-tight">Admin control room</h1><p className="mt-1 text-sm text-[#8ea4bd]">Manage users and monitor their registered Linux nodes.</p></div>
    <button type="button" onClick={onRefresh} disabled={refreshing} className="flex items-center justify-center gap-2 rounded-lg border border-[#263c55] bg-[#0c1b2d] px-4 py-2 text-sm transition hover:bg-[#142943] disabled:opacity-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""}/>Refresh data</button>
  </header>;
}
 