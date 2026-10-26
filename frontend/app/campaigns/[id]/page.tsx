"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OBJECTIVE_LABELS, regenerateContent } from "@/lib/generate";
import { allocationTotal } from "@/lib/budget";
import { campaignCsv, campaignMarkdown, slugify } from "@/lib/export";
import { downloadFile, downloadPosterPng, posterSvg, svgDataUri } from "@/lib/poster";
import { api, getToken, type CampaignOne } from "@/lib/auth";
import { ROLE_LABEL, type Campaign } from "@/lib/types";

const PLATFORM_ICON: Record<string, string> = {
  Instagram: "IG",
  Facebook: "FB",
  WhatsApp: "WA",
  Email: "@",
};

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function CampaignEditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <Editor />
    </Suspense>
  );
}

function Editor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null | undefined>(undefined);
  const [canApprove, setCanApprove] = useState(false);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pendingRef = useRef<Partial<Campaign> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<CampaignOne>(`/api/campaigns/${id}`)
      .then((r) => {
        setCampaign(r.campaign);
        setCanApprove(r.canApprove);
      })
      .catch((err) => {
        if (err.status === 401) router.replace("/login");
        else setCampaign(null);
      });
  }, [id, router]);

  // one trailing-debounce PATCH per burst of edits
  function patch(p: Partial<Campaign>) {
    pendingRef.current = { ...(pendingRef.current ?? {}), ...p };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flushPatch, 700);
  }

  async function flushPatch() {
    const body = pendingRef.current;
    if (!body) return;
    pendingRef.current = null;
    setSaving(true);
    await api(`/api/campaigns/${id}`, { method: "PATCH", body }).catch(() => null);
    setSaving(false);
  }

  // flush a pending edit burst when leaving the page
  useEffect(
    () => () => {
      const body = pendingRef.current;
      if (body) api(`/api/campaigns/${id}`, { method: "PATCH", body }).catch(() => null);
    },
    [id]
  );

  if (campaign === undefined) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!campaign)
    return (
      <div className="p-10">
        <Card className="mx-auto max-w-md rounded-card">
          <CardContent className="pt-0 text-center">
            <p className="font-semibold">Campaign not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              It may not exist, or you may not have permission to see it.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  const c = campaign;

  const update = (fields: Partial<Campaign>) => {
    setCampaign({ ...c, ...fields });
    patch(fields); // edits save automatically (debounced)
  };

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const regenerate = (key: string, kind: "social" | "message" | "headline", apply: (v: string | string[]) => void) => {
    const attempt = (attempts[key] ?? 0) + 1;
    setAttempts({ ...attempts, [key]: attempt });
    apply(regenerateContent(kind, campaign, attempt));
  };

  const approve = async () => {
    await flushPatch(); // don't approve stale content
    try {
      const res = await api<CampaignOne>(`/api/campaigns/${id}/approve`, { method: "POST" });
      setCampaign(res.campaign);
      setCanApprove(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not approve");
    }
  };

  const base = slugify(c.campaignTitle) || "campaign";

  const svg = posterSvg(
    c.poster ?? { headline: c.brief.offer.slice(0, 60), subline: `${c.profile.businessName} · ${c.profile.location}`, cta: "Visit us today" },
    c.profile
  );

  return (
    <div className="px-6 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Input
            value={c.campaignTitle}
            onChange={(e) => update({ campaignTitle: e.target.value })}
            aria-label="Campaign title"
            className="h-11 w-auto min-w-56 flex-1 border-transparent bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:bg-card md:text-3xl"
          />
          <Badge variant={c.status === "approved" ? "default" : "secondary"}>
            {c.status === "approved" ? "Approved" : "Draft"}
          </Badge>
          {c.status === "approved" && c.approvedBy ? (
            <span className="text-sm text-muted-foreground">
              Approved by {c.approvedBy}
              {c.approvedRole ? ` (${ROLE_LABEL[c.approvedRole]})` : ""}
            </span>
          ) : canApprove ? (
            <Button onClick={approve} className="rounded-full">
              Approve campaign
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Awaiting approval</span>
          )}
          <Button
            onClick={() => downloadFile(campaignMarkdown(c), "text/markdown", `${base}.md`)}
            variant="outline"
            className="rounded-full"
          >
            Download summary
          </Button>
          <Button
            onClick={() => downloadFile(campaignCsv(c), "text/csv", `${base}-calendar.csv`)}
            variant="outline"
            className="rounded-full"
          >
            Calendar CSV
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {c.profile.businessName} · {saving ? "saving…" : "edits save automatically"}
          {c.creatorName ? ` · created by ${c.creatorName}` : ""}
          {c.source ? ` · generated by ${c.source === "ai" ? "AI" : "template"}` : ""}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="grid content-start gap-6">
            {c.socialPosts.map((post, i) => (
              <Card key={i} className="rounded-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span aria-hidden className="inline-flex size-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-paper">
                      {PLATFORM_ICON[post.platform] ?? "•"}
                    </span>
                    {post.platform} post
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Label htmlFor={`caption-${i}`} className="sr-only">
                    Caption
                  </Label>
                  <Textarea
                    id={`caption-${i}`}
                    rows={3}
                    value={post.caption}
                    onChange={(e) =>
                      update({
                        socialPosts: c.socialPosts.map((p, j) =>
                          j === i ? { ...p, caption: e.target.value } : p
                        ),
                      })
                    }
                  />
                  <div className="text-xs text-muted-foreground">
                    CTA: {post.cta} · {post.hashtags.join(" ")}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => copy(`post-${i}`, post.caption)}>
                      {copied === `post-${i}` ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        regenerate(`social-${i}`, "social", (v) =>
                          update({
                            socialPosts: c.socialPosts.map((p, j) =>
                              j === i ? { ...p, caption: v as string } : p
                            ),
                          })
                        )
                      }
                    >
                      Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="rounded-card">
              <CardHeader>
                <CardTitle className="text-base">WhatsApp / Email message</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Label htmlFor="message" className="sr-only">
                  Message
                </Label>
                <Textarea id="message" rows={4} value={c.whatsappMessage} onChange={(e) => update({ whatsappMessage: e.target.value })} />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => copy("message", c.whatsappMessage)}>
                    {copied === "message" ? "Copied!" : "Copy"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => regenerate("message", "message", (v) => update({ whatsappMessage: v as string }))}>
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-card">
              <CardHeader>
                <CardTitle className="text-base">Headline options</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {c.headlines.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={h}
                      aria-label={`Headline ${i + 1}`}
                      onChange={(e) =>
                        update({ headlines: c.headlines.map((x, j) => (j === i ? e.target.value : x)) })
                      }
                    />
                    <Button size="sm" variant="ghost" onClick={() => copy(`headline-${i}`, h)}>
                      {copied === `headline-${i}` ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" className="w-fit" onClick={() => regenerate("headlines", "headline", (v) => update({ headlines: v as string[] }))}>
                  Regenerate all three
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-card">
              <CardHeader>
                <CardTitle className="text-base">Campaign poster</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-[240px_1fr] sm:items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={svgDataUri(svg)}
                  alt="Campaign poster preview"
                  className="w-full max-w-[240px] rounded-card border border-border"
                />
                <div className="grid content-start gap-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Headline:</span> {c.poster?.headline}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">CTA:</span> {c.poster?.cta}
                  </p>
                  <p className="text-xs">Rendered from your template — text always comes out sharp. Uses your brand color.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => downloadPosterPng(svg, `${base}-poster.png`)} className="rounded-full">
                      Download PNG
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadFile(svg, "image/svg+xml", `${base}-poster.svg`)} className="rounded-full">
                      Download SVG
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-card">
              <CardHeader>
                <CardTitle className="text-base">Budget plan — {rupee(c.brief.budget)}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {c.budgetAllocation?.map((a, i) => (
                  <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{a.platform}</p>
                      <p className="text-xs text-muted-foreground">{a.purpose}</p>
                    </div>
                    <div className="text-xs text-muted-foreground sm:col-span-1 sm:hidden" />
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="text-sm text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min={0}
                        aria-label={`${a.platform} budget amount`}
                        className="w-24"
                        value={a.amount}
                        onChange={(e) =>
                          update({
                            budgetAllocation: c.budgetAllocation!.map((x, j) =>
                              j === i ? { ...x, amount: Number(e.target.value) || 0 } : x
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
                {c.budgetAllocation && (
                  <p className={"text-sm font-medium " + (allocationTotal(c.budgetAllocation) === c.brief.budget ? "text-emerald-deep" : "text-destructive")}>
                    {allocationTotal(c.budgetAllocation) === c.brief.budget
                      ? `✓ Allocates exactly ${rupee(c.brief.budget)}`
                      : `⚠ Sums to ${rupee(allocationTotal(c.budgetAllocation))}, not ${rupee(c.brief.budget)} — adjust the amounts`}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-card">
              <CardHeader>
                <CardTitle className="text-base">Content calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Platform</th>
                      <th className="pb-2 pr-4 font-medium">Asset</th>
                      <th className="pb-2 font-medium">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.postingSchedule.map((s, i) => (
                      <tr key={i} className="border-t border-border align-top">
                        <td className="py-2 pr-4 whitespace-nowrap font-medium">
                          {s.date
                            ? new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                            : s.day}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary">{s.platform ?? "—"}</Badge>
                        </td>
                        <td className="py-2 pr-4">{s.asset}</td>
                        <td className="py-2 text-muted-foreground">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="rounded-card">
              <CardHeader>
                <CardTitle className="text-base">How to measure success</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm">
                  {c.successMetrics?.map((m, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-deep" />
                      {m}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-card border-emerald-deep/40">
              <CardHeader>
                <CardTitle className="text-base">Confirm before publishing</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm">
                  {c.itemsToConfirm.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-deep" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <aside className="hidden content-start gap-6 lg:sticky lg:top-8 lg:grid">
            <Card className="rounded-card">
              <CardHeader>
                <CardTitle className="text-sm">Campaign brief</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <p><span className="font-medium">Objective:</span> {OBJECTIVE_LABELS[c.brief.objective]}</p>
                <p><span className="font-medium">Offer:</span> {c.brief.offer}</p>
                <p><span className="font-medium">Budget:</span> {rupee(c.brief.budget)}</p>
                <p><span className="font-medium">Tone:</span> {c.brief.tone} · {c.brief.language}</p>
                <p><span className="font-medium">Duration:</span> {c.brief.durationDays} days</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {c.brief.platforms.map((p) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-card">
              <CardHeader>
                <CardTitle className="text-sm">Strategy</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {c.strategy}
              </CardContent>
            </Card>
            <Card className="rounded-card">
              <CardHeader>
                <CardTitle className="text-sm">Business context</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">{c.profile.businessName}</span> · {c.profile.category}</p>
                <p>{c.profile.description || "No description yet — add one in Brand profile."}</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
