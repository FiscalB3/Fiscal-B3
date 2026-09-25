import type { GetAnnualDeclaration, AnnualDeclaration } from "../../application/ports/GetAnnualDeclaration";
import type { GetDarfBreakdown, DarfBreakdown } from "../../application/ports/GetDarfBreakdown";
import type { GetDarfCalendar, DarfObligation } from "../../application/ports/GetDarfCalendar";
import type { GetInsights, InsightSet } from "../../application/ports/GetInsights";
import type { GetPortfolioCostEvolution, PortfolioCostEvolution } from "../../application/ports/GetPortfolioCostEvolution";
import type { GetYearComparison, YearComparison } from "../../application/ports/GetYearComparison";
import type { SimulateSale, SimulateSaleResult } from "../../application/ports/SimulateSale";
import type { GetDashboard, DashboardSummary } from "../../application/ports/GetDashboard";
import type { GetLossCarryforward, LossCarryforwardSeries } from "../../application/ports/GetLossCarryforward";
import type { GetModalityBreakdown, ModalityBreakdown } from "../../application/ports/GetModalityBreakdown";
import type { GetMonthlyApuration, MonthlyApuration } from "../../application/ports/GetMonthlyApuration";
import type { GetPortfolio } from "../../application/ports/GetPortfolio";
import type { GetTimeline, TimelineEvent } from "../../application/ports/GetTimeline";
import type { ImportOperations } from "../../application/ports/ImportOperations";
import type { ResetDemo, ResetDemoResult } from "../../application/ports/ResetDemo";
import { Money } from "../../domain/money/Money";
import type { PositionSnapshot } from "../../domain/position/PositionSnapshot";
import { darfDueDate } from "../../domain/tax/darfDueDate";
import { buildExemptionMeter } from "../../domain/tax/exemptionMeter";
import type { AppPorts } from "./createApp";

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

const SAMPLE_MODALITY: ModalityBreakdown["buckets"] = [
  {
    modality: "SWING",
    result: Money.fromReais("1500.00"),
    tax: Money.fromReais("225.00"),
    lossCarryforward: Money.fromReais("0.00"),
  },
  {
    modality: "DAY_TRADE",
    result: Money.fromReais("0.00"),
    tax: Money.fromReais("0.00"),
    lossCarryforward: Money.fromReais("400.00"),
  },
];

const DEMO_MODALITY: ModalityBreakdown["buckets"] = [
  {
    modality: "SWING",
    result: Money.fromReais("2800.00"),
    tax: Money.fromReais("420.00"),
    lossCarryforward: Money.fromReais("150.00"),
  },
  {
    modality: "DAY_TRADE",
    result: Money.fromReais("400.00"),
    tax: Money.fromReais("80.00"),
    lossCarryforward: Money.fromReais("150.00"),
  },
];

const SAMPLE_LOSS_SERIES: LossCarryforwardSeries["points"] = [
  {
    month: "2024-01",
    dayTrade: Money.fromReais("500.00"),
    swing: Money.fromReais("200.00"),
  },
  {
    month: "2024-02",
    dayTrade: Money.fromReais("450.00"),
    swing: Money.fromReais("0.00"),
  },
  {
    month: "2024-03",
    dayTrade: Money.fromReais("400.00"),
    swing: Money.fromReais("0.00"),
  },
];

const DEMO_LOSS_SERIES: LossCarryforwardSeries["points"] = [
  {
    month: "2024-01",
    dayTrade: Money.fromReais("300.00"),
    swing: Money.fromReais("800.00"),
  },
  {
    month: "2024-02",
    dayTrade: Money.fromReais("200.00"),
    swing: Money.fromReais("400.00"),
  },
  {
    month: "2024-03",
    dayTrade: Money.fromReais("150.00"),
    swing: Money.fromReais("150.00"),
  },
  {
    month: "2024-04",
    dayTrade: Money.fromReais("100.00"),
    swing: Money.fromReais("0.00"),
  },
];

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

const SAMPLE_DARF_MONTHS: ReadonlyArray<{ month: string; darfCents: number }> = [
  { month: "2024-01", darfCents: 12000 },
  { month: "2024-03", darfCents: 22500 },
];

