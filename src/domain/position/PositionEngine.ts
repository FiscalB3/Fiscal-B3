import type { PortfolioEvent } from "../events/PortfolioEvent";
import type { PositionSnapshot } from "./PositionSnapshot";
import type { SalePnL } from "../tax/SalePnL";

export interface PositionEngine {
  replay(events: readonly PortfolioEvent[]): ReadonlyMap<string, PositionSnapshot>;
  realizedPnLForSales(events: readonly PortfolioEvent[]): readonly SalePnL[];
}
