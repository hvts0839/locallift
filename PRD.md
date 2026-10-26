# LocalLift AI — Product Requirements Document

## 1. Product summary

LocalLift AI is an affordable AI marketing copilot for local businesses. A business owner enters a short brief and receives a ready-to-review campaign containing social posts, a WhatsApp/email message, calls to action, hashtags, a posting plan, and a branded promotional card.

Tagline: **Turn a local offer into a campaign in 60 seconds.**

This plan is optimized for a four-hour hackathon build using AI assistants and Antigravity. The product should demonstrate one excellent vertical slice instead of many incomplete integrations.

## 2. Problem

Local businesses frequently have no dedicated marketing employee. They lack the time, confidence, and budget to consistently create useful content. Existing marketing tools are often designed for larger teams, while generic AI writers produce copy without enough local context or business safeguards.

## 3. Target user

The primary user is an owner or staff member of a café, salon, gym, tuition center, boutique, restaurant, or local service business.

Job to be done: “Help me turn today’s offer into content I can publish today, without hiring an agency.”

## 4. MVP goals

- Create a business profile in under two minutes.
- Generate a complete campaign from one short brief.
- Let the owner edit, regenerate, approve, and copy each asset.
- Make the AI output locally relevant, truthful, and easy to understand.
- Produce a polished demo that works without third-party social publishing integrations.

## 5. MVP features

### Business profile

- Business name, category, location, description
- Target audience and brand tone
- Optional logo, primary color, and contact details

### Campaign brief

- Objective: awareness, offer, event, launch, or repeat visits
- Offer or message
- Duration
- Platforms: Instagram, Facebook, WhatsApp, email
- Tone and language

### Campaign generation

- Campaign title and short strategy
- Three social captions
- One WhatsApp/email message
- Three headline options
- Calls to action and local hashtags
- Seven-day suggested schedule
- Missing details that the owner should confirm

### Review and approval

- Inline editing
- Regenerate one asset
- Copy content
- Approve campaign
- Download a simple campaign summary

### Dashboard

- Draft, approved, and archived campaigns
- “Next action” recommendation
- Campaign creation timestamp and objective

## 6. Out of scope for the hackathon

Direct social posting, paid ad buying, analytics integrations, subscriptions, CRM, multi-user permissions, native mobile apps, advanced image editing, custom model training, and automated customer messaging.

## 7. Success metrics

- Time from profile creation to first generated campaign: under two minutes.
- One complete campaign generated from one brief.
- At least 80% of generated assets are editable and copyable.
- Demo user approves a campaign without needing technical help.

## 8. Demo scenario

Sunrise Café in Indiranagar, Bengaluru is promoting a weekday breakfast combo before 11 a.m. The owner enters the offer, audience, and tone. LocalLift AI produces three social posts, a WhatsApp message, headlines, a schedule, and a branded card. The presenter edits one caption, approves the campaign, and downloads the package.

The core judging moment is:

> One short business brief → a complete, locally relevant campaign in seconds.

## 9. Risks

- Generic output: require location, audience, offer, and tone in the brief.
- Invented claims: forbid unverified prices, guarantees, awards, reviews, and certifications.
- AI/API failure: seed a fallback demo campaign and cache the last successful response.
- Scope creep: keep social publishing and analytics out of the MVP.
- Low trust: keep owner approval before any content is treated as publishable.

