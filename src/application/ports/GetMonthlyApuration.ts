import type { Money } from "../../domain/money/Money";

export type MonthlyApuration = {
  month: string;
  result: Money;
  exemptionApplied: Money;
  darf: Money;
};

export interface GetMonthlyApuration {
  execute(input: { month: string }): Promise<MonthlyApuration>;
}
