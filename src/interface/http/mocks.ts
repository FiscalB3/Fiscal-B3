import type { GetAnnualDeclaration, AnnualDeclaration } from "../../application/ports/GetAnnualDeclaration";
import type { GetDashboard, DashboardSummary } from "../../application/ports/GetDashboard";
import type { GetMonthlyApuration, MonthlyApuration } from "../../application/ports/GetMonthlyApuration";
import type { GetPortfolio } from "../../application/ports/GetPortfolio";
import type { GetTimeline, TimelineEvent } from "../../application/ports/GetTimeline";
import type { ImportOperations } from "../../application/ports/ImportOperations";
import type { ResetDemo, ResetDemoResult } from "../../application/ports/ResetDemo";
import { Money } from "../../domain/money/Money";
import type { PositionSnapshot } from "../../domain/position/PositionSnapshot";
import type { AppPorts } from "./createApp";

const EXEMPTION_LIMIT_CENTS = 2_000_000;

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

const SAMPLE_EXEMPTION_USED_CENTS = 850_000;
const DEMO_EXEMPTION_USED_CENTS = 1_820_000;

const SAMPLE_TIMELINE: readonly TimelineEvent[] = [
  {
    id: "s1",
    date: "2024-01-10",
    kind: "BUY",
    ticker: "PETR4",
    summary: "Compra de 100 PETR4",
  },
  {
    id: "s2",
    date: "2024-02-05",
    kind: "BUY",
    ticker: "VALE3",
    summary: "Compra de 40 VALE3",
  },
  {
    id: "s3",
    date: "2024-03-12",
    kind: "SELL",
    ticker: "PETR4",
    summary: "Venda swing de 20 PETR4",
  },
];

const DEMO_TIMELINE: readonly TimelineEvent[] = [
  {
    id: "d1",
    date: "2024-01-08",
    kind: "BUY",
    ticker: "PETR4",
    summary: "Compra de 200 PETR4",
  },
  {
    id: "d2",
    date: "2024-01-08",
    kind: "DAY_TRADE",
    ticker: "PETR4",
    summary: "Day trade de 50 PETR4",
  },
  {
    id: "d3",
    date: "2024-01-22",
    kind: "BUY",
    ticker: "HGLG11",
    summary: "Compra de 20 HGLG11",
  },
  {
    id: "d4",
    date: "2024-02-14",
    kind: "BUY",
    ticker: "ITUB4",
    summary: "Compra de 150 ITUB4",
  },
  {
    id: "d5",
    date: "2024-02-28",
    kind: "SPLIT",
    ticker: "BBAS3",
    summary: "Desdobramento 1:2 em BBAS3",
  },
  {
    id: "d6",
    date: "2024-03-05",
    kind: "SELL",
    ticker: "VALE3",
    summary: "Venda swing de 20 VALE3",
  },
  {
    id: "d7",
    date: "2024-03-15",
    kind: "RENDIMENTO_FII",
    ticker: "MXRF11",
    summary: "Rendimento FII de MXRF11",
  },
  {
    id: "d8",
    date: "2024-03-20",
    kind: "DIVIDENDO",
    ticker: "ITUB4",
    summary: "Dividendo de ITUB4",
  },
];

function clonePortfolio(rows: readonly PositionSnapshot[]): PositionSnapshot[] {
  return rows.map((row) => ({
    ticker: row.ticker,
    quantity: row.quantity,
    averagePrice: Money.fromCents(row.averagePrice.toCents()),
    acquisitionCost: Money.fromCents(row.acquisitionCost.toCents()),
  }));
}

function sumAcquisitionCost(rows: readonly PositionSnapshot[]): Money {
  return rows.reduce(
    (total, row) => total.add(Money.fromCents(row.acquisitionCost.toCents())),
    Money.fromCents(0),
  );
}

function cloneTimeline(events: readonly TimelineEvent[]): TimelineEvent[] {
  return events.map((event) => ({ ...event }));
}

export function createMockPorts(options?: {
  portfolio?: readonly PositionSnapshot[];
  importOk?: boolean;
  timeline?: readonly TimelineEvent[];
}): AppPorts {
  let portfolio = clonePortfolio(options?.portfolio ?? samplePortfolio);
  let timeline = cloneTimeline(options?.timeline ?? SAMPLE_TIMELINE);
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
        result: Money.fromCents(base.result.toCents()),
        exemptionApplied: Money.fromCents(base.exemptionApplied.toCents()),
        darf: Money.fromCents(base.darf.toCents()),
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
          amount: Money.fromCents(line.amount.toCents()),
        })),
      };
    },
  };

  const getDashboard: GetDashboard = {
    async execute({ month }): Promise<DashboardSummary> {
      const apuration = await getMonthlyApuration.execute({ month });
      const used = demoActive ? DEMO_EXEMPTION_USED_CENTS : SAMPLE_EXEMPTION_USED_CENTS;
      const percent =
        EXEMPTION_LIMIT_CENTS === 0 ? 0 : Math.round((used / EXEMPTION_LIMIT_CENTS) * 1000) / 10;
      return {
        month,
        investedCost: sumAcquisitionCost(portfolio),
        assetCount: portfolio.length,
        monthDarf: Money.fromCents(apuration.darf.toCents()),
        exemptionUsedCents: used,
        exemptionLimitCents: EXEMPTION_LIMIT_CENTS,
        exemptionPercentUsed: percent,
      };
    },
  };

  const getTimeline: GetTimeline = {
    async execute() {
      return [...timeline].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    },
  };

  const resetDemo: ResetDemo = {
    async execute(): Promise<ResetDemoResult> {
      portfolio = clonePortfolio(DEMO_PORTFOLIO);
      timeline = cloneTimeline(DEMO_TIMELINE);
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
    getDashboard,
    getTimeline,
    resetDemo,
  };
}
