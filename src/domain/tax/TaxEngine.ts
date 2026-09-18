import type { Income } from "../incomes/Income";
import { Money } from "../money/Money";
import type { PositionSnapshot } from "../position/PositionSnapshot";
import type { SalePnL } from "./SalePnL";

const ZERO = Money.fromCents(0);
const SWING_STOCK_EXEMPTION_LIMIT = Money.fromReais("20000.00");
const SWING_STOCK_RATE = 15;
const DAY_TRADE_RATE = 20;
const FII_RATE = 20;

export type MonthlyTaxApuration = {
  month: string;
  result: Money;
  exemptionApplied: Money;
  darf: Money;
};

export type AnnualIncomeLine = {
  kind: "DIVIDENDO" | "JCP" | "RENDIMENTO_FII" | "GANHO_DE_CAPITAL";
  amount: Money;
};

export type AnnualTaxDeclaration = {
  year: number;
  bensEDireitos: readonly PositionSnapshot[];
  rendimentos: readonly AnnualIncomeLine[];
};

function sum(amounts: readonly Money[]): Money {
  return amounts.reduce((total, amount) => total.add(amount), ZERO);
}

function isPositive(amount: Money): boolean {
  return amount.compare(ZERO) > 0;
}

function atMostZero(amount: Money): Money {
  return isPositive(amount) ? amount : ZERO;
}

function percentOf(amount: Money, rate: number): Money {
  if (!isPositive(amount)) {
    return ZERO;
  }
  return Money.fromCents(Math.trunc((amount.toCents() * rate) / 100));
}

function inMonth(sale: SalePnL, month: string): boolean {
  return sale.date.slice(0, 7) === month;
}

function inYear(date: string, year: number): boolean {
  return date.startsWith(`${year}-`);
}

export class TaxEngine {
  monthlyApuration(sales: readonly SalePnL[], month: string): MonthlyTaxApuration {
    const monthSales = sales.filter((sale) => inMonth(sale, month));
    const dayTrades = monthSales.filter((sale) => sale.modality === "DAY_TRADE");
    const swingStocks = monthSales.filter(
      (sale) => sale.modality === "SWING" && sale.assetKind === "ACAO",
    );
    const swingFiis = monthSales.filter(
      (sale) => sale.modality === "SWING" && sale.assetKind === "FII",
    );

    const swingStockNet = sum(swingStocks.map((sale) => sale.result));
    const swingStockSold = sum(swingStocks.map((sale) => sale.soldValue));
    const exemptSwing =
      swingStockSold.compare(SWING_STOCK_EXEMPTION_LIMIT) <= 0 ? atMostZero(swingStockNet) : ZERO;
    const taxableSwingStock = exemptSwing.equals(ZERO) ? atMostZero(swingStockNet) : ZERO;

    const dayTax = percentOf(sum(dayTrades.map((sale) => sale.result)), DAY_TRADE_RATE);
    const fiiTax = percentOf(sum(swingFiis.map((sale) => sale.result)), FII_RATE);
    const swingTax = percentOf(taxableSwingStock, SWING_STOCK_RATE);

    return {
      month,
      result: sum(monthSales.map((sale) => sale.result)),
      exemptionApplied: exemptSwing,
      darf: dayTax.add(fiiTax).add(swingTax),
    };
  }

  annualDeclaration(input: {
    year: number;
    positions: readonly PositionSnapshot[];
    incomes: readonly Income[];
    sales: readonly SalePnL[];
  }): AnnualTaxDeclaration {
    const yearIncomes = input.incomes.filter((income) => inYear(income.date, input.year));
    const sumKind = (kind: Income["kind"]): Money =>
      sum(yearIncomes.filter((income) => income.kind === kind).map((income) => income.amount));
    const yearGain = sum(
      input.sales.filter((sale) => inYear(sale.date, input.year)).map((sale) => sale.result),
    );

    return {
      year: input.year,
      bensEDireitos: input.positions,
      rendimentos: [
        { kind: "DIVIDENDO", amount: sumKind("DIVIDENDO") },
        { kind: "JCP", amount: sumKind("JCP") },
        { kind: "RENDIMENTO_FII", amount: sumKind("RENDIMENTO_FII") },
        { kind: "GANHO_DE_CAPITAL", amount: yearGain },
      ],
    };
  }
}
