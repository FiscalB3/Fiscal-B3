import type { Money } from "../../domain/money/Money";

export type LossCarryforwardPoint = {
  month: string;
  dayTrade: Money;
  swing: Money;
};

export type LossCarryforwardSeries = {
  points: readonly LossCarryforwardPoint[];
};

export interface GetLossCarryforward {
  execute(input?: { year?: number }): Promise<LossCarryforwardSeries>;
}
