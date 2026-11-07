"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "~/components/dashboard/DashboardShell";
import { useIsUserLoggedIn } from "~/hooks/api/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isUserLoggedIn, isLoading } = useIsUserLoggedIn();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && !isUserLoggedIn) router.replace("/login");
  }, [isLoading, isUserLoggedIn, router]);

  if (isLoading) return <div className="screen-loader"><span className="loader-ring"/><p>Preparing your workspace…</p></div>;
  if (!isUserLoggedIn) return <div className="screen-loader"><span className="loader-ring"/><p>Redirecting to sign in…</p></div>;
  return <DashboardShell>{children}</DashboardShell>;
}
