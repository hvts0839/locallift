import type { Campaign, OrgNotification, OrgUser } from "./types";

// No env needed: window hostname works for localhost AND LAN testers.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  `http://${typeof window === "undefined" ? "localhost" : window.location.hostname}:4000`;

const TOKEN_KEY = "locallift.token";
const USER_KEY = "locallift.user";

export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY));

export function setSession(token: string, user: OrgUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser(): OrgUser | null {
  if (typeof window === "undefined") return null;
  try {
    return getToken() ? (JSON.parse(localStorage.getItem(USER_KEY) ?? "null") as OrgUser) : null;
  } catch {
    return null;
  }
}

// one fetch helper: Bearer auth + JSON + Error carrying the status
export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok)
    throw Object.assign(new Error(json.error ?? `Request failed (${res.status})`), { status: res.status });
  return json as T;
}

export interface CampaignList {
  campaigns: Campaign[];
}
export interface CampaignOne {
  campaign: Campaign;
  canApprove: boolean;
}
export interface NotificationList {
  notifications: OrgNotification[];
  unread: number;
}
