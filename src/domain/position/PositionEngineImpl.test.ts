import { describe, expect, it } from "vitest";
import { createAsset } from "../assets/Asset";
import { Money } from "../money/Money";
import type { PortfolioEvent } from "../events/PortfolioEvent";
import { PositionEngineImpl } from "./PositionEngineImpl";

const petr4 = createAsset({ ticker: "petr4", kind: "ACAO" });
const vale3 = createAsset({ ticker: "vale3", kind: "ACAO" });
const zero = Money.fromReais("0.00");

function operation(
  asset: typeof petr4,
  date: string,
  kind: "COMPRA" | "VENDA",
  quantity: number,
  price: string,
  sequence: number,
): PortfolioEvent {
  return {
    kind: "OPERATION",
    date,
    sequence,
    operation: {
      asset,
      date,
      kind,
      quantity,
      unitPrice: Money.fromReais(price),
      brokerage: zero,
      b3Fees: zero,
    },
  };
}

describe("PositionEngineImpl", () => {
  it("calculates weighted average across multiple purchases", () => {
    const result = new PositionEngineImpl().replay([
      operation(petr4, "2024-01-02", "COMPRA", 10, "10.00", 0),
      operation(petr4, "2024-01-03", "COMPRA", 10, "14.00", 0),
    ]).get("PETR4");

    expect(result).toMatchObject({ quantity: 20, averagePrice: Money.fromReais("12.00") });
  });

  it("keeps average price after partial and total sales", () => {
    const engine = new PositionEngineImpl();
    const partial = engine.replay([
      operation(petr4, "2024-01-02", "COMPRA", 10, "10.00", 0),
      operation(petr4, "2024-01-03", "VENDA", 4, "15.00", 0),
    ]).get("PETR4");
    expect(partial).toMatchObject({ quantity: 6, averagePrice: Money.fromReais("10.00") });

    const total = engine.replay([
      operation(petr4, "2024-01-02", "COMPRA", 10, "10.00", 0),
      operation(petr4, "2024-01-03", "VENDA", 10, "15.00", 0),
    ]).get("PETR4");
    expect(total).toMatchObject({ quantity: 0, averagePrice: Money.fromReais("0.00") });
  });

  it("replays shuffled events for two tickers and ignores income", () => {
    const events: PortfolioEvent[] = [
      operation(vale3, "2024-01-03", "COMPRA", 2, "20.00", 0),
      operation(petr4, "2024-01-01", "COMPRA", 5, "10.00", 0),
      { kind: "INCOME", date: "2024-01-02", sequence: 0, income: { asset: petr4, date: "2024-01-02", kind: "DIVIDENDO", amount: Money.fromReais("5.00") } },
    ];
    const result = new PositionEngineImpl().replay(events);
    expect(result.get("PETR4")).toMatchObject({ quantity: 5, averagePrice: Money.fromReais("10.00") });
    expect(result.get("VALE3")).toMatchObject({ quantity: 2, averagePrice: Money.fromReais("20.00") });
  });

  it("adjusts quantity and average price for split and reverse split", () => {
    const result = new PositionEngineImpl().replay([
      operation(petr4, "2024-01-01", "COMPRA", 10, "20.00", 0),
      { kind: "CORPORATE_ACTION", date: "2024-01-02", sequence: 0, action: { asset: petr4, date: "2024-01-02", kind: "DESDOBRAMENTO", factor: 2 } },
      { kind: "CORPORATE_ACTION", date: "2024-01-03", sequence: 0, action: { asset: petr4, date: "2024-01-03", kind: "GRUPAMENTO", factor: 4 } },
    ]).get("PETR4");
    expect(result).toMatchObject({ quantity: 5, averagePrice: Money.fromReais("40.00") });
  });

  it("rejects a sale above the current position", () => {
    expect(() => new PositionEngineImpl().replay([
      operation(petr4, "2024-01-01", "VENDA", 1, "10.00", 0),
    ])).toThrow("Insufficient position");
  });

  it("returns sale result and classifies day trade", () => {
    const sales = new PositionEngineImpl().realizedPnLForSales([
      operation(petr4, "2024-01-02", "VENDA", 2, "15.00", 1),
      operation(petr4, "2024-01-02", "COMPRA", 2, "10.00", 0),
    ]);
    expect(sales[0]).toMatchObject({ modality: "DAY_TRADE", soldValue: Money.fromReais("30.00"), result: Money.fromReais("10.00") });
  });

  it("classifies a sale on another date as swing trade", () => {
    const sales = new PositionEngineImpl().realizedPnLForSales([
      operation(petr4, "2024-01-01", "COMPRA", 2, "10.00", 0),
      operation(petr4, "2024-01-02", "VENDA", 2, "15.00", 0),
    ]);
    expect(sales[0]?.modality).toBe("SWING");
  });

  it("includes transaction costs in acquisition cost and sold value", () => {
    const events: PortfolioEvent[] = [
      { ...operation(petr4, "2024-01-01", "COMPRA", 1, "10.00", 0), operation: { ...operation(petr4, "2024-01-01", "COMPRA", 1, "10.00", 0).operation, brokerage: Money.fromReais("1.00") } },
      { ...operation(petr4, "2024-01-02", "VENDA", 1, "15.00", 0), operation: { ...operation(petr4, "2024-01-02", "VENDA", 1, "15.00", 0).operation, brokerage: Money.fromReais("1.00") } },
    ];
    const sale = new PositionEngineImpl().realizedPnLForSales(events)[0];
    expect(sale).toMatchObject({ soldValue: Money.fromReais("14.00"), result: Money.fromReais("3.00") });
  });
});