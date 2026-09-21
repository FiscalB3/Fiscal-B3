import type { GetAnnualDeclaration } from "../../application/ports/GetAnnualDeclaration";
import type { GetMonthlyApuration } from "../../application/ports/GetMonthlyApuration";
import type { GetPortfolio } from "../../application/ports/GetPortfolio";
import type { ImportOperations } from "../../application/ports/ImportOperations";
import { Money } from "../../domain/money/Money";
import type { PositionSnapshot } from "../../domain/position/PositionSnapshot";
import type { AppPorts } from "./createApp";

const samplePosition: PositionSnapshot = {
  ticker: "PETR4",
  quantity: 100,
  averagePrice: Money.fromReais("28.50"),
  acquisitionCost: Money.fromReais("2850.00"),
};

export function createMockPorts(options?: {
  portfolio?: readonly PositionSnapshot[];
  importOk?: boolean;
}): AppPorts {
  const portfolio = options?.portfolio ?? [samplePosition];
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
    async execute({ month }) {
      return {
        month,
        result: Money.fromReais("1500.00"),
        exemptionApplied: Money.fromReais("0.00"),
        darf: Money.fromReais("225.00"),
      };
    },
  };

  const getAnnualDeclaration: GetAnnualDeclaration = {
    async execute({ year }) {
      return {
        year,
        bensEDireitos: portfolio,
        rendimentos: [{ kind: "DIVIDENDO", amount: Money.fromReais("100.00") }],
      };
    },
  };

  return {
    importOperations,
    getPortfolio,
    getMonthlyApuration,
    getAnnualDeclaration,
  };
}
