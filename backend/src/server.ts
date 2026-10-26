import express from "express";
import cors from "cors";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { allocateBudget } from "./budget";
import { generateCampaign } from "./generate";
import { getDb, hashPassword, saveDb, verifyPassword } from "./store";
import { issueToken, userFromRequest } from "./auth";
import { ROLE_LABEL, ROLE_RANK, type Company, type GeneratedCampaign, type Notification, type Role, type StoredCampaign, type User } from "./types";

const PORT = Number(process.env.PORT ?? 4000);
const PROMPT_VERSION = "v1-structured";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const app = express();
app.use(cors());
app.use(express.json({ limit: "64kb" })); // truncate oversized input

// ---------- validation ----------

const profileSchema = z.object({
  businessName: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  location: z.string().min(1).max(120),
  description: z.string().max(600).default(""),
  targetAudience: z.string().min(1).max(160),
  brandTone: z.string().min(1).max(40),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const briefSchema = z.object({
  objective: z.enum(["awareness", "offer", "event", "launch", "repeat"]),
  offer: z.string().min(3).max(300),
  budget: z.number().int().min(100).max(100000),
  startDate: z.string().optional(),
  durationDays: z.number().int().min(1).max(30),
  platforms: z.array(z.enum(["Instagram", "Facebook", "WhatsApp", "Email"])).min(1),
  tone: z.string().min(1).max(40),
  language: z.enum(["English", "Hindi", "Hinglish"]),
});

const campaignSchema = z.object({
  campaign_title: z.string().min(1),
  strategy: z.string().min(1),
  social_posts: z
    .array(
      z.object({
        platform: z.string(),
        caption: z.string(),
        cta: z.string(),
        hashtags: z.array(z.string()),
      })
    )
    .length(3),
  whatsapp_message: z.string().min(1),
  headlines: z.array(z.string()).length(3),
  poster: z.object({
    headline: z.string().max(60),
    subline: z.string(),
    cta: z.string(),
  }),
  posting_schedule: z
    .array(
      z.object({
        day: z.string(),
        asset: z.string(),
        platform: z.string(),
        reason: z.string(),
      })
    )
    .length(7),
  success_metrics: z.array(z.string()).min(2).max(4),
  items_to_confirm: z.array(z.string()).min(1).max(5),
});

// Strict structured output — reject anything that doesn't match, per §5
const RESPONSE_JSON_SCHEMA = {
  name: "campaign",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "campaign_title",
      "strategy",
      "social_posts",
      "whatsapp_message",
      "headlines",
      "poster",
      "posting_schedule",
      "success_metrics",
      "items_to_confirm",
    ],
    properties: {
      campaign_title: { type: "string" },
      strategy: { type: "string" },
      social_posts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["platform", "caption", "cta", "hashtags"],
          properties: {
            platform: { type: "string" },
            caption: { type: "string" },
            cta: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
          },
        },
      },
      whatsapp_message: { type: "string" },
      headlines: { type: "array", items: { type: "string" } },
      poster: {
        type: "object",
        additionalProperties: false,
        required: ["headline", "subline", "cta"],
        properties: { headline: { type: "string" }, subline: { type: "string" }, cta: { type: "string" } },
      },
      posting_schedule: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["day", "asset", "platform", "reason"],
          properties: {
            day: { type: "string" },
            asset: { type: "string" },
            platform: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
      success_metrics: { type: "array", items: { type: "string" } },
      items_to_confirm: { type: "array", items: { type: "string" } },
    },
  },
};

const SYSTEM_PROMPT = `You are the campaign engine of LocalLift AI, an affordable marketing copilot for local businesses in India.

Hard rules:
- Use ONLY the facts the owner supplied. Never invent prices, discounts, dates, reviews, awards, certifications, guarantees, or results. If a needed fact is missing, put it in items_to_confirm.
- Write in the requested content language: simple, warm, local. Short sentences a busy owner can read at a glance.
- The business is small and local: realistic, low-budget, no agency jargon.
- Return ONLY JSON matching the provided schema: exactly 3 social_posts, exactly 3 headlines, exactly 7 posting_schedule rows (day "Day 1".."Day 7"), 2-4 success_metrics that the owner can count without any tool (e.g. walk-ins mentioning the campaign), 1-5 items_to_confirm.`;

