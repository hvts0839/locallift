import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { Company, Notification, Role, StoredCampaign, User } from "./types";

const FILE = fileURLToPath(new URL("./data.json", import.meta.url));

export function hashPassword(pw: string, salt = randomBytes(8).toString("hex")): string {
  return `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return timingSafeEqual(Buffer.from(hash, "hex"), scryptSync(pw, salt, 32));
}

interface DB {
  companies: Company[];
  users: User[];
  campaigns: StoredCampaign[];
  notifications: Notification[];
}

function seed(): DB {
  const now = new Date().toISOString();
  const companyId = randomUUID();
  const mk = (name: string, email: string, role: Role, managerId: string | null): User => ({
    id: randomUUID(),
    companyId,
    name,
    email,
    passwordHash: hashPassword("demo1234"),
    role,
    managerId,
    createdAt: now,
  });
  const head = mk("Priya", "priya@sunrise.demo", "head", null);
  const manager = mk("Arjun", "arjun@sunrise.demo", "manager", head.id);
  const lead = mk("Meera", "meera@sunrise.demo", "team_lead", manager.id);
  const intern = mk("Rohit", "rohit@sunrise.demo", "employee", lead.id);

  const db: DB = {
    companies: [{ id: companyId, name: "Sunrise Café", createdAt: now }],
    users: [head, manager, lead, intern],
    campaigns: [],
    notifications: [],
  };
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
  console.log(
    `Seeded demo org "Sunrise Café" — priya@sunrise.demo (head) / arjun@sunrise.demo (manager) / meera@sunrise.demo (team lead) / rohit@sunrise.demo (intern) · password demo1234`
  );
  return db;
}

let db: DB = (() => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as DB;
  } catch {
    return seed();
  }
})();

export function getDb(): DB {
  return db;
}

export function saveDb() {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

export { randomUUID };
