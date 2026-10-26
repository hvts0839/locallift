import { createHmac, timingSafeEqual } from "node:crypto";
import type { User } from "./types";
import { getDb } from "./store";

const SECRET = process.env.AUTH_SECRET ?? "locallift-dev-secret";

export function issueToken(userId: string): string {
  return `${userId}.${createHmac("sha256", SECRET).update(userId).digest("hex")}`;
}

export function verifyToken(token: string | undefined): string | null {
  const [id, sig] = (token ?? "").split(".");
  if (!id || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(id).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

export function userFromRequest(req: { headers: Record<string, string | string[] | undefined> }): User | null {
  const header = req.headers.authorization;
  const token = typeof header === "string" ? header.replace(/^Bearer /, "") : undefined;
  const userId = verifyToken(token);
  if (!userId) return null;
  return getDb().users.find((u) => u.id === userId) ?? null;
}