const datesFor = (startIso?: string): string[] => {
  const base = startIso ? new Date(startIso) : new Date();
  const start = isNaN(base.getTime()) ? new Date() : base;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
};

async function aiGenerate(
  profile: z.infer<typeof profileSchema>,
  brief: z.infer<typeof briefSchema>
): Promise<GeneratedCampaign> {
  const userPrompt = [
    "Business facts:",
    `- Name: ${profile.businessName}`,
    `- Category: ${profile.category}`,
    `- Location: ${profile.location}`,
    `- What it does: ${profile.description || "(not given)"}`,
    `- Target audience: ${profile.targetAudience}`,
    `- Brand tone: ${profile.brandTone}`,
    "",
    "Campaign brief:",
    `- Objective: ${brief.objective}`,
    `- Offer/message: ${brief.offer}`,
    `- Platforms: ${brief.platforms.join(", ")}`,
    `- Tone: ${brief.tone}`,
    `- Content language: ${brief.language}`,
    `- Duration: ${brief.durationDays} days`,
    `- Budget: ₹${brief.budget} (allocation is computed by the system, do not invent it)`,
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_schema", json_schema: RESPONSE_JSON_SCHEMA },
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");
  const parsed = campaignSchema.parse(JSON.parse(content)); // invalid JSON/shape → fallback path

  const dates = datesFor(brief.startDate);
  return {
    campaignTitle: parsed.campaign_title,
    strategy: parsed.strategy,
    socialPosts: parsed.social_posts,
    whatsappMessage: parsed.whatsapp_message,
    headlines: parsed.headlines,
    // budget is rule-based, never AI: guaranteed to sum exactly to the budget
    budgetAllocation: allocateBudget(brief.budget, brief.platforms),
    postingSchedule: parsed.posting_schedule.map((row, i) => ({
      day: row.day,
      date: dates[i],
      platform: row.platform,
      asset: row.asset,
      reason: row.reason,
    })),
    poster: parsed.poster,
    successMetrics: parsed.success_metrics,
    itemsToConfirm: parsed.items_to_confirm,
  };
}

// ---------- auth ----------

const signupSchema = z.object({
  companyName: z.string().min(1).max(80),
  name: z.string().min(1).max(60),
  email: z.string().email().max(120),
  password: z.string().min(6).max(100),
  role: z.enum(["employee", "team_lead", "manager", "head"]).optional(),
  managerEmail: z.string().email().max(120).optional(),
});

app.post("/api/auth/signup", (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid signup", details: parsed.error.issues });
  const { companyName, name, email, password, role, managerEmail } = parsed.data;
  const db = getDb();
  const emailNorm = email.toLowerCase().trim();
  if (db.users.some((u) => u.email === emailNorm))
    return res.status(400).json({ error: "This email is already registered" });

  const company = db.companies.find(
    (co) => co.name.toLowerCase().trim() === companyName.toLowerCase().trim()
  );
  let user: User;
  const now = new Date().toISOString();
  if (!company) {
    // new company: the first account is its Head / CMO
    const co: Company = { id: randomUUID(), name: companyName.trim(), createdAt: now };
    db.companies.push(co);
    user = {
      id: randomUUID(),
      companyId: co.id,
      name: name.trim(),
      email: emailNorm,
      passwordHash: hashPassword(password),
      role: "head",
      managerId: null,
      createdAt: now,
    };
  } else {
    let managerId: string | null = null;
    if (managerEmail) {
      const manager = db.users.find(
        (u) => u.companyId === company.id && u.email === managerEmail.toLowerCase().trim()
      );
      if (!manager)
        return res.status(400).json({ error: "Manager email not found in this company" });
      managerId = manager.id;
    }
    user = {
      id: randomUUID(),
      companyId: company.id,
      name: name.trim(),
      email: emailNorm,
      passwordHash: hashPassword(password),
      role: role ?? "employee",
      managerId,
      createdAt: now,
    };
  }
  db.users.push(user);
  saveDb();
  res.json({ token: issueToken(user.id), user: publicUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post("/api/auth/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid login" });
  const user = getDb().users.find((u) => u.email === parsed.data.email.toLowerCase().trim());
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash))
    return res.status(401).json({ error: "Wrong email or password" });
  res.json({ token: issueToken(user.id), user: publicUser(user) });
});

