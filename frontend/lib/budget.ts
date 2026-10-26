import type { BudgetAllocation } from "./types";

// Deterministic budget rules — never the AI's job, so the demo can't be embarrassed
// by an allocation that doesn't sum to the budget.
const PAID: Record<string, { weight: number; purpose: string }> = {
  Instagram: { weight: 0.6, purpose: "Boost the offer posts to local feeds" },
  Facebook: { weight: 0.4, purpose: "Local reach ads around your area" },
};

const FREE: Record<string, string> = {
  WhatsApp: "Free — status updates and broadcast list",
  Email: "Free — message your existing contacts",
};

export function allocateBudget(budget: number, platforms: string[]): BudgetAllocation[] {
  const paid = platforms.filter((p) => PAID[p]);
  const firstAmount =
    paid.length === 2 ? Math.floor(budget * PAID[paid[0]].weight) : paid.length === 1 ? budget : 0;

  const allocs: BudgetAllocation[] =
    paid.length === 0
      ? [
          {
            platform: "Boosting",
            amount: budget,
            purpose: "Reserve — boost the best-performing post after 48 hours",
          },
        ]
      : [
          { platform: paid[0], amount: firstAmount, purpose: PAID[paid[0]].purpose },
          ...(paid[1]
            ? [{ platform: paid[1], amount: budget - firstAmount, purpose: PAID[paid[1]].purpose }]
            : []),
        ];

  for (const p of platforms) if (FREE[p]) allocs.push({ platform: p, amount: 0, purpose: FREE[p] });
  return allocs;
}

export const allocationTotal = (allocs: BudgetAllocation[]) =>
  allocs.reduce((sum, a) => sum + a.amount, 0);
