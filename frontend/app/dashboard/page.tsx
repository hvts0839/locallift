"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OBJECTIVE_LABELS } from "@/lib/generate";
import { api, clearSession, getUser, type CampaignList, type NotificationList } from "@/lib/auth";
import { ROLE_LABEL, type Campaign, type OrgNotification, type OrgUser } from "@/lib/types";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<OrgUser | null | undefined>(undefined);
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [notifications, setNotifications] = useState<OrgNotification[] | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u) {
      router.replace("/login");
      return;
    }
    api<CampaignList>("/api/campaigns")
      .then((r) => setCampaigns(r.campaigns))
      .catch((err) => {
        if (err.status === 401) {
          clearSession();
          router.replace("/login");
        } else setCampaigns([]);
      });
    api<NotificationList>("/api/notifications")
      .then((r) => {
        setNotifications(r.notifications);
        setUnread(r.unread);
      })
      .catch(() => setNotifications(null));
  }, [router]);

  async function markAllRead() {
    await api("/api/notifications/read", { method: "POST" }).catch(() => null);
    setNotifications((ns) => ns?.map((n) => ({ ...n, read: true })) ?? null);
    setUnread(0);
  }

  if (user === undefined) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!user) return null; // redirecting to /login

  const approved = campaigns?.filter((c) => c.status === "approved").length ?? 0;
  const mine = campaigns?.filter((c) => c.creatorId === user.id) ?? [];
  const draft = mine.find((c) => c.status === "draft");
  const nextAction = !mine.length
    ? "Create your first campaign"
    : draft
      ? `Finish "${draft.campaignTitle}"`
      : "Create your next campaign";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {user.companyName ? `Welcome back, ${user.name}` : `Welcome, ${user.name}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.companyName} · {ROLE_LABEL[user.role]}
            {user.managerName ? ` · reports to ${user.managerName}` : ""}
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/campaigns/new">Create campaign</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <Card className="rounded-card">
          <CardContent>
            <p className="text-3xl font-semibold">{campaigns?.length ?? 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">Campaigns you can see</p>
          </CardContent>
        </Card>
        <Card className="rounded-card">
          <CardContent>
            <p className="text-3xl font-semibold">{approved}</p>
            <p className="mt-1 text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="rounded-card">
          <CardContent>
            <p className="text-sm font-medium leading-snug">{nextAction}</p>
            <p className="mt-1 text-sm text-muted-foreground">Next recommended action</p>
          </CardContent>
        </Card>
      </div>

      {notifications && notifications.length > 0 && (
        <Card className="mt-6 rounded-card border-emerald-deep/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Notifications{unread > 0 ? ` — ${unread} new` : ""}
            </CardTitle>
            {unread > 0 && (
              <Button size="sm" variant="outline" onClick={markAllRead} className="rounded-full">
                Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid gap-2">
            {notifications.slice(0, 6).map((n) => (
              <div
                key={n.id}
                className={
                  "flex items-start gap-3 rounded-card px-3 py-2 text-sm " +
                  (n.read ? "bg-muted/40 text-muted-foreground" : "bg-emerald/10")
                }
              >
                <span
                  aria-hidden
                  className={
                    "mt-1.5 size-2 shrink-0 rounded-full " +
                    (n.read ? "bg-border" : "bg-emerald shadow-[0_0_8px_rgba(32,229,154,0.8)]")
                  }
                />
                <p className="flex-1">
                  {n.message}{" "}
                  <Link href={`/campaigns/${n.campaignId}`} className="text-emerald-deep hover:underline">
                    Open
                  </Link>
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Link
        href="/campaigns/new"
        className="mt-6 block rounded-panel bg-surface/75 p-8 text-paper shadow-panel backdrop-blur-xl transition-opacity duration-200 hover:opacity-95 md:p-12"
      >
        <p className="text-xs uppercase tracking-widest text-paper/60">Next campaign</p>
        <p className="mt-3 max-w-md text-2xl font-semibold tracking-tight md:text-4xl">
          Create your next campaign
        </p>
        <p className="mt-2 max-w-md text-sm text-paper/70">
          One short brief is all it takes: the offer, the audience, the tone.
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald px-5 py-2 text-sm font-medium text-ink">
          Start a brief
          <span aria-hidden>→</span>
        </span>
      </Link>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">Campaigns</h2>
      {campaigns === null ? (
        <p className="mt-5 text-sm text-muted-foreground">Loading…</p>
      ) : campaigns.length === 0 ? (
        <Card className="mt-5 rounded-card">
          <CardContent className="text-sm text-muted-foreground">
            No campaigns yet. Your first one takes about a minute.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="rounded-card">
              <CardContent className="grid gap-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-snug">{c.campaignTitle}</p>
                  <Badge variant={c.status === "approved" ? "default" : "secondary"}>
                    {c.status === "approved" ? "Approved" : "Draft"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {OBJECTIVE_LABELS[c.brief.objective]} ·{" "}
                  {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
                <p className="text-xs text-muted-foreground">
                  by {c.creatorName ?? "someone"}
                  {c.creatorRole ? ` (${ROLE_LABEL[c.creatorRole]})` : ""}
                  {c.status === "approved" && c.approvedBy
                    ? ` · approved by ${c.approvedBy}`
                    : ""}
                </p>
                <Button asChild size="sm" variant="outline" className="w-fit rounded-full">
                  <Link href={`/campaigns/${c.id}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
