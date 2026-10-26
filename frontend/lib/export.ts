import type { Campaign } from "./types";

export function campaignMarkdown(c: Campaign): string {
  const q = (s: string) => `**${s}**`;
  return [
    `# ${c.campaignTitle}`,
    ``,
    `${q("Business:")} ${c.profile.businessName} (${c.profile.location})`,
    `${q("Objective:")} ${c.brief.objective}  ·  ${q("Budget:")} ₹${c.brief.budget}  ·  ${q("Status:")} ${c.status}`,
    ``,
    `${q("Strategy:")} ${c.strategy}`,
    ``,
    `## Social posts`,
    ...c.socialPosts.flatMap((p) => [
      ``,
      `### ${p.platform}`,
      p.caption,
      `CTA: ${p.cta}`,
      p.hashtags.join(" "),
    ]),
    ``,
    `## WhatsApp / Email message`,
    c.whatsappMessage,
    ``,
    `## Headlines`,
    ...c.headlines.map((h) => `- ${h}`),
    ``,
    `## Budget plan (₹${c.brief.budget})`,
    ...(c.budgetAllocation ?? []).map(
      (a) => `- ${a.platform}: ₹${a.amount} — ${a.purpose}`
    ),
    ``,
    `## Content calendar`,
    ...c.postingSchedule.map(
      (s) => `- ${s.date ?? s.day}: ${s.asset}${s.platform ? ` (${s.platform})` : ""} — ${s.reason}`
    ),
    ``,
    `## Poster`,
    `Headline: ${c.poster?.headline} · Subline: ${c.poster?.subline} · CTA: ${c.poster?.cta}`,
    ``,
    `## Success metrics`,
    ...c.successMetrics.map((m) => `- ${m}`),
    ``,
    `## Confirm before publishing`,
    ...c.itemsToConfirm.map((i) => `- ${i}`),
  ].join("\n");
}

export function campaignCsv(c: Campaign): string {
  const cell = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [
    ["Date", "Day", "Platform", "Asset", "Why"].map(cell).join(","),
    ...c.postingSchedule.map((s) =>
      [s.date ?? s.day, s.day, s.platform ?? "", s.asset, s.reason].map(cell).join(",")
    ),
  ];
  return rows.join("\n");
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
