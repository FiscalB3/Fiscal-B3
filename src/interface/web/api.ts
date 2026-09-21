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

export type ApiClient = {
  getPortfolio(): Promise<PositionJson[]>;
  getApuration(month: string): Promise<MonthlyApurationJson>;
  getDeclaration(year: number): Promise<AnnualDeclarationJson>;
  importFile(file: File): Promise<{ ok: true } | { ok: false; errors: Array<{ line: number; message: string }> }>;
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
  };
}

export function formatCents(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100);
  const centavos = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}R$ ${reais},${centavos}`;
}
