import { describe, expect, it } from "vitest";
import { createAsset } from "../assets/Asset";
import type { Asset } from "../assets/Asset";
import type { Income } from "../incomes/Income";
import { Money } from "../money/Money";
import type { PositionSnapshot } from "../position/PositionSnapshot";
import { TaxEngine } from "./TaxEngine";
import type { SalePnL, TradeModality } from "./SalePnL";

const petr4 = createAsset({ ticker: "petr4", kind: "ACAO" });
const mxrf11 = createAsset({ ticker: "mxrf11", kind: "FII" });
const zero = Money.fromReais("0.00");

function sale(input: {
  asset?: Asset;
  date?: string;
  modality: TradeModality;
  result: string;
  soldValue: string;
}): SalePnL {
  const asset = input.asset ?? petr4;
  return {
    asset,
    date: input.date ?? "2024-03-10",
    modality: input.modality,
    result: Money.fromReais(input.result),
    soldValue: Money.fromReais(input.soldValue),
    assetKind: asset.kind,
  };
}

describe("TaxEngine", () => {
  const engine = new TaxEngine();

  it("keeps day trade and swing results in separate tax buckets", () => {
    const month = engine.monthlyApuration(
      [
        sale({ modality: "SWING", result: "1000.00", soldValue: "25000.00" }),
        sale({ modality: "DAY_TRADE", result: "1000.00", soldValue: "5000.00" }),
      ],
      "2024-03",
    );

    expect(month.darf.equals(Money.fromReais("350.00"))).toBe(true);
  });

  it("does not reduce swing profit with a day trade loss", () => {
    const month = engine.monthlyApuration(
      [
        sale({ modality: "SWING", result: "1000.00", soldValue: "25000.00" }),
        sale({ modality: "DAY_TRADE", result: "-1000.00", soldValue: "5000.00" }),
      ],
      "2024-03",
    );

    expect(month.result.equals(zero)).toBe(true);
    expect(month.darf.equals(Money.fromReais("150.00"))).toBe(true);
  });

  it("nets losses against gains only inside the same modality", () => {
    const month = engine.monthlyApuration(
      [
        sale({ modality: "SWING", result: "1000.00", soldValue: "15000.00", date: "2024-03-05" }),
        sale({ modality: "SWING", result: "-400.00", soldValue: "10000.00", date: "2024-03-20" }),
      ],
      "2024-03",
    );

    expect(month.darf.equals(Money.fromReais("90.00"))).toBe(true);
  });

  it("exempts swing stock sales when monthly sold value is at most 20000", () => {
    const month = engine.monthlyApuration(
      [sale({ modality: "SWING", result: "500.00", soldValue: "20000.00" })],
      "2024-03",
    );

    expect(month.exemptionApplied.equals(Money.fromReais("500.00"))).toBe(true);
    expect(month.darf.equals(zero)).toBe(true);
  });

  it("does not exempt swing stock sales when monthly sold value exceeds 20000", () => {
    const month = engine.monthlyApuration(
      [sale({ modality: "SWING", result: "500.00", soldValue: "20000.01" })],
      "2024-03",
    );

    expect(month.exemptionApplied.equals(zero)).toBe(true);
    expect(month.darf.equals(Money.fromReais("75.00"))).toBe(true);
  });

  it("does not exempt FII sales at or below 20000", () => {
    const month = engine.monthlyApuration(
      [
        sale({
          asset: mxrf11,
          modality: "SWING",
          result: "1000.00",
          soldValue: "10000.00",
        }),
      ],
      "2024-03",
    );

    expect(month.exemptionApplied.equals(zero)).toBe(true);
    expect(month.darf.equals(Money.fromReais("200.00"))).toBe(true);
  });

  it("does not exempt day trade stock sales at or below 20000", () => {
    const month = engine.monthlyApuration(
      [sale({ modality: "DAY_TRADE", result: "1000.00", soldValue: "10000.00" })],
      "2024-03",
    );

    expect(month.exemptionApplied.equals(zero)).toBe(true);
    expect(month.darf.equals(Money.fromReais("200.00"))).toBe(true);
  });

  it("ignores sales from other months in the monthly apuration", () => {
    const month = engine.monthlyApuration(
      [
        sale({ modality: "SWING", result: "1000.00", soldValue: "25000.00", date: "2024-03-10" }),
        sale({ modality: "SWING", result: "1000.00", soldValue: "25000.00", date: "2024-04-10" }),
      ],
      "2024-03",
    );

    expect(month.month).toBe("2024-03");
    expect(month.result.equals(Money.fromReais("1000.00"))).toBe(true);
    expect(month.darf.equals(Money.fromReais("150.00"))).toBe(true);
  });

  it("builds the annual declaration with 31/12 position, incomes, and year gains", () => {
    const positions: PositionSnapshot[] = [
      {
        ticker: "PETR4",
        quantity: 10,
        averagePrice: Money.fromReais("12.00"),
        acquisitionCost: Money.fromReais("120.00"),
      },
    ];
    const incomes: Income[] = [
      { asset: petr4, date: "2024-06-01", kind: "DIVIDENDO", amount: Money.fromReais("10.00") },
      { asset: petr4, date: "2024-07-01", kind: "JCP", amount: Money.fromReais("5.00") },
      { asset: mxrf11, date: "2024-08-01", kind: "RENDIMENTO_FII", amount: Money.fromReais("8.00") },
      { asset: petr4, date: "2023-12-01", kind: "DIVIDENDO", amount: Money.fromReais("99.00") },
    ];
    const sales: SalePnL[] = [
      sale({ modality: "SWING", result: "100.00", soldValue: "500.00", date: "2024-03-10" }),
      sale({ modality: "SWING", result: "50.00", soldValue: "200.00", date: "2023-03-10" }),
    ];

    const declaration = engine.annualDeclaration({
      year: 2024,
      positions,
      incomes,
      sales,
    });

    expect(declaration.year).toBe(2024);
    expect(declaration.bensEDireitos).toEqual(positions);
    expect(declaration.rendimentos).toEqual([
      { kind: "DIVIDENDO", amount: Money.fromReais("10.00") },
      { kind: "JCP", amount: Money.fromReais("5.00") },
      { kind: "RENDIMENTO_FII", amount: Money.fromReais("8.00") },
      { kind: "GANHO_DE_CAPITAL", amount: Money.fromReais("100.00") },
    ]);
  });
});
