import { describe, it, expect, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import { importSpreadsheet } from "./index";
import { resetSequence } from "./EventConverter";

function createCSVBuffer(data: string): Buffer {
  return Buffer.from(data, "utf-8");
}

function createXLSXBuffer(rows: (string | number)[][]): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  return Buffer.from(XLSX.write(workbook, { type: "buffer" }));
}

const validHeaders =
  "tipo,data,ticker,tipo_ativo,operacao,quantidade,preco_unitario,corretagem,taxas_b3,tipo_evento_corporativo,fator,cnpj,tipo_provento,valor";

describe("Spreadsheet Import", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("CSV Import", () => {
    it("should import valid operation", () => {
      const csv = `${validHeaders}
OPERACAO,2026-01-15,PETR4,ACAO,COMPRA,100,25.50,50.00,10.00,,,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events?.[0].kind).toBe("OPERATION");
      expect(result.events?.[0].operation?.quantity).toBe(100);
    });

    it("should reject invalid header", () => {
      const csv = `tipo,data,ticker
OPERACAO,2026-01-15,PETR4`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].error).toContain("Cabeçalho inválido");
    });

    it("should reject invalid operation kind", () => {
      const csv = `${validHeaders}
OPERACAO,2026-01-15,PETR4,ACAO,INVALIDO,100,25.50,50.00,10.00,,,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].error).toContain("Operação inválida");
    });

    it("should reject negative quantity", () => {
      const csv = `${validHeaders}
OPERACAO,2026-01-15,PETR4,ACAO,COMPRA,-100,25.50,50.00,10.00,,,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].error).toContain("positivo");
    });

    it("should reject invalid money format", () => {
      const csv = `${validHeaders}
OPERACAO,2026-01-15,PETR4,ACAO,COMPRA,100,25.5,50.00,10.00,,,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].error).toContain("Preço unitário inválido");
    });

    it("should reject invalid date format", () => {
      const csv = `${validHeaders}
OPERACAO,15/01/2026,PETR4,ACAO,COMPRA,100,25.50,50.00,10.00,,,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].error).toContain("Data inválida");
    });

    it("should import corporate action (split)", () => {
      const csv = `${validHeaders}
EVENTO_CORPORATIVO,2026-01-20,PETR4,ACAO,,,,,,DESDOBRAMENTO,2.0,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events?.[0].kind).toBe("CORPORATE_ACTION");
      expect(result.events?.[0].action?.factor).toBe(2.0);
    });

    it("should reject invalid corporate action type", () => {
      const csv = `${validHeaders}
EVENTO_CORPORATIVO,2026-01-20,PETR4,ACAO,,,,,,INVALIDO,2.0,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].error).toContain("Tipo de evento corporativo");
    });

    it("should import income (dividend)", () => {
      const csv = `${validHeaders}
PROVENTO,2026-01-25,PETR4,ACAO,,,,,,,,,DIVIDENDO,100.50`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events?.[0].kind).toBe("INCOME");
      expect(result.events?.[0].income?.kind).toBe("DIVIDENDO");
    });

    it("should reject invalid income type", () => {
      const csv = `${validHeaders}
PROVENTO,2026-01-25,PETR4,ACAO,,,,,,,,INVALIDO,100.50`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].error).toContain("Tipo de provento");
    });

    it("should import multiple events in order", () => {
      const csv = `${validHeaders}
OPERACAO,2026-01-15,PETR4,ACAO,COMPRA,100,25.50,50.00,10.00,,,,
OPERACAO,2026-01-20,PETR4,ACAO,VENDA,50,26.00,50.00,10.00,,,,
PROVENTO,2026-01-25,PETR4,ACAO,,,,,,,,,DIVIDENDO,100.50`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(3);
      expect(result.events?.[0].kind).toBe("OPERATION");
      expect(result.events?.[1].kind).toBe("OPERATION");
      expect(result.events?.[2].kind).toBe("INCOME");
    });
  });

  describe("XLSX Import", () => {
    it("should import valid operation from XLSX", () => {
      const rows = [
        [
          "tipo",
          "data",
          "ticker",
          "tipo_ativo",
          "operacao",
          "quantidade",
          "preco_unitario",
          "corretagem",
          "taxas_b3",
          "tipo_evento_corporativo",
          "fator",
          "cnpj",
          "tipo_provento",
          "valor",
        ],
        [
          "OPERACAO",
          "2026-01-15",
          "PETR4",
          "ACAO",
          "COMPRA",
          100,
          "25.50",
          "50.00",
          "10.00",
          "",
          "",
          "",
          "",
          "",
        ],
      ];
      const buffer = createXLSXBuffer(rows);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
    });

    it("CSV and XLSX with same content should produce identical events", () => {
      const csvData = `${validHeaders}
OPERACAO,2026-01-15,PETR4,ACAO,COMPRA,100,25.50,50.00,10.00,,,,
PROVENTO,2026-01-25,PETR4,ACAO,,,,,,,,,DIVIDENDO,100.50`;

      const xlsxRows = [
        [
          "tipo",
          "data",
          "ticker",
          "tipo_ativo",
          "operacao",
          "quantidade",
          "preco_unitario",
          "corretagem",
          "taxas_b3",
          "tipo_evento_corporativo",
          "fator",
          "cnpj",
          "tipo_provento",
          "valor",
        ],
        [
          "OPERACAO",
          "2026-01-15",
          "PETR4",
          "ACAO",
          "COMPRA",
          100,
          "25.50",
          "50.00",
          "10.00",
          "",
          "",
          "",
          "",
          "",
        ],
        [
          "PROVENTO",
          "2026-01-25",
          "PETR4",
          "ACAO",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "DIVIDENDO",
          "100.50",
        ],
      ];

      resetSequence();
      const csvResult = importSpreadsheet(createCSVBuffer(csvData));
      resetSequence();
      const xlsxResult = importSpreadsheet(createXLSXBuffer(xlsxRows));

      expect(csvResult.success).toBe(true);
      expect(xlsxResult.success).toBe(true);
      expect(csvResult.events).toHaveLength(xlsxResult.events?.length);

      for (let i = 0; i < (csvResult.events?.length || 0); i++) {
        const csvEvent = csvResult.events?.[i];
        const xlsxEvent = xlsxResult.events?.[i];
        expect(csvEvent?.kind).toBe(xlsxEvent?.kind);
        expect(csvEvent?.date).toBe(xlsxEvent?.date);
      }
    });
  });

  describe("Error handling", () => {
    it("should report multiple errors in one result", () => {
      const csv = `${validHeaders}
OPERACAO,2026-01-15,PETR4,ACAO,INVALIDO,100,25.50,50.00,10.00,,,,
PROVENTO,2026-01-25,PETR4,ACAO,,,,,,,,INVALIDO,100.50`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors?.length).toBe(2);
    });

    it("should handle empty file", () => {
      const buffer = Buffer.from("");
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("should require 'tipo' field", () => {
      const csv = `${validHeaders}
,2026-01-15,PETR4,ACAO,COMPRA,100,25.50,50.00,10.00,,,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].error).toContain("tipo");
    });

    it("should reject invalid asset type", () => {
      const csv = `${validHeaders}
OPERACAO,2026-01-15,PETR4,INVALIDO,COMPRA,100,25.50,50.00,10.00,,,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(false);
      expect(result.errors?.[0].error).toContain("Tipo de ativo");
    });

    it("should normalize ticker to uppercase", () => {
      const csv = `${validHeaders}
OPERACAO,2026-01-15,petr4,ACAO,COMPRA,100,25.50,50.00,10.00,,,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(true);
      expect(result.events?.[0].operation?.asset.ticker).toBe("PETR4");
    });
  });

  describe("Sequence numbering", () => {
    it("should assign sequential numbers to events on same date", () => {
      const csv = `${validHeaders}
OPERACAO,2026-01-15,PETR4,ACAO,COMPRA,100,25.50,50.00,10.00,,,,
OPERACAO,2026-01-15,PETR4,ACAO,COMPRA,50,26.00,50.00,10.00,,,,`;
      const buffer = createCSVBuffer(csv);
      const result = importSpreadsheet(buffer);

      expect(result.success).toBe(true);
      expect(result.events?.[0].sequence).toBe(0);
      expect(result.events?.[1].sequence).toBe(1);
    });
  });
});
