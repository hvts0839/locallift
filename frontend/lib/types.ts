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

export interface Campaign extends GeneratedCampaign {
  id: string;
  status: "draft" | "approved";
  createdAt: string;
  profile: BusinessProfile;
  brief: CampaignBrief;
  source?: "ai" | "template";
  // org fields (owned by the backend)
  creatorId?: string;
  creatorName?: string;
  creatorRole?: Role;
  approvedBy?: string;
  approvedRole?: Role;
  approvedAt?: string;
}

// ---- Organization & auth (twins of backend/src/types.ts) ----

export type Role = "employee" | "team_lead" | "manager" | "head";

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

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  companyName: string;
  managerName: string | null;
}

export interface OrgNotification {
  id: string;
  type: "approved" | "created";
  message: string;
  campaignId: string;
  read: boolean;
  createdAt: string;
}