const DEMO_DARF_MONTHS: ReadonlyArray<{ month: string; darfCents: number }> = [
  { month: "2024-01", darfCents: 35000 },
  { month: "2024-02", darfCents: 18000 },
  { month: "2024-03", darfCents: 48000 },
  { month: "2024-05", darfCents: 9000 },
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

function cloneModalityBuckets(
  buckets: ModalityBreakdown["buckets"],
): ModalityBreakdown["buckets"] {
  return buckets.map((b) => ({
    modality: b.modality,
    result: Money.fromCents(b.result.toCents()),
    tax: Money.fromCents(b.tax.toCents()),
    lossCarryforward: Money.fromCents(b.lossCarryforward.toCents()),
  }));
}

function cloneLossSeries(
  points: LossCarryforwardSeries["points"],
): LossCarryforwardSeries["points"] {
  return points.map((p) => ({
    month: p.month,
    dayTrade: Money.fromCents(p.dayTrade.toCents()),
    swing: Money.fromCents(p.swing.toCents()),
  }));
}

export function createMockPorts(options?: {
  portfolio?: readonly PositionSnapshot[];
  importOk?: boolean;
  timeline?: readonly TimelineEvent[];
  darfMonths?: ReadonlyArray<{ month: string; darfCents: number }>;
}): AppPorts {
  let portfolio = clonePortfolio(options?.portfolio ?? samplePortfolio);
  let timeline = cloneTimeline(options?.timeline ?? SAMPLE_TIMELINE);
  let darfMonths = [...(options?.darfMonths ?? SAMPLE_DARF_MONTHS)];
  let modalityBuckets = cloneModalityBuckets(SAMPLE_MODALITY);
  let lossSeries = cloneLossSeries(SAMPLE_LOSS_SERIES);
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
      const meter = buildExemptionMeter(used);
      return {
        month,
        investedCost: sumAcquisitionCost(portfolio),
        assetCount: portfolio.length,
        monthDarf: Money.fromCents(apuration.darf.toCents()),
        exemptionUsedCents: meter.usedCents,
        exemptionLimitCents: meter.limitCents,
        exemptionPercentUsed: meter.percentUsed,
        exemptionStatus: meter.status,
        exemptionRemainingCents: meter.remainingCents,
      };
    },
  };

  const getTimeline: GetTimeline = {
    async execute() {
      return [...timeline].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    },
  };

  const getDarfCalendar: GetDarfCalendar = {
    async execute(input): Promise<readonly DarfObligation[]> {
      const year = input?.year;
      return darfMonths
        .filter((row) => row.darfCents > 0)
        .filter((row) => (year === undefined ? true : row.month.startsWith(`${year}-`)))
        .map((row) => ({
          month: row.month,
          darf: Money.fromCents(row.darfCents),
          dueDate: darfDueDate(row.month),
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
  };

  const getModalityBreakdown: GetModalityBreakdown = {
    async execute({ month }): Promise<ModalityBreakdown> {
      return {
        month,
        buckets: cloneModalityBuckets(modalityBuckets),
      };
    },
  };

  const getLossCarryforward: GetLossCarryforward = {
    async execute(input): Promise<LossCarryforwardSeries> {
      const year = input?.year;
      const points = cloneLossSeries(lossSeries).filter((p) =>
        year === undefined ? true : p.month.startsWith(`${year}-`),
      );
      return { points };
    },
  };

  const resetDemo: ResetDemo = {
    async execute(): Promise<ResetDemoResult> {
      portfolio = clonePortfolio(DEMO_PORTFOLIO);
      timeline = cloneTimeline(DEMO_TIMELINE);
      darfMonths = [...DEMO_DARF_MONTHS];
      modalityBuckets = cloneModalityBuckets(DEMO_MODALITY);
      lossSeries = cloneLossSeries(DEMO_LOSS_SERIES);
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


  const getDarfBreakdown: GetDarfBreakdown = {
    async execute({ month }): Promise<DarfBreakdown> {
      const apuration = await getMonthlyApuration.execute({ month });
      const gross = Money.fromCents(apuration.result.toCents());
      const exemption = Money.fromCents(apuration.exemptionApplied.toCents());
      const taxable = Money.fromCents(Math.max(0, gross.toCents() - exemption.toCents()));
      return {
        month,
        grossResult: gross,
        exemptionApplied: exemption,
        taxableBase: taxable,
        ratePercent: 15,
        darf: Money.fromCents(apuration.darf.toCents()),
      };
    },
  };

  const getInsights: GetInsights = {
    async execute({ month }): Promise<InsightSet> {
      const dash = await getDashboard.execute({ month });
      const fiiCost = portfolio
        .filter((row) => row.ticker.endsWith("11"))
        .reduce((sum, row) => sum + row.acquisitionCost.toCents(), 0);
      const fiiPct =
        dash.investedCost.toCents() === 0
          ? 0
          : Math.round((fiiCost / dash.investedCost.toCents()) * 1000) / 10;
      const darfMonthsSorted = [...darfMonths].sort((a, b) => b.darfCents - a.darfCents);
      const top = darfMonthsSorted[0];
      return {
        cards: [
          {
            id: "fii-share",
            title: "Concentração em FIIs",
            body: `${fiiPct}% do custo investido está em FIIs.`,
          },
          {
            id: "top-darf",
            title: "Maior DARF",
            body: top
              ? `O mês ${top.month} teve o maior DARF (${(top.darfCents / 100).toFixed(2)}).`
              : "Sem DARF no período.",
          },
          {
            id: "exemption",
            title: "Isenção do mês",
            body: `${dash.exemptionPercentUsed}% da isenção de ações swing já foi usada.`,
          },
        ],
      };
    },
  };


  const getPortfolioCostEvolution: GetPortfolioCostEvolution = {
    async execute(): Promise<PortfolioCostEvolution> {
      const base = demoActive ? 1_500_000 : 500_000;
      return {
        points: [
          { month: "2024-01", costCents: base },
          { month: "2024-02", costCents: base + 400_000 },
          { month: "2024-03", costCents: sumAcquisitionCost(portfolio).toCents() },
        ],
      };
    },
  };

  const simulateSale: SimulateSale = {
    async execute({ ticker, quantity, priceCents }): Promise<SimulateSaleResult> {
      const position = portfolio.find((row) => row.ticker === ticker);
      if (!position) {
        return { estimatedGainCents: 0, estimatedTaxCents: 0, persisted: false };
      }
      const avg = position.averagePrice.toCents();
      const gain = (priceCents - avg) * quantity;
      const tax = gain > 0 ? Math.floor(gain * 0.15) : 0;
      return { estimatedGainCents: gain, estimatedTaxCents: tax, persisted: false };
    },
  };

  const getYearComparison: GetYearComparison = {
    async execute({ yearA, yearB }): Promise<YearComparison> {
      const declA = await getAnnualDeclaration.execute({ year: yearA });
      const declB = await getAnnualDeclaration.execute({ year: yearB });
      const cost = (d: typeof declA) =>
        d.bensEDireitos.reduce((s, r) => s + r.acquisitionCost.toCents(), 0);
      const income = (d: typeof declA) =>
        d.rendimentos.reduce((s, r) => s + r.amount.toCents(), 0);
      const darfFor = (year: number) =>
        darfMonths
          .filter((m) => m.month.startsWith(`${year}-`))
          .reduce((s, m) => s + m.darfCents, 0);
      return {
        yearA,
        yearB,
        costA: { cents: cost(declA) },
        costB: { cents: cost(declB) },
        incomeA: { cents: income(declA) },
        incomeB: { cents: income(declB) },
        darfA: { cents: darfFor(yearA) },
        darfB: { cents: darfFor(yearB) },
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
    getDarfCalendar,
    getModalityBreakdown,
    getLossCarryforward,
    getDarfBreakdown,
    getInsights,
    getYearComparison,
    getPortfolioCostEvolution,
    simulateSale,
    resetDemo,
  };
}
