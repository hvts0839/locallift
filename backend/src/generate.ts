import type { BusinessProfile, CampaignBrief, GeneratedCampaign, Objective, ScheduleItem, SocialPost } from "./types";
import { allocateBudget } from "./budget.js";

// shortcut: template-based local generation standing in for the AI route; the API
// route (app/api/campaigns/generate) uses this exact function as its failure fallback,
// so the demo never breaks and the shape stays identical.
export const OBJECTIVE_LABELS: Record<Objective, string> = {
  awareness: "Awareness",
  offer: "Special offer",
  event: "Event",
  launch: "Launch",
  repeat: "Repeat visits",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface CampaignInput {
  profile: BusinessProfile;
  brief: CampaignBrief;
}

const VARS = (c: CampaignInput) => {
  const name = c.profile.businessName?.trim() || "your business";
  const place = c.profile.location?.trim() || "your neighbourhood";
  const audience = c.profile.targetAudience?.trim() || "locals nearby";
  const cat = c.profile.category?.trim().toLowerCase() || "local";
  const offer = c.brief.offer?.trim() || "today's special";
  const city = place.split(",")[0]?.trim() || place;
  return { name, place, audience, cat, offer, city };
};

// Per-language copy. The owner's facts only — no invented prices, dates or claims.
function copyFor(lang: string, v: ReturnType<typeof VARS>) {
  if (lang === "Hindi") {
    return {
      captions: [
        `बड़ी खबर, ${v.place}! ${v.name} में ${v.offer}। आइए, अपने दोस्त को भी साथ लाइए।`,
        `${v.audience} के लिए बना: ${v.offer}। जो आपको ${v.name} में पसंद है, आज उसके साथ थोड़ा और।`,
        `${v.offer} — अब ${v.name}, ${v.place} में। आज ही पधारें।`,
      ],
      message: `नमस्ते! ${v.name} (${v.place}) से — हम इन दिनों ${v.offer} चला रहे हैं। इस मैसेज का जवाब दें या सीधे पधारें। मिलते हैं!`,
      headlines: [
        `${v.offer} — ${v.audience} के लिए`,
        `${v.city} का अपना ${v.cat} ठिकाना`,
        `${v.name}: ${v.offer}, पास ही`,
      ],
    };
  }
  if (lang === "Hinglish") {
    return {
      captions: [
        `Big news, ${v.place}! ${v.name} pe ${v.offer} — aaj hi aaiye, apne dost ko bhi le aaiye.`,
        `${cap(v.audience)} ke liye: ${v.offer}. Jo aapko ${v.name} me pasand hai, aaj uske saath thoda extra.`,
        `${cap(v.offer)} — ab ${v.name}, ${v.place} me. Jaldi kijiye!`,
      ],
      message: `Hi! ${v.name} (${v.place}) se — ${v.offer} chal raha hai abhi. Reply kijiye ya seedha walk-in kijiye. Milte hain!`,
      headlines: [
        `${cap(v.offer)} — ${v.audience} ke liye`,
        `${v.city} me aapka ${v.cat} moment`,
        `${v.name}: ${v.offer}, bas aapke paas`,
      ],
    };
  }
  return {
    captions: [
      `Big news, ${v.place}! ${v.name} is bringing you ${v.offer}. Drop by, say hi, and bring a friend who needs to hear about it.`,
      `Made for ${v.audience}: ${v.offer}. Everything you already like about ${v.name}, with a little extra today.`,
      `${cap(v.offer)} — now at ${v.name}, ${v.place}. Swing by and make the most of it.`,
    ],
    message: `Hi! A quick one from ${v.name} (${v.place}) — we are running ${v.offer} right now. Perfect if you are around ${v.city}. Reply to this message or walk in and mention it at the counter. See you soon!`,
    headlines: [
      `${cap(v.offer)}, made for ${v.audience}`,
      `Your ${v.cat} moment in ${v.city}`,
      `${v.name}: ${v.offer}, right around the corner`,
    ],
  };
}

const campaignDates = (startIso?: string): string[] => {
  const base = startIso ? new Date(startIso) : new Date();
  const start = isNaN(base.getTime()) ? new Date() : base;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
};

export function generateCampaign(c: CampaignInput): GeneratedCampaign {
  const v = VARS(c);
  const copy = copyFor(c.brief.language, v);
  const slug = (s: string) => "#" + s.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "");
  const hashtags = [slug(v.name), slug(v.city), slug(v.cat)];
  const [p1, p2, p3] = c.brief.platforms;
  const dates = campaignDates(c.brief.startDate);

  const socialPosts: SocialPost[] = [
    {
      platform: p1 ?? "Instagram",
      caption: copy.captions[0],
      cta: "Visit us this week",
      hashtags,
    },
    {
      platform: p2 ?? p1 ?? "Instagram",
      caption: copy.captions[1],
      cta: "Come and see us",
      hashtags,
    },
    {
      platform: p3 ?? p1 ?? "Facebook",
      caption: copy.captions[2],
      cta: "Drop in today",
      hashtags,
    },
  ];

  const dayPlan: [string, string, string][] = [
    [`Announcement post — ${p1 ?? "Instagram"}`, p1 ?? "Instagram", "Introduce the offer while it is fresh"],
    [`Story or status — ${p2 ?? p1 ?? "WhatsApp"}`, p2 ?? p1 ?? "WhatsApp", "Remind people without flooding their feed"],
    [`Audience post — ${p3 ?? p1 ?? "Instagram"}`, p3 ?? p1 ?? "Instagram", `Speak directly to ${v.audience}`],
    ["Direct message or status", "WhatsApp", "Reach regulars where they already reply"],
    [`Photo post — ${p1 ?? "Instagram"}`, p1 ?? "Instagram", "Show the product, not just the words"],
    ["Last-call post", p1 ?? "Instagram", "Convert the people still deciding"],
    ["Thank-you and recap", p2 ?? p1 ?? "WhatsApp", "Close the loop and set up the next campaign"],
  ];

  const postingSchedule: ScheduleItem[] = dayPlan.map(([asset, platform, reason], i) => ({
    day: `Day ${i + 1}`,
    date: dates[i],
    platform,
    asset,
    reason,
  }));

  return {
    campaignTitle: `${v.name} — ${OBJECTIVE_LABELS[c.brief.objective].toLowerCase()}`,
    strategy: `Reach ${v.audience} in ${v.place} with ${c.brief.tone.toLowerCase()} copy about ${v.offer}. Post in the first half of the window, follow up with a direct-message push on ${c.brief.platforms.join(", ")}, and confirm the missing details before publishing.`,
    socialPosts,
    whatsappMessage: copy.message,
    headlines: copy.headlines,
    budgetAllocation: allocateBudget(c.brief.budget, c.brief.platforms),
    postingSchedule,
    poster: {
      headline: cap(v.offer).slice(0, 60),
      subline: `${v.name} · ${v.place}`,
      cta: "Visit us today",
    },
    successMetrics: [
      "Walk-ins or orders that mention the campaign",
      "Replies or forwards of the WhatsApp message",
      "Instagram profile visits and saves during the window",
    ],
    // Honest by design: the generator never invents these, the owner confirms them
    itemsToConfirm: [
      "Exact price of the offer (never invented)",
      "The end date or last day of the offer",
      "Your best contact — WhatsApp number, phone, or booking link",
    ],
  };
}

