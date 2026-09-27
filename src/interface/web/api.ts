export type MoneyJson = { cents: number };

export type PositionJson = {
  ticker: string;
  quantity: number;
  averagePrice: MoneyJson;
  acquisitionCost: MoneyJson;
};

export type MonthlyApurationJson = {
  month: string;
  result: MoneyJson;
  exemptionApplied: MoneyJson;
  darf: MoneyJson;
};

export type AnnualDeclarationJson = {
  year: number;
  bensEDireitos: PositionJson[];
  rendimentos: Array<{ kind: string; amount: MoneyJson }>;
};

export type DemoResetJson = {
  ok: true;
  tickers: string[];
  modalities: Array<"DAY_TRADE" | "SWING">;
  hasFii: true;
  hasProvento: true;
};

export type DashboardJson = {
  month: string;
  investedCost: MoneyJson;
  assetCount: number;
  monthDarf: MoneyJson;
  exemptionUsedCents: number;
  exemptionLimitCents: number;
  exemptionPercentUsed: number;
  exemptionStatus: "ok" | "warning" | "exceeded";
  exemptionRemainingCents: number;
};

export type TimelineEventJson = {
  id: string;
  date: string;
  kind: string;
  ticker: string;
  summary: string;
};

export type DarfObligationJson = {
  month: string;
  darf: MoneyJson;
  dueDate: string;
};

export type ModalityBucketJson = {
  modality: "DAY_TRADE" | "SWING";
  result: MoneyJson;
  tax: MoneyJson;
  lossCarryforward: MoneyJson;
};

export type ModalityBreakdownJson = {
  month: string;
  buckets: ModalityBucketJson[];
};

export type LossCarryforwardPointJson = {
  month: string;
  dayTrade: MoneyJson;
  swing: MoneyJson;
};

export type LossCarryforwardJson = {
  points: LossCarryforwardPointJson[];
};

export type DarfBreakdownJson = {
  month: string;
  grossResult: MoneyJson;
  exemptionApplied: MoneyJson;
  taxableBase: MoneyJson;
  ratePercent: number;
  darf: MoneyJson;
};

export type InsightCardJson = { id: string; title: string; body: string };
export type InsightsJson = { cards: InsightCardJson[] };

export type YearComparisonJson = {
  yearA: number;
  yearB: number;
  costA: MoneyJson;
  costB: MoneyJson;
  incomeA: MoneyJson;
  incomeB: MoneyJson;
  darfA: MoneyJson;
  darfB: MoneyJson;
};

export type CostEvolutionJson = { points: Array<{ month: string; costCents: number }> };

export type SimulateSaleJson = {
  estimatedGainCents: number;
  estimatedTaxCents: number;
  persisted: false;
};

export type ApiClient = {
  getPortfolio(): Promise<PositionJson[]>;
  getDashboard(month: string): Promise<DashboardJson>;
  getTimeline(): Promise<TimelineEventJson[]>;
  getDarfCalendar(year?: number): Promise<DarfObligationJson[]>;
  getModalityBreakdown(month: string): Promise<ModalityBreakdownJson>;
  getLossCarryforward(year?: number): Promise<LossCarryforwardJson>;
  getDarfBreakdown(month: string): Promise<DarfBreakdownJson>;
  getInsights(month: string): Promise<InsightsJson>;
  getYearComparison(yearA: number, yearB: number): Promise<YearComparisonJson>;
  getPortfolioCostEvolution(): Promise<CostEvolutionJson>;
  simulateSale(input: {
    ticker: string;
    quantity: number;
    priceCents: number;
    month: string;
  }): Promise<SimulateSaleJson>;
  getApuration(month: string): Promise<MonthlyApurationJson>;
  getDeclaration(year: number): Promise<AnnualDeclarationJson>;
  getDeclarationCsvUrl(year: number): string;
  importFile(file: File): Promise<{ ok: true } | { ok: false; errors: Array<{ line: number; message: string }> }>;
  resetDemo(): Promise<DemoResetJson>;
};