function publicUser(user: User) {
  const db = getDb();
  const company = db.companies.find((co) => co.id === user.companyId);
  const manager = user.managerId ? db.users.find((u) => u.id === user.managerId) : null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyName: company?.name ?? "",
    managerName: manager?.name ?? null,
  };
}

app.get("/api/me", (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  res.json({ user: publicUser(user) });
});

// ---------- organization helpers ----------

const rank = (u: { role: Role }) => ROLE_RANK[u.role];

// everyone whose manager chain passes through this user (their subtree)
function downline(userId: string): string[] {
  const db = getDb();
  const out: string[] = [];
  const walk = (managerId: string) => {
    for (const u of db.users) {
      if (u.managerId === managerId && !out.includes(u.id)) {
        out.push(u.id);
        walk(u.id);
      }
    }
  };
  walk(userId);
  return out;
}

function canSeeCampaign(user: User, campaign: StoredCampaign): boolean {
  if (campaign.companyId !== user.companyId) return false;
  if (campaign.creatorId === user.id) return true;
  if (rank(user) >= 2) return true; // head/manager see the whole company
  return downline(user.id).includes(campaign.creatorId); // team lead sees their interns
}

function canApproveCampaign(user: User, campaign: StoredCampaign): boolean {
  if (campaign.status === "approved") return false;
  if (campaign.companyId !== user.companyId) return false;
  const creator = getDb().users.find((u) => u.id === campaign.creatorId);
  if (!creator) return false;
  if (user.role === "head") return true;
  if (rank(user) > rank(creator)) return true;
  // managers may approve their own campaigns
  return user.id === campaign.creatorId && rank(user) >= 2;
}

function notify(userIds: string[], type: Notification["type"], message: string, campaignId: string) {
  const db = getDb();
  const now = new Date().toISOString();
  for (const userId of new Set(userIds)) {
    db.notifications.push({
      id: randomUUID(),
      userId,
      type,
      message,
      campaignId,
      read: false,
      createdAt: now,
    });
  }
}

// ---------- campaigns ----------

const createCampaignSchema = z.object({
  profile: profileSchema,
  brief: briefSchema,
  generated: z.any(), // already validated/normalized by the generate flow
});

app.post("/api/campaigns", (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid campaign", details: parsed.error.issues });

  const db = getDb();
  const campaign: StoredCampaign = {
    ...parsed.data.generated,
    id: randomUUID(),
    companyId: user.companyId,
    creatorId: user.id,
    creatorName: user.name,
    creatorRole: user.role,
    status: "draft",
    createdAt: new Date().toISOString(),
    // stored so the editor can render brief + brand context
    profile: parsed.data.profile,
    brief: parsed.data.brief,
  };
  db.campaigns.push(campaign);

  if (user.managerId) {
    const manager = db.users.find((u) => u.id === user.managerId);
    if (manager)
      notify(
        [manager.id],
        "created",
        `New campaign "${campaign.campaignTitle}" created by ${user.name} (${ROLE_LABEL[user.role]}) — awaiting your review.`,
        campaign.id
      );
  }
  saveDb();
  res.json({ campaign });
});

app.get("/api/campaigns", (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  const list = getDb()
    .campaigns.filter((c) => canSeeCampaign(user, c))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ campaigns: list });
});

app.get("/api/campaigns/:id", (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  const campaign = getDb().campaigns.find((c) => c.id === req.params.id);
  if (!campaign || !canSeeCampaign(user, campaign))
    return res.status(404).json({ error: "Campaign not found" });
  res.json({ campaign, canApprove: canApproveCampaign(user, campaign) });
});

