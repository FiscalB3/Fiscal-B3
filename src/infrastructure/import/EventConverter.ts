import type {
  CorporateAction,
  CorporateActionKind,
} from "../../domain/corporate-actions/CorporateAction";
import type { Asset } from "../../domain/assets/Asset";
import { createAsset } from "../../domain/assets/Asset";
import type { Income, IncomeKind } from "../../domain/incomes/Income";
import type { Operation, OperationKind } from "../../domain/operations/Operation";
import type { PortfolioEvent } from "../../domain/events/PortfolioEvent";
import { Money } from "../../domain/money/Money";
import type { ImportRow } from "./ImportLayout";

export type ConversionError = {
  lineNumber: number;
  error: string;
};

export type ConversionResult = {
  success: boolean;
  events?: PortfolioEvent[];
  errors?: ConversionError[];
};

let sequenceCounter = 0;

export function resetSequence(): void {
  sequenceCounter = 0;
}

export function convertRowsToEvents(rows: ImportRow[]): ConversionResult {
  const errors: ConversionError[] = [];
  const events: PortfolioEvent[] = [];

  // Sort by date and sequence to ensure deterministic processing
  const sortedRows = [...rows].sort((a, b) => {
    const dateCompare = a.data.localeCompare(b.data);
    if (dateCompare !== 0) return dateCompare;
    return 0;
  });

  for (let i = 0; i < sortedRows.length; i++) {
    const row = sortedRows[i];
    const lineNumber = i + 1;

    try {
      if (row.tipo === "OPERACAO") {
        const asset = createAsset({
          ticker: row.ticker,
          kind: row.tipo_ativo as Asset["kind"],
          cnpj: row.cnpj || undefined,
        });

        const operation: Operation = {
          asset,
          date: row.data,
          kind: row.operacao as OperationKind,
          quantity: Number(row.quantidade),
          unitPrice: Money.fromReais(row.preco_unitario!),
          brokerage: Money.fromReais(row.corretagem!),
          b3Fees: Money.fromReais(row.taxas_b3!),
        };

        const event: PortfolioEvent = {
          date: row.data,
          sequence: sequenceCounter++,
          kind: "OPERATION",
          operation,
        };

        events.push(event);
      } else if (row.tipo === "EVENTO_CORPORATIVO") {
        const asset = createAsset({
          ticker: row.ticker,
          kind: row.tipo_ativo as Asset["kind"],
          cnpj: row.cnpj || undefined,
        });

        const action: CorporateAction = {
          asset,
          date: row.data,
          kind: row.tipo_evento_corporativo as CorporateActionKind,
          factor: Number(row.fator),
        };

        const event: PortfolioEvent = {
          date: row.data,
          sequence: sequenceCounter++,
          kind: "CORPORATE_ACTION",
          action,
        };

        events.push(event);
      } else if (row.tipo === "PROVENTO") {
        const asset = createAsset({
          ticker: row.ticker,
          kind: row.tipo_ativo as Asset["kind"],
          cnpj: row.cnpj || undefined,
        });

        const income: Income = {
          asset,
          date: row.data,
          kind: row.tipo_provento as IncomeKind,
          amount: Money.fromReais(row.valor!),
        };

        const event: PortfolioEvent = {
          date: row.data,
          sequence: sequenceCounter++,
          kind: "INCOME",
          income,
        };

        events.push(event);
      }
    } catch (err) {
      errors.push({
        lineNumber,
        error: `Erro ao converter linha: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    events,
  };
}
