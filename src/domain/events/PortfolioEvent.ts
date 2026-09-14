import type { CorporateAction } from "../corporate-actions/CorporateAction";
import type { Income } from "../incomes/Income";
import type { Operation } from "../operations/Operation";

type EventBase = {
  date: string;
  sequence: number;
};

export type PortfolioEvent =
  | (EventBase & { kind: "OPERATION"; operation: Operation })
  | (EventBase & { kind: "CORPORATE_ACTION"; action: CorporateAction })
  | (EventBase & { kind: "INCOME"; income: Income });

export function sortPortfolioEvents(
  events: readonly PortfolioEvent[],
): PortfolioEvent[] {
  return [...events].sort((left, right) => {
    const byDate = left.date.localeCompare(right.date);
    if (byDate !== 0) {
      return byDate;
    }
    if (left.sequence !== right.sequence) {
      return left.sequence - right.sequence;
    }
    return left.kind.localeCompare(right.kind);
  });
}
