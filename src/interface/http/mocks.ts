import type { GetAnnualDeclaration, AnnualDeclaration } from "../../application/ports/GetAnnualDeclaration";
import type { GetMonthlyApuration, MonthlyApuration } from "../../application/ports/GetMonthlyApuration";
import type { GetPortfolio } from "../../application/ports/GetPortfolio";
import type { ImportOperations } from "../../application/ports/ImportOperations";
import type { ResetDemo, ResetDemoResult } from "../../application/ports/ResetDemo";
import { Money } from "../../domain/money/Money";
import type { PositionSnapshot } from "../../domain/position/PositionSnapshot";
import type { AppPorts } from "./createApp";

/** Baseline sample (3 tickers) used when demo is not loaded. */
const samplePortfolio: readonly PositionSnapshot[] = [
  {
    ticker: "PETR4",
    quantity: 100,
    averagePrice: Money.fromReais("28.50"),
    acquisitionCost: Money.fromReais("2850.00"),
  },
  {
    ticker: "VALE3",
    quantity: 40,
    averagePrice: Money.fromReais("62.10"),
    acquisitionCost: Money.fromReais("2484.00"),
  },
  {
    ticker: "HGLG11",
    quantity: 15,
    averagePrice: Money.fromReais("160.00"),
    acquisitionCost: Money.fromReais("2400.00"),
  },
];

/** Deterministic presentation seed: ≥5 tickers, FII, day+swing, provento. */
export const DEMO_PORTFOLIO: readonly PositionSnapshot[] = [
  {
    ticker: "PETR4",
    quantity: 200,
    averagePrice: Money.fromReais("30.00"),
    acquisitionCost: Money.fromReais("6000.00"),
  },
  {
    ticker: "VALE3",
    quantity: 80,
    averagePrice: Money.fromReais("65.00"),
    acquisitionCost: Money.fromReais("5200.00"),
  },
  {
    ticker: "ITUB4",
    quantity: 150,
    averagePrice: Money.fromReais("28.00"),
    acquisitionCost: Money.fromReais("4200.00"),
  },
  {
    ticker: "BBAS3",
    quantity: 100,
    averagePrice: Money.fromReais("27.50"),
    acquisitionCost: Money.fromReais("2750.00"),
  },
  {
    ticker: "HGLG11",
    quantity: 20,
    averagePrice: Money.fromReais("165.00"),
    acquisitionCost: Money.fromReais("3300.00"),
  },
  {
    ticker: "MXRF11",
    quantity: 100,
    averagePrice: Money.fromReais("10.00"),
    acquisitionCost: Money.fromReais("1000.00"),
  },
];

const DEMO_MODALITIES = ["DAY_TRADE", "SWING"] as const;

const DEMO_APURATION_BASE = {
  result: Money.fromReais("3200.00"),
  exemptionApplied: Money.fromReais("0.00"),
  darf: Money.fromReais("480.00"),
};

const DEMO_RENDIMENTOS: AnnualDeclaration["rendimentos"] = [
  { kind: "DIVIDENDO", amount: Money.fromReais("250.00") },
  { kind: "JCP", amount: Money.fromReais("90.00") },
  { kind: "RENDIMENTO_FII", amount: Money.fromReais("420.00") },
];

const SAMPLE_APURATION_BASE = {
  result: Money.fromReais("1500.00"),
  exemptionApplied: Money.fromReais("0.00"),
  darf: Money.fromReais("225.00"),
};

const SAMPLE_RENDIMENTOS: AnnualDeclaration["rendimentos"] = [
  { kind: "DIVIDENDO", amount: Money.fromReais("100.00") },
  { kind: "JCP", amount: Money.fromReais("45.00") },
  { kind: "RENDIMENTO_FII", amount: Money.fromReais("180.00") },
];

function clonePortfolio(rows: readonly PositionSnapshot[]): PositionSnapshot[] {
  return rows.map((row) => ({
    ticker: row.ticker,
    quantity: row.quantity,
    averagePrice: Money.fromCents(row.averagePrice.cents),
    acquisitionCost: Money.fromCents(row.acquisitionCost.cents),
  }));
}

export function createMockPorts(options?: {
  portfolio?: readonly PositionSnapshot[];
  importOk?: boolean;
}): AppPorts {
  let portfolio = clonePortfolio(options?.portfolio ?? samplePortfolio);
  let demoActive = false;
  const importOk = options?.importOk ?? true;

  const importOperations: ImportOperations = {
    async execute() {
      if (importOk) {
        return { ok: true };
      }
      return { ok: false, errors: [{ line: 2, message: "invalid quantity" }] };
    },
  };

  const getPortfolio: GetPortfolio = {
    async execute() {
      return portfolio;
    },
  };

  const getMonthlyApuration: GetMonthlyApuration = {
    async execute({ month }): Promise<MonthlyApuration> {
      const base = demoActive ? DEMO_APURATION_BASE : SAMPLE_APURATION_BASE;
      return {
        month,
        result: Money.fromCents(base.result.cents),
        exemptionApplied: Money.fromCents(base.exemptionApplied.cents),
        darf: Money.fromCents(base.darf.cents),
      };
    },
  };

  const getAnnualDeclaration: GetAnnualDeclaration = {
    async execute({ year }): Promise<AnnualDeclaration> {
      const rendimentos = demoActive ? DEMO_RENDIMENTOS : SAMPLE_RENDIMENTOS;
      return {
        year,
        bensEDireitos: clonePortfolio(portfolio),
        rendimentos: rendimentos.map((line) => ({
          kind: line.kind,
          amount: Money.fromCents(line.amount.cents),
        })),
      };
    },
  };

  const resetDemo: ResetDemo = {
    async execute(): Promise<ResetDemoResult> {
      portfolio = clonePortfolio(DEMO_PORTFOLIO);
      demoActive = true;
      return {
        ok: true,
        tickers: DEMO_PORTFOLIO.map((row) => row.ticker),
        modalities: DEMO_MODALITIES,
        hasFii: true,
        hasProvento: true,
      };
    },
  };

  return {
    importOperations,
    getPortfolio,
    getMonthlyApuration,
    getAnnualDeclaration,
    resetDemo,
  };
}
