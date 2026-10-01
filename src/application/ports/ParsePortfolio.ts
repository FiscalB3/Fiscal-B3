import type { PortfolioEvent } from "../../domain/events/PortfolioEvent";
import type { ImportLineError, ImportSource } from "./ImportOperations";

export interface ParsePortfolio {
  parse(source: ImportSource):
    | { ok: true; events: readonly PortfolioEvent[] }
    | { ok: false; errors: ImportLineError[] };
}
