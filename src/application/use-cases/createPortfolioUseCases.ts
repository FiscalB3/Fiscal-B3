import type { PortfolioEvent } from "../../domain/events/PortfolioEvent";
import { PositionEngineImpl } from "../../domain/position/PositionEngineImpl";
import { TaxEngine } from "../../domain/tax/TaxEngine";
import type { GetAnnualDeclaration } from "../ports/GetAnnualDeclaration";
import type { GetMonthlyApuration } from "../ports/GetMonthlyApuration";
import type { GetPortfolio } from "../ports/GetPortfolio";
import type { ImportOperations } from "../ports/ImportOperations";
import type { ParsePortfolio } from "../ports/ParsePortfolio";
import type { PortfolioStore } from "../ports/PortfolioStore";

class InvalidHistory extends Error {}

export type PortfolioUseCases = {
  importOperations: ImportOperations;
  getPortfolio: GetPortfolio;
  getMonthlyApuration: GetMonthlyApuration;
  getAnnualDeclaration: GetAnnualDeclaration;
};

export function createPortfolioUseCases(store: PortfolioStore, parser: ParsePortfolio): PortfolioUseCases {
  const positions = new PositionEngineImpl();
  const tax = new TaxEngine();
  const snapshot = (events: readonly PortfolioEvent[]) =>
    [...positions.replay(events).values()].filter((position) => position.quantity > 0);

  return {
    importOperations: {
      async execute(source) {
        const parsed = parser.parse(source);
        if (!parsed.ok) return parsed;
        try {
          await store.append(parsed.events, (history) => {
            try {
              positions.replay(history);
              positions.realizedPnLForSales(history);
            } catch (error) {
              throw new InvalidHistory(error instanceof Error ? error.message : String(error));
            }
          });
          return { ok: true };
        } catch (error) {
          if (error instanceof InvalidHistory) {
            return { ok: false, errors: [{ line: 0, message: error.message }] };
          }
          throw error;
        }
      },
    },
    getPortfolio: {
      async execute() { return snapshot(await store.read()); },
    },
    getMonthlyApuration: {
      async execute({ month }) {
        const events = (await store.read()).filter((event) => event.date.slice(0, 7) <= month);
        return tax.monthlyApuration(positions.realizedPnLForSales(events), month);
      },
    },
    getAnnualDeclaration: {
      async execute({ year }) {
        const events = (await store.read()).filter((event) => event.date <= `${year}-12-31`);
        return tax.annualDeclaration({
          year,
          positions: snapshot(events),
          incomes: events.flatMap((event) => event.kind === "INCOME" ? [event.income] : []),
          sales: positions.realizedPnLForSales(events),
        });
      },
    },
  };
}
