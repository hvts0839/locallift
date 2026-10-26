"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProfile, saveProfile, uid } from "@/lib/store";
import type { BusinessProfile } from "@/lib/types";

const CATEGORIES = ["Café", "Salon", "Gym", "Tuition center", "Boutique", "Restaurant", "Local service"];
const TONES = ["Friendly", "Professional", "Playful", "Premium"];

const selectClass =
  "h-9 w-full rounded-full border border-input bg-transparent px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default function Onboarding() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [form, setForm] = useState({
    businessName: "",
    category: "Café",
    location: "",
    description: "",
    targetAudience: "",
    brandTone: "Friendly",
    primaryColor: "#20e59a",
  });

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setProfileId(p.id);
      setForm({
        businessName: p.businessName,
        category: p.category,
        location: p.location,
        description: p.description,
        targetAudience: p.targetAudience,
        brandTone: p.brandTone,
        primaryColor: p.primaryColor ?? "#20e59a",
      });
    }
  }, []);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const profile: BusinessProfile = { ...form, id: profileId ?? uid() };
    saveProfile(profile);
    router.push("/campaigns/new");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:py-16">
      <p className="text-sm font-medium text-emerald-deep">Step 1 of 2 — Business profile</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
        Tell us about your business
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Only what is needed to write useful content. Takes under two minutes.
      </p>

      <Card className="mt-8 rounded-card">
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" required value={form.businessName} onChange={set("businessName")} placeholder="Sunrise Café" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <select id="category" className={selectClass} value={form.category} onChange={set("category")}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" required value={form.location} onChange={set("location")} placeholder="Indiranagar, Bengaluru" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">What you do</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={set("description")} placeholder="All-day breakfast, filter coffee, and a quiet corner to work." />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="targetAudience">Target audience</Label>
                <Input id="targetAudience" required value={form.targetAudience} onChange={set("targetAudience")} placeholder="Remote workers and weekend families" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="brandTone">Brand tone</Label>
                <select id="brandTone" className={selectClass} value={form.brandTone} onChange={set("brandTone")}>
                  {TONES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2 sm:w-40">
              <Label htmlFor="primaryColor">Brand color (optional)</Label>
              <Input id="primaryColor" type="color" value={form.primaryColor} onChange={set("primaryColor")} />
            </div>
            <Button type="submit" className="mt-2 w-full rounded-full sm:w-auto sm:justify-self-start sm:px-8">
              Save profile and continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
