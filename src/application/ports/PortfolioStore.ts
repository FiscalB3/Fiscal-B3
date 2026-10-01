import type { PortfolioEvent } from "../../domain/events/PortfolioEvent";

export interface PortfolioStore {
  read(): Promise<readonly PortfolioEvent[]>;
  /** Validates the combined history and appends the batch in one transaction. */
  append(events: readonly PortfolioEvent[], validate: (history: readonly PortfolioEvent[]) => void): Promise<void>;
}
