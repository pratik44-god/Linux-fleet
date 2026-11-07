"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  BellRing,
  ChevronDown,
  CircleHelp,
  Command,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Settings2,
  ShieldCheck,
  X,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useState } from "react";

import { useLogout, useUser } from "~/hooks/api/auth";

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/nodes",
    label: "Nodes",
    icon: Monitor,
  },
  {
    href: "/dashboard/alerts",
    label: "Alerts",
    icon: BellRing,
  },
];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { user } = useUser();
  const { logoutAsync } = useLogout();

  /**
   * Sign out after confirmation.
   */
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logoutAsync();

      setLogoutConfirmOpen(false);
      setProfileOpen(false);

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      setLoggingOut(false);
    }
  }

  /**
   * Open the sign-out confirmation dialog.
   */
  function openLogoutConfirmation() {
    setProfileOpen(false);
    setLogoutConfirmOpen(true);
  }

  /**
   * Add another account.
   *
   * Navigates to the login page where another account
   * can authenticate.
   */
 /**
 * Add another account.
 * Clear the current session before navigating to login.
 */
async function handleAddAccount() {
  if (loggingOut) return;

  setProfileOpen(false);
  setLoggingOut(true);

  try {
    await logoutAsync();

    router.replace("/login");
    router.refresh();
  } catch (error) {
    console.error("Could not switch accounts:", error);
    setLoggingOut(false);
  }
}

  const displayName =
    user?.fullName || user?.email || "My account";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="app-frame">
      {/* Top navigation bar */}
      <header className="app-topbar">
        <button
          className="mobile-menu-button icon-button"
          onClick={() =>
            setMobileOpen((previous) => !previous)
          }
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>

        <Link
          href="/dashboard"
          className="brand-lockup topbar-brand"
        >
          <span className="brand-symbol">
            <Activity size={18} />
          </span>

          <span>
            linux<span className="brand-accent">fleet</span>
          </span>
        </Link>

        <div className="topbar-context">
          <span className="context-divider" />
          <span>Workspace</span>
          <ChevronDown size={14} />
        </div>

        <div className="topbar-right">
          <span className="topbar-status">
            <i />
            API connected
          </span>

          <button
            className="icon-button"
            aria-label="Help"
          >
            <CircleHelp size={18} />
          </button>

          <Link
            className="icon-button notification-trigger"
            aria-label="Notifications"
            href="/dashboard/alerts"
          >
            <Bell size={18} />
            <i />
          </Link>

          {/* Account dropdown trigger */}
          <button
            type="button"
            onClick={() =>
              setProfileOpen((previous) => !previous)
            }
            aria-expanded={profileOpen}
            aria-label="Open account menu"
            className="topbar-user cursor-pointer"
          >
            <span className="avatar">{initial}</span>
            <span>{displayName}</span>
          </button>
        </div>
      </header>

      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar ${
          mobileOpen ? "sidebar-visible" : ""
        }`}
      >
        {/* Workspace information */}
        <div className="sidebar-workspace">
          <div className="workspace-icon">
            <Command size={17} />
          </div>

          <div>
            <b>Personal workspace</b>
            <span>Linux infrastructure</span>
          </div>

          <ChevronDown size={14} />
        </div>

        {/* Main navigation */}
        <div className="sidebar-label">
          WORKSPACE
        </div>

        <nav className="sidebar-navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            const active = item.exact
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${
                  active ? "active" : ""
                }`}
              >
                <Icon size={18} />

                <span>{item.label}</span>

                {item.label === "Nodes" && (
                  <span className="nav-arrow">↗</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Preferences */}
        <div className="sidebar-label sidebar-label-spaced">
          PREFERENCES
        </div>

        <nav className="sidebar-navigation">
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            className={`sidebar-link ${
              pathname.startsWith("/dashboard/settings")
                ? "active"
                : ""
            }`}
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Sidebar bottom */}
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">
              <ShieldCheck size={17} />
            </div>

            <b>Your fleet, in focus.</b>

            <p>
              Connect a Linux machine to start collecting real
              infrastructure metrics.
            </p>

            <Link
              href="/dashboard/nodes"
              onClick={() => setMobileOpen(false)}
            >
              Connect a node <span>→</span>
            </Link>
          </div>

          {/* Profile menu */}
          <div className="profile-area">
            <button
              type="button"
              className="profile-menu-button"
              onClick={() =>
                setProfileOpen((previous) => !previous)
              }
              aria-expanded={profileOpen}
            >
              <span className="avatar">{initial}</span>

              <span className="profile-copy">
                <b>{displayName}</b>
                <small>
                  {user?.email || "Workspace member"}
                </small>
              </span>

              <ChevronDown
                size={15}
                className={`transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Account dropdown */}
            {profileOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close account menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setProfileOpen(false)}
                />

                <div className="profile-popover relative z-50">
                  {/* Current account */}
                  <div className="flex items-center gap-3 border-b border-[#263c55] px-3 py-3">
                    <span className="avatar">
                      {initial}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {displayName}
                      </p>

                      <p className="truncate text-xs text-[#8ea4bd]">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Add another account */}
                  <button
                    type="button"
                    onClick={handleAddAccount}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-[#c8d8e9] transition-colors hover:bg-[#172a40] hover:text-white"
                  >
                    <UserPlus size={16} />

                    <span>Add another account</span>
                  </button>

                  {/* Sign out */}
                  <button
                    type="button"
                    onClick={openLogoutConfirmation}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
                  >
                    <LogOut size={16} />

                    <span>Log out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main page content */}
      <main className="app-main">{children}</main>

      {/* Sign out confirmation dialog */}
      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!loggingOut) {
              setLogoutConfirmOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            className="w-full max-w-md rounded-2xl border border-[#263c55] bg-[#0c1b2d] p-6 shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Dialog icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
              <LogOut size={21} />
            </div>

            {/* Dialog title */}
            <h2
              id="logout-dialog-title"
              className="text-lg font-semibold text-white"
            >
              Log out of LinuxFleet?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#8ea4bd]">
              Are you sure you want to sign out of your account?

              <span className="mt-1 block">
                You will need to sign in again to access your
                dashboard.
              </span>
            </p>

            {/* Dialog actions */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-lg border border-[#263c55] px-4 py-2.5 text-sm font-medium text-[#c8d8e9] transition-colors hover:bg-[#172a40] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? (
                  <>
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                    Loging out...
                  </>
                ) : (
                  <>
                    <LogOut size={15} />
                    Log out
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
