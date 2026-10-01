import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type pg from "pg";
import request from "supertest";
import * as XLSX from "xlsx";
import { createRealPorts } from "./createRealPorts";
import { createApp } from "../interface/http/createApp";
import { createPool } from "./persistence/db";
import { runMigrations } from "./persistence/migrate";
import { PostgresPortfolioStore } from "./persistence/PostgresPortfolioStore";
import { REQUIRED_HEADERS } from "./import/ImportLayout";

const buy = ["OPERACAO", "2024-01-02", "TEST11", "FII", "COMPRA", "100", "10.00", "0.00", "0.00", "", "", "", "", ""];
const sell = ["OPERACAO", "2024-02-02", "TEST11", "FII", "VENDA", "20", "15.00", "0.00", "0.00", "", "", "", "", ""];
const income = ["PROVENTO", "2024-02-10", "TEST11", "FII", "", "", "", "", "", "", "", "", "RENDIMENTO_FII", "8.00"];
const csv = (rows: string[][]) => Buffer.from([REQUIRED_HEADERS, ...rows].map((row) => row.join(",")).join("\n"));
const source = (rows: string[][]) => ({ filename: "events.csv", mimeType: "text/csv", content: csv(rows) });

describe("T7 real PostgreSQL integration (MVP-12)", () => {
  let admin: pg.Pool;
  let pool: pg.Pool;
  const schema = `t7_${process.pid}`;
  const app = () => createApp(createRealPorts(pool));
  const upload = (rows: string[][]) => request(app()).post("/imports").attach("file", csv(rows), { filename: "events.csv", contentType: "text/csv" });
  const counts = async () => {
    const result = await pool.query("SELECT (SELECT count(*)::int FROM ativos) AS assets, (SELECT count(*)::int FROM operacoes) AS operations, (SELECT count(*)::int FROM proventos) AS incomes, (SELECT count(*)::int FROM eventos_corporativos) AS actions");
    return result.rows[0];
  };

  beforeAll(async () => {
    admin = createPool();
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = createPool({ options: `-c search_path=${schema}` });
    await runMigrations(pool);
  });
  beforeEach(async () => {
    await pool.query("TRUNCATE operacoes, proventos, eventos_corporativos, ativos RESTART IDENTITY CASCADE");
  });
  afterAll(async () => {
    await pool?.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });

  it("imports CSV and returns real portfolio, monthly DARF and annual income", async () => {
    expect((await upload([buy, sell, income])).body).toEqual({ ok: true });
    expect(await counts()).toEqual({ assets: 1, operations: 2, incomes: 1, actions: 0 });
    const portfolio = await request(app()).get("/portfolio");
    expect(portfolio.status).toBe(200);
    expect(portfolio.body).toEqual([{ ticker: "TEST11", quantity: 80, averagePrice: { cents: 1000 }, acquisitionCost: { cents: 80000 } }]);
    const month = await request(app()).get("/apuration?month=2024-02");
    expect(month.status).toBe(200);
    expect(month.body).toEqual({ month: "2024-02", result: { cents: 10000 }, exemptionApplied: { cents: 0 }, darf: { cents: 2000 } });
    const annual = await request(app()).get("/declaration?year=2024");
    expect(annual.status).toBe(200);
    expect(annual.body).toEqual({ year: 2024, bensEDireitos: portfolio.body, rendimentos: [{ kind: "DIVIDENDO", amount: { cents: 0 } }, { kind: "JCP", amount: { cents: 0 } }, { kind: "RENDIMENTO_FII", amount: { cents: 800 } }, { kind: "GANHO_DE_CAPITAL", amount: { cents: 10000 } }] });
  });

  it("imports XLSX through the same real flow", async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([REQUIRED_HEADERS, buy, sell, income]), "events");
    const response = await request(app()).post("/imports").attach("file", XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }), { filename: "events.xlsx", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    const ports = createRealPorts(pool);
    expect((await ports.getPortfolio.execute())[0].quantity).toBe(80);
    expect((await ports.getMonthlyApuration.execute({ month: "2024-02" })).darf.toCents()).toBe(2000);
  });

  it("rejects a whole file with an invalid line and preserves previous data", async () => {
    await upload([buy]);
    const bad = [...sell]; bad[5] = "-1";
    const response = await upload([income, bad]);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ errors: [{ line: 3, message: "Quantidade deve ser um número positivo" }] });
    expect(await counts()).toEqual({ assets: 1, operations: 1, incomes: 0, actions: 0 });
  });

  it("rejects an invalid history before persisting assets or events", async () => {
    const response = await upload([sell]);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ errors: [{ line: 0, message: "Insufficient position for TEST11" }] });
    expect(await counts()).toEqual({ assets: 0, operations: 0, incomes: 0, actions: 0 });
  });

  it("rolls back earlier writes when PostgreSQL rejects a later row", async () => {
    await pool.query(`
      CREATE FUNCTION reject_test_sale() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.kind = 'VENDA' THEN
          RAISE EXCEPTION 'T7 controlled write failure';
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER reject_test_sale BEFORE INSERT ON operacoes
      FOR EACH ROW EXECUTE FUNCTION reject_test_sale();
    `);
    try {
      await expect(createRealPorts(pool).importOperations.execute(source([buy, sell])))
        .rejects.toThrow("T7 controlled write failure");
      expect(await counts()).toEqual({ assets: 0, operations: 0, incomes: 0, actions: 0 });
    } finally {
      await pool.query("DROP TRIGGER reject_test_sale ON operacoes; DROP FUNCTION reject_test_sale()");
    }
  });

  it("rebuilds identically with a fresh pool and application", async () => {
    await upload([buy, sell, income]);
    const fresh = createPool({ options: `-c search_path=${schema}` });
    try {
      const ports = createRealPorts(fresh);
      expect((await ports.getPortfolio.execute())[0].acquisitionCost.toCents()).toBe(80000);
      expect((await ports.getMonthlyApuration.execute({ month: "2024-02" })).darf.toCents()).toBe(2000);
    } finally { await fresh.end(); }
  });

  it("preserves same-day order between operations and corporate actions", async () => {
    const split = ["EVENTO_CORPORATIVO", "2024-01-02", "TEST11", "FII", "", "", "", "", "", "DESDOBRAMENTO", "2", "", "", ""];
    expect((await upload([buy, split])).status).toBe(200);
    const positions = await createRealPorts(pool).getPortfolio.execute();
    expect(positions[0].quantity).toBe(200);
    expect(positions[0].averagePrice.toCents()).toBe(500);
    expect(positions[0].acquisitionCost.toCents()).toBe(100000);
    const events = await new PostgresPortfolioStore(pool).read();
    expect(events.map((event) => event.kind)).toEqual(["OPERATION", "CORPORATE_ACTION"]);
    expect(events[0].sequence).toBeLessThan(events[1].sequence);
  });

  it("sorts out-of-order files and appends separate imports", async () => {
    expect((await upload([sell, buy])).status).toBe(200);
    expect((await upload([income])).status).toBe(200);
    expect((await createRealPorts(pool).getPortfolio.execute())[0].quantity).toBe(80);
    expect((await new PostgresPortfolioStore(pool).read()).map((event) => event.date)).toEqual(["2024-01-02", "2024-02-02", "2024-02-10"]);
  });

  it("excludes future-year events from annual positions and income", async () => {
    const futureBuy = [...buy]; futureBuy[1] = "2025-01-02"; futureBuy[5] = "10"; futureBuy[6] = "20.00";
    const futureIncome = [...income]; futureIncome[1] = "2025-01-03";
    await upload([futureBuy, futureIncome, buy, sell, income]);
    const annual = await createRealPorts(pool).getAnnualDeclaration.execute({ year: 2024 });
    expect(annual.bensEDireitos[0].quantity).toBe(80);
    expect(annual.bensEDireitos[0].acquisitionCost.toCents()).toBe(80000);
    expect(annual.rendimentos.map((row) => row.amount.toCents())).toEqual([0, 0, 800, 10000]);
  });

  it("returns empty portfolio and zero monthly values without seed data", async () => {
    expect((await request(app()).get("/portfolio")).body).toEqual([]);
    expect((await request(app()).get("/apuration?month=2024-02")).body).toEqual({ month: "2024-02", result: { cents: 0 }, exemptionApplied: { cents: 0 }, darf: { cents: 0 } });
    expect((await request(app()).get("/declaration?year=2024")).body.bensEDireitos).toEqual([]);
  });

  it("serializes concurrent sales against the committed history", async () => {
    await upload([buy]);
    const largeSale = [...sell]; largeSale[5] = "80";
    const results = await Promise.all([upload([largeSale]), upload([largeSale])]);
    expect(results.map((response) => response.status).sort()).toEqual([200, 400]);
    expect((await createRealPorts(pool).getPortfolio.execute())[0].quantity).toBe(20);
    expect(await counts()).toEqual({ assets: 1, operations: 2, incomes: 0, actions: 0 });
  });

  it("does not silently return mock data for optional demo features", async () => {
    for (const path of ["/dashboard?month=2024-02", "/timeline", "/insights?month=2024-02"]) {
      const response = await request(app()).get(path);
      expect(response.status).toBe(503);
      expect(response.body).toEqual({ error: "Esta função ainda não está integrada aos dados reais." });
    }
    expect((await request(app()).post("/demo/reset")).status).toBe(503);
    expect(await counts()).toEqual({ assets: 0, operations: 0, incomes: 0, actions: 0 });
  });
});
