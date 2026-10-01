import type pg from "pg";
import { createPortfolioUseCases } from "../application/use-cases/createPortfolioUseCases";
import { spreadsheetPortfolioParser } from "./import/SpreadsheetPortfolioParser";
import { PostgresPortfolioStore } from "./persistence/PostgresPortfolioStore";

export function createRealPorts(pool: pg.Pool) {
  return createPortfolioUseCases(new PostgresPortfolioStore(pool), spreadsheetPortfolioParser);
}
