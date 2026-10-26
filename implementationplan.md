# LocalLift AI — Implementation Plan

Builds on `PRD.md`, `DESIGN.md`, `TECHNICAL-ARCHITECTURE.md`, and `WORKFLOW.md`.

## What we're building (one sentence)

Brief form → `/api/campaigns/generate` → editable campaign (3 posts, 1 WhatsApp message, 3 headlines, 7-day schedule, items-to-confirm) → approve + download. Nothing else.

Assumptions: Next.js + TypeScript + Tailwind + shadcn/ui, Supabase (Auth/Postgres/Storage), OpenAI API via server route, deployed on Vercel. Four-hour window, four-person team.

---

## Phase 0 — Setup (hour 0–1)

1. Scaffold Next.js (App Router, TypeScript, Tailwind) and add shadcn/ui.
2. Supabase project: create the 4 tables from `TECHNICAL-ARCHITECTURE.md` §4 (`profiles`, `campaigns`, `campaign_assets`, `generation_logs`) plus row-level security policies for row ownership.
3. Set env vars (`SUPABASE_*`, `OPENAI_API_KEY` — server-only) and deploy a placeholder to Vercel now so deploy risk is gone by hour 1.
4. Put `DESIGN.md` tokens (emerald `#20E59A`, dark shell + paper surfaces, radii, shadow) into `globals.css`.

**Checkpoint A:** deployed placeholder + database round-trip works.

## Phase 1 — Generation spine (hour 1–2) — protect this at all costs

5. `POST /api/campaigns/generate`: Zod-validate the brief → build prompt → OpenAI call with the JSON contract from §5 → validate the response → return JSON.
6. System prompt = §6 guardrails: only owner-supplied facts, no invented prices/reviews/awards/certifications, simple local language, flag missing details in `items_to_confirm`.
7. Fallback: a seeded demo campaign JSON returned on any AI/API failure.

**Checkpoint B:** curl to the route returns valid campaign JSON.

## Phase 2 — Core UI flow (hour 2–3)

8. `/onboarding` — profile form (name, category, location, description, target audience, brand tone; logo/primary color optional) → persists to `profiles`.
9. `/campaigns/new` — brief form (objective, offer, duration, platforms, tone/language) → calls the generate route → writes `campaigns` + `campaign_assets`.
10. `/campaigns/[id]` — editor: asset cards (platform label, copy, Copy / Regenerate / inline edit), right rail with brief + strategy, Approve button, download summary.
11. `/dashboard` — campaign cards with status pills, timestamp, objective, next-action hint.

**Checkpoint C:** full Sunrise Café demo flow works locally, end to end.

## Phase 3 — Polish & demo (hour 3–4)

12. Landing page ("Your next local campaign, ready in 60 seconds") with the dark hero + emerald accent.
13. Generation progress sequence: "Understanding offer" → "Writing content" → "Preparing campaign".
14. Branded promo card / downloadable campaign summary.
15. Seed the Sunrise Café campaign for the live demo; rehearse the narration from `WORKFLOW.md`; test the fallback state and mobile layout once.

---

## Who does what

| Person | Scope |
|---|---|
| **P1** | Frontend flow: routes 8–11, forms, cards, responsive layout |
| **P2** | Backend + AI: generate route, prompt, validation, RLS, deployment |
| **P3** | Design system, promo card, landing page, demo assets |
| **P4** | QA: happy path, fallback, mobile, docs, pitch backup |

## Build order & fallback ladder

Vertical slice order: `Profile → Brief → Generate → Edit → Approve → Download`

If we fall behind, cut in this order: **auth → persistence → download**. Never cut the generate → edit → approve spine. Keep the seeded Sunrise Café campaign as the absolute backup for the final demo.

## Risks

- Generic output → require location, audience, offer, tone in the brief.
- Invented claims → guardrail rules + `items_to_confirm` before approval.
- AI/API failure → seeded fallback campaign + cached last success.
- Scope creep → no social publishing, analytics, or subscriptions in the MVP.
