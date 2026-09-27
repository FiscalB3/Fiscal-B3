import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type pg from "pg";
import { Money } from "../../domain/money/Money";
import type { CorporateAction } from "../../domain/corporate-actions/CorporateAction";
import type { Income } from "../../domain/incomes/Income";
import type { Operation } from "../../domain/operations/Operation";
import { AtivoRepository } from "./AtivoRepository";
import { createPool } from "./db";
import { EventoCorporativoRepository } from "./EventoCorporativoRepository";
import { runMigrations } from "./migrate";
import { OperacaoRepository } from "./OperacaoRepository";
import { ProventoRepository } from "./ProventoRepository";

// Requer um Postgres acessível via DATABASE_URL (ou PGHOST/PGPORT/PGUSER/
// PGPASSWORD/PGDATABASE), por exemplo `docker compose up -d postgres`.
describe("Postgres persistence (T5)", () => {
  let pool: pg.Pool;
  let ativos: AtivoRepository;
  let operacoes: OperacaoRepository;
  let proventos: ProventoRepository;
  let eventosCorporativos: EventoCorporativoRepository;

  beforeAll(async () => {
    pool = createPool();
    await runMigrations(pool);
    ativos = new AtivoRepository(pool);
    operacoes = new OperacaoRepository(pool, ativos);
    proventos = new ProventoRepository(pool, ativos);
    eventosCorporativos = new EventoCorporativoRepository(pool, ativos);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(
      "TRUNCATE TABLE operacoes, proventos, eventos_corporativos, ativos RESTART IDENTITY CASCADE",
    );
  });

  it("migrations criam as tabelas ativos, operacoes, proventos e eventos_corporativos", async () => {
    const result = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('ativos', 'operacoes', 'proventos', 'eventos_corporativos')`,
    );

    expect(result.rows.map((row) => row.table_name).sort()).toEqual([
      "ativos",
      "eventos_corporativos",
      "operacoes",
      "proventos",
    ]);
  });

  it("AtivoRepository insere e lista ativos", async () => {
    await ativos.obterOuCriarId({ ticker: "petr4", kind: "ACAO" });
    await ativos.obterOuCriarId({ ticker: "MXRF11", kind: "FII" });

    const lista = await ativos.listar();

    expect(lista).toEqual([
      { ticker: "MXRF11", kind: "FII" },
      { ticker: "petr4", kind: "ACAO" },
    ]);
  });

  it("OperacaoRepository insere fora de ordem e lista em ordem cronológica", async () => {
    const asset = { ticker: "PETR4", kind: "ACAO" } as const;
    const compraTardia: Operation = {
      asset,
      date: "2024-03-10",
      kind: "COMPRA",
      quantity: 100,
      unitPrice: Money.fromReais("30.00"),
      brokerage: Money.fromReais("0.00"),
      b3Fees: Money.fromReais("0.00"),
    };
    const compraAntecipada: Operation = {
      ...compraTardia,
      date: "2024-01-05",
      quantity: 50,
      unitPrice: Money.fromReais("28.00"),
    };

    await operacoes.inserir(compraTardia);
    await operacoes.inserir(compraAntecipada);

    const lista = await operacoes.listar();

    expect(lista.map((op) => op.date)).toEqual(["2024-01-05", "2024-03-10"]);
    expect(lista[0]?.quantity).toBe(50);
    expect(lista[1]?.quantity).toBe(100);
  });

  it("ProventoRepository insere fora de ordem e lista em ordem cronológica", async () => {
    const asset = { ticker: "MXRF11", kind: "FII" } as const;
    const proventoTardio: Income = {
      asset,
      date: "2024-06-15",
      kind: "RENDIMENTO_FII",
      amount: Money.fromReais("10.50"),
    };
    const proventoAntecipado: Income = {
      ...proventoTardio,
      date: "2024-02-15",
      amount: Money.fromReais("9.20"),
    };

    await proventos.inserir(proventoTardio);
    await proventos.inserir(proventoAntecipado);

    const lista = await proventos.listar();

    expect(lista.map((p) => p.date)).toEqual(["2024-02-15", "2024-06-15"]);
    expect(lista[0]?.amount.toCents()).toBe(920);
  });

  it("EventoCorporativoRepository insere fora de ordem e lista em ordem cronológica", async () => {
    const asset = { ticker: "PETR4", kind: "ACAO" } as const;
    const grupamento: CorporateAction = {
      asset,
      date: "2024-05-01",
      kind: "GRUPAMENTO",
      factor: 0.5,
    };
    const desdobramento: CorporateAction = {
      asset,
      date: "2024-01-20",
      kind: "DESDOBRAMENTO",
      factor: 2,
    };

    await eventosCorporativos.inserir(grupamento);
    await eventosCorporativos.inserir(desdobramento);

    const lista = await eventosCorporativos.listar();

    expect(lista.map((e) => e.date)).toEqual(["2024-01-20", "2024-05-01"]);
    expect(lista[0]?.kind).toBe("DESDOBRAMENTO");
    expect(lista[1]?.kind).toBe("GRUPAMENTO");
  });

  it("não expõe update/delete: reinserir a mesma operação preserva o histórico (append-only)", async () => {
    const operacao: Operation = {
      asset: { ticker: "PETR4", kind: "ACAO" },
      date: "2024-01-05",
      kind: "COMPRA",
      quantity: 100,
      unitPrice: Money.fromReais("30.00"),
      brokerage: Money.fromReais("0.00"),
      b3Fees: Money.fromReais("0.00"),
    };

    await operacoes.inserir(operacao);
    await operacoes.inserir(operacao);

    const lista = await operacoes.listar();

    expect(lista).toHaveLength(2);
    expect("atualizar" in operacoes).toBe(false);
    expect("update" in operacoes).toBe(false);
    expect("deletar" in operacoes).toBe(false);
    expect("delete" in operacoes).toBe(false);
  });
});