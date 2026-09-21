import type { AnnualDeclaration } from "../../application/ports/GetAnnualDeclaration";
import type { MonthlyApuration } from "../../application/ports/GetMonthlyApuration";
import type { Money } from "../../domain/money/Money";
import type { PositionSnapshot } from "../../domain/position/PositionSnapshot";

export type MoneyJson = { cents: number };

export function serializeMoney(money: Money): MoneyJson {
  return { cents: money.toCents() };
}

export function serializePosition(snapshot: PositionSnapshot) {
  return {
    ticker: snapshot.ticker,
    quantity: snapshot.quantity,
    averagePrice: serializeMoney(snapshot.averagePrice),
    acquisitionCost: serializeMoney(snapshot.acquisitionCost),
  };
}

export function serializeMonthlyApuration(apuration: MonthlyApuration) {
  return {
    month: apuration.month,
    result: serializeMoney(apuration.result),
    exemptionApplied: serializeMoney(apuration.exemptionApplied),
    darf: serializeMoney(apuration.darf),
  };
}

export function serializeAnnualDeclaration(declaration: AnnualDeclaration) {
  return {
    year: declaration.year,
    bensEDireitos: declaration.bensEDireitos.map(serializePosition),
    rendimentos: declaration.rendimentos.map((line) => ({
      kind: line.kind,
      amount: serializeMoney(line.amount),
    })),
  };
}
