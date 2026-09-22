import * as XLSX from "xlsx";
import type { ImportError, ImportResult, ImportRow } from "./ImportLayout";
import { REQUIRED_HEADERS } from "./ImportLayout";

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
}

function validateHeaders(normalizedHeaders: string[]): string | null {
  const missingHeaders = REQUIRED_HEADERS.filter(
    (h) => !normalizedHeaders.includes(h),
  );
  if (missingHeaders.length > 0) {
    return `Cabeçalho inválido. Colunas faltando: ${missingHeaders.join(", ")}`;
  }
  return null;
}

function parseRow(
  raw: Record<string, unknown>,
  lineNumber: number,
): { row: ImportRow | null; error: string | null } {
  try {
    const row: ImportRow = {
      tipo: String(raw.tipo || "").trim(),
      data: String(raw.data || "").trim(),
      ticker: String(raw.ticker || "").trim().toUpperCase(),
      tipo_ativo: String(raw.tipo_ativo || "").trim().toUpperCase(),
      operacao: raw.operacao ? String(raw.operacao).trim().toUpperCase() : "",
      quantidade: raw.quantidade ? String(raw.quantidade).trim() : "",
      preco_unitario: raw.preco_unitario
        ? String(raw.preco_unitario).trim()
        : "",
      corretagem: raw.corretagem ? String(raw.corretagem).trim() : "",
      taxas_b3: raw.taxas_b3 ? String(raw.taxas_b3).trim() : "",
      tipo_evento_corporativo: raw.tipo_evento_corporativo
        ? String(raw.tipo_evento_corporativo).trim().toUpperCase()
        : "",
      fator: raw.fator ? String(raw.fator).trim() : "",
      cnpj: raw.cnpj ? String(raw.cnpj).trim() : "",
      tipo_provento: raw.tipo_provento
        ? String(raw.tipo_provento).trim().toUpperCase()
        : "",
      valor: raw.valor ? String(raw.valor).trim() : "",
    };

    if (!row.tipo) {
      return { row: null, error: "Campo 'tipo' é obrigatório" };
    }
    if (!row.data) {
      return { row: null, error: "Campo 'data' é obrigatório" };
    }
    if (!row.ticker) {
      return { row: null, error: "Campo 'ticker' é obrigatório" };
    }
    if (!row.tipo_ativo) {
      return { row: null, error: "Campo 'tipo_ativo' é obrigatório" };
    }

    if (row.tipo === "OPERACAO") {
      if (!row.operacao)
        return { row: null, error: "Campo 'operacao' obrigatório para OPERACAO" };
      if (!row.quantidade)
        return {
          row: null,
          error: "Campo 'quantidade' obrigatório para OPERACAO",
        };
      if (!row.preco_unitario)
        return {
          row: null,
          error: "Campo 'preco_unitario' obrigatório para OPERACAO",
        };
      if (!row.corretagem)
        return {
          row: null,
          error: "Campo 'corretagem' obrigatório para OPERACAO",
        };
      if (!row.taxas_b3)
        return {
          row: null,
          error: "Campo 'taxas_b3' obrigatório para OPERACAO",
        };

      if (!["COMPRA", "VENDA"].includes(row.operacao)) {
        return {
          row: null,
          error: `Operação inválida: ${row.operacao}. Esperado: COMPRA ou VENDA`,
        };
      }

      if (isNaN(Number(row.quantidade)) || Number(row.quantidade) <= 0) {
        return { row: null, error: "Quantidade deve ser um número positivo" };
      }

      if (!isValidMoney(row.preco_unitario)) {
        return { row: null, error: "Preço unitário inválido (formato XX.XX)" };
      }

      if (!isValidMoney(row.corretagem)) {
        return { row: null, error: "Corretagem inválida (formato XX.XX)" };
      }

      if (!isValidMoney(row.taxas_b3)) {
        return { row: null, error: "Taxas B3 inválida (formato XX.XX)" };
      }
    }

    if (row.tipo === "EVENTO_CORPORATIVO") {
      if (!row.tipo_evento_corporativo)
        return {
          row: null,
          error: "Campo 'tipo_evento_corporativo' obrigatório para EVENTO_CORPORATIVO",
        };
      if (!row.fator)
        return {
          row: null,
          error: "Campo 'fator' obrigatório para EVENTO_CORPORATIVO",
        };

      if (!["DESDOBRAMENTO", "GRUPAMENTO"].includes(row.tipo_evento_corporativo)) {
        return {
          row: null,
          error: `Tipo de evento corporativo inválido: ${row.tipo_evento_corporativo}`,
        };
      }

      if (isNaN(Number(row.fator)) || Number(row.fator) <= 0) {
        return { row: null, error: "Fator deve ser um número positivo" };
      }
    }

    if (row.tipo === "PROVENTO") {
      if (!row.tipo_provento)
        return {
          row: null,
          error: "Campo 'tipo_provento' obrigatório para PROVENTO",
        };

      if (
        !["DIVIDENDO", "JCP", "RENDIMENTO_FII"].includes(row.tipo_provento)
      ) {
        return {
          row: null,
          error: `Tipo de provento inválido: ${row.tipo_provento}`,
        };
      }

      if (!row.valor)
        return {
          row: null,
          error: "Campo 'valor' obrigatório para PROVENTO",
        };

      if (!isValidMoney(row.valor)) {
        return { row: null, error: "Valor do provento inválido (formato XX.XX)" };
      }
    }

    if (!["OPERACAO", "EVENTO_CORPORATIVO", "PROVENTO"].includes(row.tipo)) {
      return {
        row: null,
        error: `Tipo de evento inválido: ${row.tipo}. Esperado: OPERACAO, EVENTO_CORPORATIVO ou PROVENTO`,
      };
    }

    if (!["ACAO", "FII"].includes(row.tipo_ativo)) {
      return {
        row: null,
        error: `Tipo de ativo inválido: ${row.tipo_ativo}. Esperado: ACAO ou FII`,
      };
    }

    if (!isValidDate(row.data)) {
      return { row: null, error: `Data inválida: ${row.data}. Esperado: YYYY-MM-DD` };
    }

    return { row, error: null };
  } catch (err) {
    return {
      row: null,
      error: `Erro ao processar linha: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function isValidMoney(value: string): boolean {
  if (!value) return false;
  const regex = /^-?\d+\.\d{2}$/;
  return regex.test(value);
}

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(`${dateStr}T00:00:00Z`);
  return date instanceof Date && !isNaN(date.getTime());
}

export function parseSpreadsheet(buffer: Buffer): ImportResult {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer", raw: true });

    if (!workbook.SheetNames.length) {
      return {
        success: false,
        errors: [
          {
            lineNumber: 0,
            error: "Arquivo vazio ou sem abas",
          },
        ],
      };
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Read as array of arrays to preserve formatting
    const rawData: (string | number)[][] = [];
    if (worksheet["!ref"]) {
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let row = range.s.r; row <= range.e.r; row++) {
        const rowData: (string | number)[] = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          rowData.push(cell ? String(cell.v) : "");
        }
        rawData.push(rowData);
      }
    }

    if (rawData.length === 0) {
      return {
        success: false,
        errors: [
          {
            lineNumber: 0,
            error: "Arquivo vazio ou sem dados",
          },
        ],
      };
    }

    const headerRow = rawData[0];
    if (!headerRow || headerRow.length === 0) {
      return {
        success: false,
        errors: [
          {
            lineNumber: 1,
            error: "Cabeçalho não encontrado",
          },
        ],
      };
    }

    const normalizedHeaders = normalizeHeaders(headerRow.map((h) => String(h)));

    const headerError = validateHeaders(normalizedHeaders);
    if (headerError) {
      return {
        success: false,
        errors: [
          {
            lineNumber: 1,
            error: headerError,
          },
        ],
      };
    }

    const errors: ImportError[] = [];
    const rows: ImportRow[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const rawRow = rawData[i];

      if (!rawRow) {
        continue;
      }

      const rowObj: Record<string, unknown> = {};
      for (let j = 0; j < normalizedHeaders.length; j++) {
        rowObj[normalizedHeaders[j]] = rawRow[j] || "";
      }

      const { row, error } = parseRow(rowObj, i + 1);

      if (error) {
        errors.push({ lineNumber: i + 1, error });
      } else if (row) {
        rows.push(row);
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
      rows,
    };
  } catch (err) {
    return {
      success: false,
      errors: [
        {
          lineNumber: 0,
          error: `Erro ao processar arquivo: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }
}
