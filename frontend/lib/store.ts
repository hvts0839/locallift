import type { BusinessProfile } from "./types";

// Campaigns live in the backend now — this keeps only the local brand profile draft.
const PROFILE_KEY = "locallift.profile";

export const uid = () => Math.random().toString(36).slice(2, 10);

export function getProfile(): BusinessProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  try {
    return raw ? (JSON.parse(raw) as BusinessProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: BusinessProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}
