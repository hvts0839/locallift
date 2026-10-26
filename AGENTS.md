<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LocalLift AI Project Rules

Rules for AI assistants (OpenCode, Antigravity, etc.) working in this repo. Read `PRD.md`, `DESIGN.md`, `TECHNICAL-ARCHITECTURE.md`, `WORKFLOW.md`, and `implementationplan.md` before making changes. When a rule here conflicts with a doc, the doc wins on product detail; this file wins on workflow discipline.

## Project

LocalLift AI: an affordable AI marketing copilot for local businesses. One short brief → a complete, locally relevant campaign in seconds (3 social posts, 1 WhatsApp/email message, 3 headlines, CTA + hashtags, 7-day schedule, items to confirm). Demo: Sunrise Café, Indiranagar, Bengaluru — weekday breakfast combo before 11 a.m.

## Stack — do not change

- Frontend: Next.js (App Router) + React + TypeScript, Tailwind + shadcn/ui, deployed on Vercel — lives in `frontend/`
- Backend: separate Node.js + Express API service in TypeScript — lives in `backend/`, port 4000 (validation, AI call, budget rules)
- AI: OpenAI API via chat completions with strict JSON schema, called only from the backend; the key never reaches the browser
- Database: Supabase (PostgreSQL) — schema in `supabase/schema.sql`
- Shared contracts: `frontend/lib/types.ts` and `backend/src/types.ts` are twins — keep them in sync
- Never add a dependency without explicit approval

## Scope rules

- Build only the MVP vertical slice: `Profile → Brief → Generate → Edit → Approve → Download`
- Out of scope, never implement: direct social posting, ad buying, analytics integrations, subscriptions, CRM, multi-user permissions, native apps, custom model training
- If time is lost, cut in this order: auth → persistence → download. Never cut generate → edit → approve
- Keep the seeded Sunrise Café demo campaign working at all times

## AI generation rules

- All model calls happen in the backend service (`backend/src/server.ts`, `POST /api/campaigns/generate`). The browser must never see or hold the provider API key
- The route returns only the JSON contract in `TECHNICAL-ARCHITECTURE.md` §5. Validate the brief with Zod before calling the model, and validate the model's output before using it. Reject/truncate oversized input
- Prompt guardrails (§6): use only facts the owner supplied; never invent prices, reviews, awards, certifications, guarantees, or results; simple language with local context; put missing prices/dates/contacts into `items_to_confirm`
- Every asset is a draft until the owner approves. Never auto-publish anything
- On AI failure or invalid JSON: return the seeded fallback campaign and show a recoverable error. Cache the last successful response
- Regenerate applies to a single asset, not the whole campaign

## Data & security

- Four tables exactly as defined in §4: `profiles`, `campaigns`, `campaign_assets`, `generation_logs`
- Row-level security on every table; users can only read/write their own rows
- Log prompt version and generation timestamp in `generation_logs`

## Design rules

- Use only the tokens in `DESIGN.md`: the defined palette (Ink `#070908`, Paper `#F4F5F0`, Emerald `#20E59A`, etc.), radii, and one sans-serif family. Do not introduce unrelated colors or fonts
- Glassmorphism is the house style (user directive, 2026-10): surfaces are translucent with backdrop blur — cards use `bg-card` (translucent white) + `backdrop-blur-xl` + `rounded-card` (20px), buttons are always `rounded-full` pills, dark panels use `bg-surface/75` + `backdrop-blur-xl`. The body carries fixed emerald ambient glows so the glass reads. Do not switch surfaces back to solid fills
- Dark sidebar shell + bright workspace canvas. Emerald glow only for active states, primary CTA, and progress — never as the only status signal (pair it with text)
- Real buttons and labels, visible focus states, 180–240ms transitions, no heavy parallax
- Generation progress must be understandable without animation

## Run

- `npm run dev` at the repo root starts **both** services (frontend :3000 + backend :4000) and stops them together on Ctrl+C
- `npm run dev:web` / `npm run dev:api` start one service alone; `npm run install:all` installs both; `npm run check` typechecks both

## Code conventions

- Use the routes defined in §3; do not invent new top-level routes
- Small focused components; colocate them with their route
- Zod for all input validation at trust boundaries
- Comment only the why, in one line

## Verification — after every change

1. Run the app and verify the Sunrise Café flow visually: profile → brief → generate → edit → approve
2. Check copy, per-asset regenerate, and the fallback error path still work
3. Do not claim a feature is done until its phase checkpoint passes: **A** = deployed placeholder + DB round-trip, **B** = curl to generate returns valid JSON, **C** = end-to-end demo works locally
