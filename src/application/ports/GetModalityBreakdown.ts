import type { Money } from "../../domain/money/Money";

export type ModalityBucket = {
  modality: "DAY_TRADE" | "SWING";
  result: Money;
  tax: Money;
  lossCarryforward: Money;
};

export type ModalityBreakdown = {
  month: string;
  buckets: readonly ModalityBucket[];
};

export interface GetModalityBreakdown {
  execute(input: { month: string }): Promise<ModalityBreakdown>;
}
