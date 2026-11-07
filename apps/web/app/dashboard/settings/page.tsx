"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useLogout } from "~/hooks/api/auth";
import {
  UserRound,
  Mail,
  ShieldCheck,
  Settings2,
  Building2,
  CheckCircle2,
  Loader2,
  LogOut,
  X,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { logoutAsync } = useLogout();

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutAsync();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Could not sign out:", error);
      setLoggingOut(false);
    }
  }

  const accountDetails = [
    {
      label: "Full name",
      value: user?.fullName || "Not provided",
      icon: UserRound,
    },
    {
      label: "Email address",
      value: user?.email || "Not provided",
      icon: Mail,
    },
    {
      label: "Account role",
      value: user?.role || "Member",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="dashboard-content space-y-8">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="eyebrow">WORKSPACE PREFERENCES</div>
          <h1>Settings</h1>
          <p>Your account information and workspace preferences.</p>
        </div>

        <button
          type="button"
          onClick={() => setLogoutConfirmOpen(true)}
          disabled={loggingOut}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>

      {/* Settings layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        {/* Account information */}
        <section className="content-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <UserRound size={20} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Account information
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Details associated with your signed-in account.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              Loading account information...
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {accountDetails.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 px-6 py-5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-white">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Workspace preferences */}
        <section className="content-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <Settings2 size={20} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Workspace
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your current workspace access.
              </p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-start gap-3">
              <Building2 size={18} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  LinuxFleet Workspace
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Your account is connected to this workspace.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Workspace access
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Based on your account role
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                Active
              </span>
            </div>

            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Workspace settings are currently managed by your LinuxFleet
              configuration.
            </p>
          </div>
        </section>
      </div>

      {/* Account security */}
      <section className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900/50 dark:bg-blue-950/20 sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <ShieldCheck size={20} />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Account security
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Your account access is controlled by your assigned role. Contact
            your administrator if you need permission changes.
          </p>
        </div>
      </section>

      {/* Sign-out confirmation dialog */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <LogOut size={20} />
              </div>

              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                disabled={loggingOut}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <h2
              id="logout-dialog-title"
              className="mt-5 text-lg font-semibold text-slate-900 dark:text-white"
            >
              Sign out of LinuxFleet?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              You will need to sign in again to access your dashboard.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                disabled={loggingOut}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut size={16} />
                    Sign out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}