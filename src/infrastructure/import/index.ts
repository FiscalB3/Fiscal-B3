import type { PortfolioEvent } from "../../domain/events/PortfolioEvent";
import { parseSpreadsheet } from "./SpreadsheetParser";
import { convertRowsToEvents, resetSequence } from "./EventConverter";
import type { ConversionError } from "./EventConverter";

export type ImportError = {
  lineNumber: number;
  error: string;
};

export type ImportResult = {
  success: boolean;
  events?: PortfolioEvent[];
  errors?: ImportError[];
};

export function importSpreadsheet(buffer: Buffer): ImportResult {
  resetSequence();

  const parseResult = parseSpreadsheet(buffer);

  if (!parseResult.success) {
    return {
      success: false,
      errors: parseResult.errors,
    };
  }

  const convertResult = convertRowsToEvents(parseResult.rows || []);

  if (!convertResult.success) {
    return {
      success: false,
      errors: convertResult.errors as ImportError[],
    };
  }

  return {
    success: true,
    events: convertResult.events,
  };
}
