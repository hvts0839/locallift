import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/types";

const steps = [
  {
    n: "1",
    title: "Describe your business",
    text: "Name, category, location, and who you serve. Two minutes, once.",
  },
  {
    n: "2",
    title: "Share today's offer",
    text: "One short brief: the message, the audience, the tone. No jargon.",
  },
  {
    n: "3",
    title: "Review, approve, use",
    text: "Edit any asset, confirm the facts, and a senior member approves.",
  },
];

const assets = [
  { title: "3 social posts", text: "Caption, CTA and hashtags — ready to paste.", tag: "IG · FB" },
  { title: "WhatsApp / email message", text: "One warm broadcast for your regulars.", tag: "Free reach" },
  { title: "3 headline options", text: "For posters, banners and status updates.", tag: "Pick one" },
  { title: "Campaign poster", text: "Sharp PNG or SVG, in your brand color.", tag: "Download" },
  { title: "Budget plan", text: "Where every rupee goes — sums exactly.", tag: "₹ rules" },
  { title: "7-day calendar", text: "What to post each day, and why.", tag: "Dated" },
];

const roles = [
  { role: "head" as const, text: "Sees and approves everything in the company." },
  { role: "manager" as const, text: "Approves anyone below, runs their own campaigns." },
  { role: "team_lead" as const, text: "Guides their interns, approves their drafts." },
  { role: "employee" as const, text: "Creates campaigns — a senior member signs off." },
];

const kinds = [
  "Cafés",
  "Salons",
  "Gyms",
  "Bakeries",
  "Tuition centres",
  "Clinics",
  "Boutiques",
  "Cloud kitchens",
  "Bookstores",
  "Pet groomers",
];

export default function Landing() {
  return (
    <div>
      <section className="border-b border-white/10 bg-ink/85 px-6 py-20 text-paper backdrop-blur-xl md:px-16 md:py-28">
        <p className="mb-6 inline-block rounded-full border border-white/15 px-3 py-1 text-xs text-paper/70">
          For cafés, salons, gyms, and every local business
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
          Your next local campaign, <span className="text-emerald">ready in 60 seconds.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/70 md:text-lg">
          LocalLift turns your offer into posts, messages, headlines, and a week-long
          plan — no marketing team, no agency retainer. Your whole team reviews it before anything ships.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/login">Create my campaign</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/20 bg-transparent text-paper hover:bg-white/10 hover:text-paper"
          >
            <Link href="#how">See how it works</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24">
        <p className="text-sm font-medium text-emerald-deep">What you get</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-4xl">
          One brief in. Everything out.
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <div
              key={a.title}
              className="rounded-card border border-border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
            >
              <p className="text-xs font-medium uppercase tracking-widest text-emerald-deep">{a.tag}</p>
              <h3 className="mt-3 text-lg font-semibold leading-snug">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-border bg-paper/60 px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
            Three steps. One campaign.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-card border border-border bg-card p-6 shadow-sm"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-emerald-deep text-sm font-semibold text-paper">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24">
        <p className="text-sm font-medium text-emerald-deep">Built for teams</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-4xl">
          Your org chart does the approvals.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Connect your team under your company — Head / CMO, Manager, Team Lead, Employee —
          and campaigns flow up for sign-off. When someone approves, everyone below hears about it.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r, i) => (
            <div
              key={r.role}
              className="relative rounded-card border border-border bg-card p-5 shadow-sm"
            >
              {i < roles.length - 1 && (
                <span
                  aria-hidden
                  className="absolute -right-2.5 top-1/2 z-10 hidden size-5 items-center justify-center rounded-full border border-border bg-card text-[10px] text-emerald-deep lg:flex"
                >
                  →
                </span>
              )}
              <h3 className="text-sm font-semibold">{ROLE_LABEL[r.role]}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-paper/60 px-6 py-14 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-lg font-semibold tracking-tight md:text-xl">Made for the shop down the street</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {kinds.map((k) => (
              <span
                key={k}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24">
        <div className="rounded-panel bg-surface/75 p-8 text-paper shadow-panel backdrop-blur-xl md:p-12">
          <p className="text-xs uppercase tracking-widest text-paper/60">Try it now</p>
          <p className="mt-3 max-w-lg text-2xl font-semibold tracking-tight md:text-4xl">
            Walk in as the Sunrise Café team
          </p>
          <p className="mt-2 max-w-lg text-sm text-paper/70">
            A seeded demo org: Rohit (intern) creates, Meera (team lead) approves,
            Priya (Head / CMO) sees it all. Password: <span className="text-emerald">demo1234</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["priya", "arjun", "meera", "rohit"].map((u) => (
              <span key={u} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-paper/80">
                {u}@sunrise.demo
              </span>
            ))}
          </div>
          <Button asChild size="lg" className="mt-8 rounded-full">
            <Link href="/login">Open the demo</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground md:px-16">
        LocalLift AI — a hackathon build. Everything is a draft until your team approves; nothing auto-publishes.
      </footer>
    </div>
  );
}
