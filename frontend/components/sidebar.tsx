"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "cn";
import { api, clearSession, getToken, getUser, type NotificationList } from "@/lib/auth";
import { ROLE_LABEL, type OrgUser } from "@/lib/types";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/campaigns/new", label: "New campaign" },
  { href: "/onboarding", label: "Brand profile" },
];

function useUnread(pathname: string, signedIn: boolean) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    // refresh on every route change so approvals show up without a reload
    if (!signedIn) return setUnread(0);
    api<NotificationList>("/api/notifications")
      .then((r) => setUnread(r.unread))
      .catch(() => setUnread(0));
  }, [pathname, signedIn]);
  return unread;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // null on first render, read from localStorage after hydration — no SSR mismatch
  const [user, setUser] = useState<OrgUser | null>(null);
  const unread = useUnread(pathname, Boolean(user));

  useEffect(() => setUser(getUser()), []);

  function logout() {
    clearSession();
    setUser(null);
    router.push("/login");
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 border-r border-white/10 bg-surface/75 p-5 text-paper backdrop-blur-xl md:flex">
      <Link href="/" className="flex items-center gap-2 px-1">
        <span className="text-lg font-semibold tracking-tight">LocalLift</span>
        <span
          aria-hidden
          className="size-2 rounded-full bg-emerald shadow-[0_0_12px_rgba(32,229,154,0.8)]"
        />
      </Link>
      <nav aria-label="Main" className="flex flex-col gap-1">
        {links.map((l) => {
          const active =
            pathname === l.href || (l.href === "/dashboard" && pathname.startsWith("/campaigns"));
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors duration-200",
                active ? "bg-white/10 text-emerald" : "text-paper/70 hover:bg-white/5 hover:text-paper"
              )}
            >
              {l.label}
              {l.href === "/dashboard" && unread > 0 && (
                <span className="rounded-full bg-emerald px-2 py-0.5 text-xs font-semibold text-ink">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {user ? (
        <div className="mt-auto grid gap-2 rounded-panel bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald text-sm font-bold text-ink"
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-paper/60">{user.companyName}</p>
            </div>
          </div>
          <p className="w-fit rounded-full bg-white/10 px-2 py-0.5 text-xs text-paper/80">
            {ROLE_LABEL[user.role]}
          </p>
          <button
            onClick={logout}
            className="justify-self-start rounded-full px-2 py-1 text-xs text-paper/60 transition-colors duration-200 hover:text-paper"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="mt-auto grid gap-2 rounded-panel bg-white/5 p-3">
          <p className="text-xs text-paper/60">Not signed in</p>
          <Link href="/login" className="text-sm text-emerald hover:underline">
            Sign in →
          </Link>
        </div>
      )}
    </aside>
  );
}

export function MobileBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<OrgUser | null>(null);
  const unread = useUnread(pathname, Boolean(user));
  useEffect(() => setUser(getUser()), []);

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-surface/75 px-4 py-3 text-paper backdrop-blur-xl md:hidden">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        LocalLift
        <span
          aria-hidden
          className="size-2 rounded-full bg-emerald shadow-[0_0_12px_rgba(32,229,154,0.8)]"
        />
      </Link>
      <nav aria-label="Main" className="flex items-center gap-3 text-sm text-paper/70">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-paper">
            {l.label.split(" ")[0]}
          </Link>
        ))}
        {unread > 0 && (
          <span className="rounded-full bg-emerald px-2 py-0.5 text-xs font-semibold text-ink">{unread}</span>
        )}
        {user ? (
          <button
            onClick={() => {
              clearSession();
              setUser(null);
              router.push("/login");
            }}
            className="hover:text-paper"
          >
            Out
          </button>
        ) : (
          <Link href="/login" className="text-emerald">
            Sign in
          </Link>
        )}
      </nav>
    </div>
  );
}
