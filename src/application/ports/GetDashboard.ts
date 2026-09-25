import type { Money } from "../../domain/money/Money";

export type DashboardSummary = {
  month: string;
  investedCost: Money;
  assetCount: number;
  monthDarf: Money;
  /** Swing equity sales volume counted toward the R$ 20.000 exemption (cents). FII/day trade excluded. */
  exemptionUsedCents: number;
  /** Fixed monthly exemption ceiling in cents (2_000_000). */
  exemptionLimitCents: number;
  /** 0–100+ percent of exemption consumed (may exceed 100). */
  exemptionPercentUsed: number;
  exemptionStatus: "ok" | "warning" | "exceeded";
  exemptionRemainingCents: number;
};

export interface GetDashboard {
  execute(input: { month: string }): Promise<DashboardSummary>;
}
