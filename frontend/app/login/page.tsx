"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, getToken, setSession } from "@/lib/auth";
import { ROLE_LABEL, type OrgUser, type Role } from "@/lib/types";

const ROLES: Role[] = ["employee", "team_lead", "manager", "head"];

// One-click demo org logins (seeded in the backend on first run)
const DEMO: { email: string; name: string; role: Role }[] = [
  { email: "priya@sunrise.demo", name: "Priya", role: "head" },
  { email: "arjun@sunrise.demo", name: "Arjun", role: "manager" },
  { email: "meera@sunrise.demo", name: "Meera", role: "team_lead" },
  { email: "rohit@sunrise.demo", name: "Rohit", role: "employee" },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({
    email: "",
    password: "",
    companyName: "",
    name: "",
    role: "employee" as Role,
    managerEmail: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  async function auth(path: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ token: string; user: OrgUser }>(path, { method: "POST", body });
      setSession(res.token, res.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signin")
      auth("/api/auth/login", { email: form.email, password: form.password });
    else
      auth("/api/auth/signup", {
        companyName: form.companyName,
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        managerEmail: form.managerEmail || undefined,
      });
  }

  const field = "grid gap-2";
  const inputClass = "rounded-full";

  return (
    <div className="mx-auto grid max-w-md gap-6 px-6 py-12 md:py-20">
      <div>
        <p className="text-sm font-medium text-emerald-deep">Welcome to LocalLift AI</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {mode === "signin" ? "Sign in to your workspace" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Campaigns, approvals and notifications live here."
            : "New company? You become its Head / CMO. Joining one? Pick your role."}
        </p>
      </div>

      <Card className="rounded-card">
        <CardHeader>
          <div className="flex gap-1 rounded-full border border-border bg-muted/50 p-1" role="tablist">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={
                  "flex-1 rounded-full px-3 py-1.5 text-sm transition-colors duration-200 " +
                  (mode === m ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")
                }
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            {mode === "signup" && (
              <>
                <div className={field}>
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    required
                    className={inputClass}
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Sunrise Café"
                  />
                </div>
                <div className={field}>
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    required
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Priya"
                  />
                </div>
                <div className={field}>
                  <Label htmlFor="role">Your role</Label>
                  <select
                    id="role"
                    className="h-9 w-full rounded-full border border-input bg-transparent px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={field}>
                  <Label htmlFor="managerEmail">Manager&rsquo;s email (optional)</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    className={inputClass}
                    value={form.managerEmail}
                    onChange={(e) => setForm({ ...form, managerEmail: e.target.value })}
                    placeholder="arjun@sunrise.demo"
                  />
                  <p className="text-xs text-muted-foreground">
                    Connects you into the company chain — your manager reviews your campaigns.
                  </p>
                </div>
              </>
            )}
            <div className={field}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="priya@sunrise.demo"
              />
            </div>
            <div className={field}>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className={inputClass}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="mt-1 rounded-full">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-card">
        <CardHeader>
          <CardTitle className="text-sm">Demo org — Sunrise Café (password demo1234)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {DEMO.map((d) => (
            <Button
              key={d.email}
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              className="rounded-full"
              onClick={() => auth("/api/auth/login", { email: d.email, password: "demo1234" })}
            >
              {d.name} · {ROLE_LABEL[d.role]}
            </Button>
          ))}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
