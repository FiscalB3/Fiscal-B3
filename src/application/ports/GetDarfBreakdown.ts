import type { Money } from "../../domain/money/Money";

export type DarfBreakdown = {
  month: string;
  grossResult: Money;
  exemptionApplied: Money;
  taxableBase: Money;
  ratePercent: number;
  darf: Money;
};

export interface GetDarfBreakdown {
  execute(input: { month: string }): Promise<DarfBreakdown>;
}
