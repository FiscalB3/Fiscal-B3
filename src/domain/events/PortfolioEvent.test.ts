import { describe, expect, it } from "vitest";
import { createAsset } from "../assets/Asset";
import { Money } from "../money/Money";
import { sortPortfolioEvents, type PortfolioEvent } from "./PortfolioEvent";

const petr4 = createAsset({ ticker: "petr4", kind: "ACAO" });

function operationEvent(date: string, sequence: number): PortfolioEvent {
  return {
    kind: "OPERATION",
    date,
    sequence,
    operation: {
      asset: petr4,
      date,
      kind: "COMPRA",
      quantity: 1,
      unitPrice: Money.fromReais("10.00"),
      brokerage: Money.fromReais("0.00"),
      b3Fees: Money.fromReais("0.00"),
    },
  };
}

function corporateEvent(date: string, sequence: number): PortfolioEvent {
  return {
    kind: "CORPORATE_ACTION",
    date,
    sequence,
    action: {
      asset: petr4,
      date,
      kind: "DESDOBRAMENTO",
      factor: 2,
    },
  };
}

function incomeEvent(date: string, sequence: number): PortfolioEvent {
  return {
    kind: "INCOME",
    date,
    sequence,
    income: {
      asset: petr4,
      date,
      kind: "DIVIDENDO",
      amount: Money.fromReais("1.00"),
    },
  };
}

describe("sortPortfolioEvents", () => {
  it("orders events by date ascending", () => {
    const later = operationEvent("2024-02-01", 0);
    const earlier = operationEvent("2024-01-15", 0);
    expect(sortPortfolioEvents([later, earlier]).map((event) => event.date)).toEqual([
      "2024-01-15",
      "2024-02-01",
    ]);
  });

  it("uses sequence to break ties on the same date", () => {
    const second = operationEvent("2024-01-15", 2);
    const first = operationEvent("2024-01-15", 1);
    const sorted = sortPortfolioEvents([second, first]);
    expect(sorted.map((event) => event.sequence)).toEqual([1, 2]);
  });

  it("is deterministic for a shuffled list", () => {
    const canonical = [
      operationEvent("2024-01-10", 0),
      incomeEvent("2024-01-10", 1),
      corporateEvent("2024-01-12", 0),
      operationEvent("2024-02-01", 0),
    ];
    const shuffled = [canonical[3], canonical[1], canonical[0], canonical[2]];
    expect(sortPortfolioEvents(shuffled)).toEqual(canonical);
    expect(sortPortfolioEvents(shuffled)).toEqual(sortPortfolioEvents(canonical));
  });

  it("keeps operation, corporate action, and income in the same ordered stream", () => {
    const events: PortfolioEvent[] = [
      incomeEvent("2024-01-02", 0),
      corporateEvent("2024-01-01", 0),
      operationEvent("2024-01-01", 1),
    ];
    const sorted = sortPortfolioEvents(events);
    expect(sorted.map((event) => event.kind)).toEqual([
      "CORPORATE_ACTION",
      "OPERATION",
      "INCOME",
    ]);
  });
});
