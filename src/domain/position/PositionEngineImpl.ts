import type { Asset } from "../assets/Asset";
import type { PortfolioEvent } from "../events/PortfolioEvent";
import { sortPortfolioEvents } from "../events/PortfolioEvent";
import { Money } from "../money/Money";
import type { PositionEngine } from "./PositionEngine";
import type { PositionSnapshot } from "./PositionSnapshot";
import type { SalePnL } from "../tax/SalePnL";

type Holding = {
  asset: Asset;
  quantity: number;
  acquisitionCost: Money;
};

export class PositionEngineImpl implements PositionEngine {
  replay(events: readonly PortfolioEvent[]): ReadonlyMap<string, PositionSnapshot> {
    const holdings = this.replayHoldings(events);
    return new Map(
      [...holdings.entries()].map(([ticker, holding]) => [ticker, this.toSnapshot(holding)]),
    );
  }

  realizedPnLForSales(events: readonly PortfolioEvent[]): readonly SalePnL[] {
    const holdings = new Map<string, Holding>();
    const sales: SalePnL[] = [];
    const sortedEvents = sortPortfolioEvents(events);

    for (const event of sortedEvents) {
      if (event.kind === "OPERATION") {
        const operation = event.operation;
        const holding = this.getOrCreateHolding(holdings, operation.asset);
        if (operation.kind === "COMPRA") {
          this.buy(holding, operation.quantity, operation.unitPrice, operation.brokerage, operation.b3Fees);
        } else {
          const averagePrice = this.averagePrice(holding);
          this.sell(holding, operation.quantity);
          const soldValue = operation.unitPrice
            .multiplyByQuantity(operation.quantity)
            .subtract(operation.brokerage)
            .subtract(operation.b3Fees);
          sales.push({
            asset: operation.asset,
            date: operation.date,
            modality: this.modalityForSale(sortedEvents, event),
            result: soldValue.subtract(averagePrice.multiplyByQuantity(operation.quantity)),
            soldValue,
            assetKind: operation.asset.kind,
          });
        }
      } else if (event.kind === "CORPORATE_ACTION") {
        const holding = this.getOrCreateHolding(holdings, event.action.asset);
        if (event.action.factor <= 0 || !Number.isFinite(event.action.factor)) {
          throw new Error("Invalid corporate action factor");
        }
        if (event.action.kind === "DESDOBRAMENTO") {
          holding.quantity *= event.action.factor;
        } else {
          holding.quantity /= event.action.factor;
        }
      }
    }

    return sales;
  }

  private replayHoldings(events: readonly PortfolioEvent[]): Map<string, Holding> {
    const holdings = new Map<string, Holding>();
    for (const event of sortPortfolioEvents(events)) {
      if (event.kind === "OPERATION") {
        const operation = event.operation;
        const holding = this.getOrCreateHolding(holdings, operation.asset);
        if (operation.kind === "COMPRA") {
          this.buy(holding, operation.quantity, operation.unitPrice, operation.brokerage, operation.b3Fees);
        } else {
          this.sell(holding, operation.quantity);
        }
      } else if (event.kind === "CORPORATE_ACTION") {
        const holding = this.getOrCreateHolding(holdings, event.action.asset);
        if (event.action.factor <= 0 || !Number.isFinite(event.action.factor)) {
          throw new Error("Invalid corporate action factor");
        }
        if (event.action.kind === "DESDOBRAMENTO") {
          holding.quantity *= event.action.factor;
        } else {
          holding.quantity /= event.action.factor;
        }
      }
    }
    return holdings;
  }

  private getOrCreateHolding(holdings: Map<string, Holding>, asset: Asset): Holding {
    const existing = holdings.get(asset.ticker);
    if (existing) return existing;
    const holding = { asset, quantity: 0, acquisitionCost: Money.fromCents(0) };
    holdings.set(asset.ticker, holding);
    return holding;
  }

  private buy(
    holding: Holding,
    quantity: number,
    unitPrice: Money,
    brokerage: Money,
    b3Fees: Money,
  ): void {
    this.validateQuantity(quantity);
    holding.quantity += quantity;
    holding.acquisitionCost = holding.acquisitionCost
      .add(unitPrice.multiplyByQuantity(quantity))
      .add(brokerage)
      .add(b3Fees);
  }

  private sell(holding: Holding, quantity: number): void {
    this.validateQuantity(quantity);
    if (quantity > holding.quantity) {
      throw new Error(`Insufficient position for ${holding.asset.ticker}`);
    }
    if (quantity === holding.quantity) {
      holding.quantity = 0;
      holding.acquisitionCost = Money.fromCents(0);
      return;
    }
    const averagePrice = this.averagePrice(holding);
    holding.quantity -= quantity;
    holding.acquisitionCost = averagePrice.multiplyByQuantity(holding.quantity);
  }

  private averagePrice(holding: Holding): Money {
    if (holding.quantity === 0) return Money.fromCents(0);
    return Money.fromCents(Math.round(holding.acquisitionCost.toCents() / holding.quantity));
  }

  private toSnapshot(holding: Holding): PositionSnapshot {
    return {
      ticker: holding.asset.ticker,
      quantity: holding.quantity,
      averagePrice: this.averagePrice(holding),
      acquisitionCost: holding.acquisitionCost,
    };
  }

  private modalityForSale(events: readonly PortfolioEvent[], sale: PortfolioEvent): SalePnL["modality"] {
    if (sale.kind !== "OPERATION" || sale.operation.kind !== "VENDA") {
      throw new Error("Expected sale operation");
    }
    return events.some(
      (event) =>
        event.kind === "OPERATION" &&
        event.operation.kind === "COMPRA" &&
        event.operation.asset.ticker === sale.operation.asset.ticker &&
        event.operation.date === sale.operation.date,
    )
      ? "DAY_TRADE"
      : "SWING";
  }

  private validateQuantity(quantity: number): void {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Invalid quantity");
    }
  }
}