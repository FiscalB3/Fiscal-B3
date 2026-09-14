import type { Money } from "../money/Money";

export type PositionSnapshot = {
  ticker: string;
  quantity: number;
  averagePrice: Money;
  acquisitionCost: Money;
};