export function createApiClient(baseUrl = ""): ApiClient {
  return {
    async getPortfolio() {
      const res = await fetch(`${baseUrl}/portfolio`);
      if (!res.ok) {
        throw new Error("Failed to load portfolio");
      }
      return (await res.json()) as PositionJson[];
    },

    async getDashboard(month: string) {
      const res = await fetch(`${baseUrl}/dashboard?month=${encodeURIComponent(month)}`);
      if (!res.ok) {
        throw new Error("Failed to load dashboard");
      }
      return (await res.json()) as DashboardJson;
    },

    async getTimeline() {
      const res = await fetch(`${baseUrl}/timeline`);
      if (!res.ok) {
        throw new Error("Failed to load timeline");
      }
      return (await res.json()) as TimelineEventJson[];
    },

    async getDarfCalendar(year?: number) {
      const query = year === undefined ? "" : `?year=${encodeURIComponent(String(year))}`;
      const res = await fetch(`${baseUrl}/darf-calendar${query}`);
      if (!res.ok) {
        throw new Error("Failed to load DARF calendar");
      }
      return (await res.json()) as DarfObligationJson[];
    },

    async getModalityBreakdown(month: string) {
      const res = await fetch(
        `${baseUrl}/modality-breakdown?month=${encodeURIComponent(month)}`,
      );
      if (!res.ok) {
        throw new Error("Failed to load modality breakdown");
      }
      return (await res.json()) as ModalityBreakdownJson;
    },

    async getLossCarryforward(year?: number) {
      const query = year === undefined ? "" : `?year=${encodeURIComponent(String(year))}`;
      const res = await fetch(`${baseUrl}/loss-carryforward${query}`);
      if (!res.ok) {
        throw new Error("Failed to load loss carryforward");
      }
      return (await res.json()) as LossCarryforwardJson;
    },

    async getDarfBreakdown(month: string) {
      const res = await fetch(`${baseUrl}/darf-breakdown?month=${encodeURIComponent(month)}`);
      if (!res.ok) {
        throw new Error("Failed to load DARF breakdown");
      }
      return (await res.json()) as DarfBreakdownJson;
    },

    async getInsights(month: string) {
      const res = await fetch(`${baseUrl}/insights?month=${encodeURIComponent(month)}`);
      if (!res.ok) {
        throw new Error("Failed to load insights");
      }
      return (await res.json()) as InsightsJson;
    },

    async getYearComparison(yearA: number, yearB: number) {
      const res = await fetch(
        `${baseUrl}/year-comparison?yearA=${encodeURIComponent(String(yearA))}&yearB=${encodeURIComponent(String(yearB))}`,
      );
      if (!res.ok) {
        throw new Error("Failed to load year comparison");
      }
      return (await res.json()) as YearComparisonJson;
    },

    async getPortfolioCostEvolution() {
      const res = await fetch(`${baseUrl}/portfolio-cost-evolution`);
      if (!res.ok) {
        throw new Error("Failed to load cost evolution");
      }
      return (await res.json()) as CostEvolutionJson;
    },

    async simulateSale(input) {
      const res = await fetch(`${baseUrl}/simulate-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw new Error("Failed to simulate sale");
      }
      return (await res.json()) as SimulateSaleJson;
    },

    async getApuration(month: string) {
      const res = await fetch(`${baseUrl}/apuration?month=${encodeURIComponent(month)}`);
      if (!res.ok) {
        throw new Error("Failed to load apuration");
      }
      return (await res.json()) as MonthlyApurationJson;
    },

    async getDeclaration(year: number) {
      const res = await fetch(`${baseUrl}/declaration?year=${encodeURIComponent(String(year))}`);
      if (!res.ok) {
        throw new Error("Failed to load declaration");
      }
      return (await res.json()) as AnnualDeclarationJson;
    },

    getDeclarationCsvUrl(year: number) {
      return `${baseUrl}/declaration.csv?year=${encodeURIComponent(String(year))}`;
    },

    async importFile(file: File) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${baseUrl}/imports`, { method: "POST", body });
      const json = (await res.json()) as
        | { ok: true }
        | { errors: Array<{ line: number; message: string }> }
        | { error: string };
      if (res.ok && "ok" in json) {
        return { ok: true as const };
      }
      if ("errors" in json) {
        return { ok: false as const, errors: json.errors };
      }
      throw new Error("error" in json ? json.error : "Import failed");
    },

    async resetDemo() {
      const res = await fetch(`${baseUrl}/demo/reset`, { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to load demonstration");
      }
      return (await res.json()) as DemoResetJson;
    },
  };
}

export function formatCents(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100);
  const centavos = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}R$ ${reais},${centavos}`;
}