// Regenerates a single asset in place; attempt count picks the next variant
export function regenerateContent(
  kind: "social" | "message" | "headline",
  campaign: CampaignInput,
  attempt: number
): string | string[] {
  const v = VARS(campaign);

  if (kind === "social") {
    return [
      `${cap(v.offer)} — today's reason to visit ${v.name}. Come hungry, leave happy.`,
      `${cap(v.audience)}, this one is for you: ${v.offer} at ${v.name}. Whether it is your first visit or your fiftieth, it lands.`,
      `${v.name} update: ${v.offer} is on. Bring someone who has not been in yet.`,
    ][attempt % 3];
  }
  if (kind === "message") {
    return [
      `${v.name} here — ${v.offer} is live at ${v.place}. Walk in and mention this message, or reply and we will keep one aside for you. See you soon!`,
      `Do not miss it: ${v.offer} at ${v.name}, ${v.place}. Reply YES and we will have it ready when you arrive.`,
    ][attempt % 2];
  }
  const pool = [
    `${cap(v.offer)} — on now at ${v.name}`,
    `The ${v.cat} pick you were looking for, in ${v.place}`,
    `${v.name} has a new reason to visit`,
    `${cap(v.offer)}: simple, local, worth the walk`,
    `This week at ${v.name}: ${v.offer}`,
    `A small change to your ${v.cat} routine, starting today`,
  ];
  return pool.slice((attempt % 2) * 3, (attempt % 2) * 3 + 3);
}
