import { Users, Server, Wifi, WifiOff } from "lucide-react";

type AdminStatsProps = {
  users: number;
  nodes: number;
  online: number;
  offline: number;
};

export default function AdminStats({
  users,
  nodes,
  online,
  offline,
}: AdminStatsProps) {
  const items = [
    {
      label: "Registered users",
      value: users,
      icon: Users,
    },
    {
      label: "Total nodes",
      value: nodes,
      icon: Server,
    },
    {
      label: "Online nodes",
      value: online,
      icon: Wifi,
    },
    {
      label: "Offline nodes",
      value: offline,
      icon: WifiOff,
    },
  ];
 
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <article
          key={label}
          className="rounded-xl border border-[#1b3048] bg-[#0c1b2d] p-4"
        >
          <div className="flex items-center justify-between text-sm text-[#8ea4bd]">
            <span>{label}</span>
            <Icon size={17} />
          </div>

          <div className="mt-3 text-3xl font-semibold tabular-nums">
            {value}
          </div>
        </article>
      ))}
    </section>
  );
}