const patchSchema = z.object({
  campaignTitle: z.string().min(1).max(120).optional(),
  strategy: z.string().max(1200).optional(),
  socialPosts: z
    .array(
      z.object({
        platform: z.string(),
        caption: z.string().max(3000),
        cta: z.string().max(200),
        hashtags: z.array(z.string().max(60)).max(15),
      })
    )
    .max(6)
    .optional(),
  whatsappMessage: z.string().max(3000).optional(),
  headlines: z.array(z.string().max(200)).max(6).optional(),
  budgetAllocation: z
    .array(z.object({ platform: z.string(), amount: z.number(), purpose: z.string() }))
    .optional(),
  postingSchedule: z
    .array(
      z.object({
        day: z.string(),
        date: z.string().optional(),
        platform: z.string().optional(),
        asset: z.string(),
        reason: z.string(),
      })
    )
    .optional(),
  poster: z
    .object({ headline: z.string().max(80), subline: z.string().max(120), cta: z.string().max(80) })
    .optional(),
  successMetrics: z.array(z.string().max(300)).max(6).optional(),
  itemsToConfirm: z.array(z.string().max(300)).max(8).optional(),
});

app.patch("/api/campaigns/:id", (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  const db = getDb();
  const campaign = db.campaigns.find((c) => c.id === req.params.id);
  if (!campaign || !canSeeCampaign(user, campaign))
    return res.status(404).json({ error: "Campaign not found" });
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid edit", details: parsed.error.issues });
  // status only changes through the approve endpoint
  Object.assign(campaign, parsed.data, { status: campaign.status });
  saveDb();
  res.json({ campaign });
});

app.post("/api/campaigns/:id/approve", (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  const db = getDb();
  const campaign = db.campaigns.find((c) => c.id === req.params.id);
  if (!campaign || !canSeeCampaign(user, campaign))
    return res.status(404).json({ error: "Campaign not found" });
  if (!canApproveCampaign(user, campaign))
    return res.status(403).json({
      error: `Only ${campaign.creatorRole === "employee" ? "your team lead or above" : "a senior member"} can approve this campaign`,
    });

  campaign.status = "approved";
  campaign.approvedBy = user.name;
  campaign.approvedRole = user.role;
  campaign.approvedAt = new Date().toISOString();

  // everyone below the approver (plus the creator) learns the campaign is approved
  const recipients = [campaign.creatorId, ...downline(user.id)].filter((id) => id !== user.id);
  notify(
    recipients,
    "approved",
    `"${campaign.campaignTitle}" was approved by ${user.name} (${ROLE_LABEL[user.role]}). Assets are ready to use.`,
    campaign.id
  );
  saveDb();
  res.json({ campaign });
});

// ---------- notifications ----------

app.get("/api/notifications", (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  const list = getDb()
    .notifications.filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ notifications: list, unread: list.filter((n) => !n.read).length });
});

app.post("/api/notifications/read", (req, res) => {
  const user = userFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  for (const n of getDb().notifications) if (n.userId === user.id) n.read = true;
  saveDb();
  res.json({ ok: true });
});

// ---------- generation (unchanged) ----------

app.get("/health", (_req, res) => {
  res.json({ ok: true, promptVersion: PROMPT_VERSION, aiEnabled: Boolean(process.env.OPENAI_API_KEY) });
});

const bodySchema = z.object({ profile: profileSchema, brief: briefSchema });

app.post("/api/campaigns/generate", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid campaign brief", details: parsed.error.issues });
  }
  const { profile, brief } = parsed.data;
  let source: "ai" | "template" = "ai";
  let generated;
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("no OPENAI_API_KEY");
    generated = await aiGenerate(profile, brief);
  } catch (err) {
    source = "template";
    console.warn(`[campaigns/generate] ${PROMPT_VERSION} falling back to template:`, err);
    generated = generateCampaign({ profile: { ...profile, id: "api" }, brief });
  }
  console.log(
    `[generation_logs] prompt=${PROMPT_VERSION} model=${source === "ai" ? MODEL : "template"} source=${source} at=${new Date().toISOString()}`
  );
  res.json({ source, campaign: generated });
});

app.listen(PORT, () => {
  console.log(
    `LocalLift backend listening on http://localhost:${PORT} (ai: ${Boolean(process.env.OPENAI_API_KEY)})`
  );
});
