import type { ParsePortfolio } from "../../application/ports/ParsePortfolio";
import { convertRowsToEvents } from "./EventConverter";
import { parseSpreadsheet } from "./SpreadsheetParser";

export const spreadsheetPortfolioParser: ParsePortfolio = {
  parse(source) {
    const parsed = parseSpreadsheet(Buffer.from(source.content));
    if (!parsed.success) {
      return { ok: false, errors: (parsed.errors ?? []).map((error) => ({ line: error.lineNumber, message: error.error })) };
    }
    const events = [];
    // Convert individually to retain the original spreadsheet line in errors.
    for (const [index, row] of (parsed.rows ?? []).entries()) {
      const converted = convertRowsToEvents([row]);
      if (!converted.success) {
        return { ok: false, errors: (converted.errors ?? []).map((error) => ({ line: index + 2, message: error.error })) };
      }
      events.push(...(converted.events ?? []).map((event) => ({ ...event, sequence: index })));
    }
    return { ok: true, events };
  },
};
