# LocalLift AI — Design Direction

## Reference interpretation

The attached `demo design.mp4` was treated as visual reference material, not as product instructions. Its strongest cues are:

- Black and off-white editorial surfaces
- A vivid emerald/teal glow used as an accent, not a full-page wash
- Oversized, tightly set display typography
- Softly rounded cards and large framed panels
- Strong contrast between dark hero sections and bright content sections
- Product storytelling through large, scrollable visual moments
- Minimal navigation and focused CTAs

Adapt these cues for a practical dashboard. Do not reproduce the reference brand, copy, or imagery.

## Product visual concept

LocalLift should feel like a calm, high-confidence marketing studio for a busy owner: dark shell, warm white workspace, emerald progress signals, and large cards that make AI output feel tangible.

Suggested product name treatment: `LocalLift` in a clean wordmark with a small emerald upward spark. Use an actual logo asset when one is available; do not substitute an emoji or arbitrary icon.

## Design tokens

```text
Ink:          #070908
Surface:      #111513
Paper:        #F4F5F0
Muted paper:  #D9DED7
Emerald:      #20E59A
Deep emerald: #0B5C43
Text dark:    #101513
Text light:   #F4F5F0
Border dark:  rgba(255,255,255,.12)
Border light: rgba(16,21,19,.12)
Radius:       20px cards, 28px feature panels, 999px pills
Shadow:       0 24px 80px rgba(0,0,0,.22)
```

Use one sans-serif family throughout. Prefer a clean geometric or neo-grotesk family with strong weights. Keep body copy compact and readable; use display type only for hero statements and section titles.

## Core layout

### App shell

- Dark left sidebar with LocalLift identity, workspace switcher, New campaign CTA, Dashboard, Campaigns, Brand profile, and Settings.
- Bright workspace canvas with a compact top bar.
- Emerald glow reserved for active states, primary CTA, progress, and important AI moments.

### Dashboard

- Top: greeting and “Create campaign” button.
- First row: campaigns created, approved assets, and next recommended action.
- Main feature: large “Create your next campaign” panel with a short brief preview.
- Lower area: recent campaign cards with status pills and asset counts.

### Campaign editor

- Header: campaign name, business name, status, and approval action.
- Main column: editable asset cards.
- Right rail: campaign brief and “AI context” summary.
- Each asset card includes platform label, copy, Copy button, Regenerate button, and editable state.

### Campaign result moment

Use a bright paper section with a large title such as “Your campaign is ready.” Place the primary generated post in a wide card, then show the remaining assets as a neat stack. This is the main demo screenshot.

## Interaction and motion

- Use short 180–240ms transitions for buttons, pills, and card expansion.
- Animate generation as a progress sequence: “Understanding offer” → “Writing content” → “Preparing campaign.”
- Use a subtle emerald glow around the active generation state.
- Avoid heavy parallax or complex scroll effects in the MVP; reliability matters more than spectacle.

## Accessibility

- Maintain readable contrast on dark and light surfaces.
- Never use emerald as the only status signal; pair it with text.
- Provide visible focus states.
- Use real buttons and labels, not clickable divs.
- Keep the generation progress understandable without animation.

## Design prompt for Superdesign

Create a new responsive web dashboard for LocalLift AI, an affordable AI marketing copilot for local businesses. Design the dashboard, campaign creation form, and campaign editor as one coherent product flow. Use the attached demo’s visual cues: black and off-white editorial surfaces, vivid emerald glow accents, oversized modern sans-serif typography, rounded framed panels, restrained navigation, and high contrast. Adapt those cues into a practical SaaS dashboard; do not copy the reference brand, words, or imagery. The primary flow is business profile → campaign brief → AI generation → editable assets → approval. Include a dark sidebar, bright workspace, campaign cards, a large “Your campaign is ready” result state, status pills, copy/regenerate actions, and a seven-day campaign schedule. Make the design polished enough for a hackathon demo but feasible to implement in Next.js and Tailwind in four hours. Use ONLY the fonts, colors, spacing, and component styles defined in this design system. Do not introduce unrelated fonts, colors, gradients, or visual styles.

