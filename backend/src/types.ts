export type Platform = "Instagram" | "Facebook" | "WhatsApp" | "Email";

export type Objective = "awareness" | "offer" | "event" | "launch" | "repeat";

export type ContentLanguage = "English" | "Hindi" | "Hinglish";

export interface BusinessProfile {
  id: string;
  businessName: string;
  category: string;
  location: string;
  description: string;
  targetAudience: string;
  brandTone: string;
  primaryColor?: string;
}

export interface CampaignBrief {
  objective: Objective;
  offer: string;
  budget: number;
  startDate?: string; // ISO yyyy-mm-dd
  durationDays: number;
  platforms: Platform[];
  tone: string;
  language: ContentLanguage;
}

export interface SocialPost {
  platform: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export interface ScheduleItem {
  day: string;
  date?: string; // ISO yyyy-mm-dd
  platform?: string;
  asset: string;
  reason: string;
}

export interface BudgetAllocation {
  platform: string;
  amount: number;
  purpose: string;
}

export interface PosterConcept {
  headline: string;
  subline: string;
  cta: string;
}

// Mirrors the AI contract in TECHNICAL-ARCHITECTURE.md §5 (extended with budget, poster, metrics)
export interface GeneratedCampaign {
  campaignTitle: string;
  strategy: string;
  socialPosts: SocialPost[];
  whatsappMessage: string;
  headlines: string[];
  budgetAllocation: BudgetAllocation[];
  postingSchedule: ScheduleItem[];
  poster: PosterConcept;
  successMetrics: string[];
  itemsToConfirm: string[];
}

// ---- Organization & auth ----

export type Role = "employee" | "team_lead" | "manager" | "head";

// authority order: employee (intern) < team_lead < manager < head
export const ROLE_RANK: Record<Role, number> = {
  employee: 0,
  team_lead: 1,
  manager: 2,
  head: 3,
};

export const ROLE_LABEL: Record<Role, string> = {
  employee: "Employee (Intern)",
  team_lead: "Team Lead",
  manager: "Manager",
  head: "Head / CMO",
};

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  managerId: string | null;
  createdAt: string;
}

export interface StoredCampaign extends GeneratedCampaign {
  id: string;
  companyId: string;
  creatorId: string;
  creatorName: string;
  creatorRole: Role;
  status: "draft" | "approved";
  createdAt: string;
  profile: BusinessProfile;
  brief: CampaignBrief;
  approvedBy?: string;
  approvedRole?: Role;
  approvedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "approved" | "created";
  message: string;
  campaignId: string;
  read: boolean;
  createdAt: string;
}
