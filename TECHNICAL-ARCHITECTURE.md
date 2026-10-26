# LocalLift AI — Technical Architecture and Workflow

## 1. Recommended stack

- Next.js, React, and TypeScript for the web app
- Tailwind CSS and shadcn/ui for fast, consistent interface work
- Supabase Auth, PostgreSQL, and Storage
- OpenAI API through a server-side route
- Vercel for deployment
- Antigravity for AI-assisted implementation, refactoring, and test generation

## 2. System architecture

```text
Browser
  ↓
Next.js dashboard
  ↓
Server route: /api/campaigns/generate
  ├─ Auth/session check
  ├─ Zod input validation
  ├─ Prompt builder
  ├─ AI request with JSON schema
  ├─ Output validation and safety checks
  └─ Supabase persistence
       ├─ Auth
       ├─ PostgreSQL
       └─ Storage for logo/card assets
```

Keep the AI request server-side. The browser should never receive the provider API key.

## 3. Suggested routes

```text
/                         Landing page
/onboarding               Business profile
/campaigns/new            Campaign brief
/campaigns/[id]           Campaign editor and approval
/dashboard                Campaign list and status
/api/campaigns/generate   Server-side generation endpoint
/api/campaigns/[id]       Save and update campaign
```

## 4. Data model

### profiles

`id`, `user_id`, `business_name`, `category`, `location`, `description`, `target_audience`, `brand_tone`, `logo_url`, `primary_color`, `created_at`

### campaigns

`id`, `profile_id`, `title`, `objective`, `offer`, `start_date`, `end_date`, `status`, `created_at`

### campaign_assets

`id`, `campaign_id`, `asset_type`, `platform`, `content`, `headline`, `call_to_action`, `status`, `created_at`

### generation_logs

`id`, `campaign_id`, `prompt_version`, `model`, `created_at`

Use row-level ownership checks so a user can only read or update their own profiles, campaigns, and assets.

## 5. AI contract

The generation endpoint accepts a validated campaign brief and returns:

```json
{
  "campaign_title": "string",
  "strategy": "string",
  "social_posts": [{
    "platform": "string",
    "caption": "string",
    "cta": "string",
    "hashtags": ["string"]
  }],
  "whatsapp_message": "string",
  "headlines": ["string"],
  "posting_schedule": [{"day": "string", "asset": "string", "reason": "string"}],
  "items_to_confirm": ["string"]
}
```

Reject invalid JSON, truncate oversized inputs, and show a recoverable error with a demo fallback if generation fails.

## 6. Prompt and guardrail rules

System-level constraints:

- Use only information supplied by the business owner.
- Do not invent prices, reviews, awards, certifications, guarantees, or results.
- Use simple language and local context.
- Flag missing dates, prices, contact details, or availability for confirmation.
- Return only the requested JSON structure.

Product-level constraints:

- Treat every result as a draft until approved.
- Never auto-publish content in the MVP.
- Add generation limits per user/session.
- Log prompt version and generation timestamp.

## 7. Four-hour implementation plan

### Hour 0–1: Foundation

- Create the Next.js app and visual shell.
- Set up Supabase and environment variables.
- Implement the profile form and sample demo data.

### Hour 1–2: Generation path

- Build the campaign brief form.
- Add the server-side generation route.
- Validate the structured AI response.

### Hour 2–3: Review experience

- Add campaign asset cards.
- Add editing, copy, regenerate, and approve actions.
- Save campaign and asset records.

### Hour 3–4: Polish and demo

- Add dashboard status cards and branded promo card.
- Test the end-to-end scenario.
- Deploy and rehearse the pitch.

## 8. Team split

### Person 1: Product and frontend

Routes, forms, dashboard, editor, responsive layout, and visual polish.

### Person 2: Backend and AI

Supabase schema, API route, prompt, validation, guardrails, and deployment configuration.

### Person 3: Design and demo

Visual system, sample data, promo card, interaction details, and pitch flow.

### Person 4: QA and integration

Happy-path testing, fallback states, mobile checks, documentation, and presentation backup.

## 9. Build order and fallback strategy

Build the vertical slice in this order:

```text
Profile → Brief → Generate → Edit → Approve → Download
```

If time is lost, preserve the generated campaign and editor. Remove authentication, database persistence, and download before removing the core generation flow. Keep a seeded Sunrise Café campaign for the final demo.

