import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./createApp";
import { createMockPorts } from "./mocks";

describe("HTTP API", () => {
  it("GET /health returns 200", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /portfolio returns positions", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).get("/portfolio");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        ticker: "PETR4",
        quantity: 100,
        averagePrice: { cents: 2850 },
        acquisitionCost: { cents: 285000 },
      },
      {
        ticker: "VALE3",
        quantity: 40,
        averagePrice: { cents: 6210 },
        acquisitionCost: { cents: 248400 },
      },
      {
        ticker: "HGLG11",
        quantity: 15,
        averagePrice: { cents: 16000 },
        acquisitionCost: { cents: 240000 },
      },
    ]);
  });

  it("GET /portfolio returns empty list", async () => {
    const app = createApp(createMockPorts({ portfolio: [] }));
    const res = await request(app).get("/portfolio");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("GET /apuration?month= returns monthly apuration", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).get("/apuration").query({ month: "2024-03" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      month: "2024-03",
      result: { cents: 150000 },
      exemptionApplied: { cents: 0 },
      darf: { cents: 22500 },
    });
  });

  it("GET /apuration without month returns 400", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).get("/apuration");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Query parameter month is required as YYYY-MM" });
  });

  it("GET /declaration?year= returns annual declaration", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).get("/declaration").query({ year: "2024" });
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(2024);
    expect(res.body.bensEDireitos).toHaveLength(3);
    expect(res.body.rendimentos[0]).toEqual({
      kind: "DIVIDENDO",
      amount: { cents: 10000 },
    });
  });

  it("GET /declaration without year returns 400", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).get("/declaration");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Query parameter year is required as a valid year" });
  });

  it("POST /imports accepts CSV and returns ok", async () => {
    const app = createApp(createMockPorts({ importOk: true }));
    const res = await request(app)
      .post("/imports")
      .attach("file", Buffer.from("ticker,qty\nPETR4,10\n"), {
        filename: "ops.csv",
        contentType: "text/csv",
      });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("POST /imports returns 400 when port reports line errors", async () => {
    const app = createApp(createMockPorts({ importOk: false }));
    const res = await request(app)
      .post("/imports")
      .attach("file", Buffer.from("bad"), {
        filename: "ops.csv",
        contentType: "text/csv",
      });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errors: [{ line: 2, message: "invalid quantity" }] });
  });

  it("POST /imports returns 415 for unsupported media type", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app)
      .post("/imports")
      .attach("file", Buffer.from("%PDF"), {
        filename: "ops.pdf",
        contentType: "application/pdf",
      });
    expect(res.status).toBe(415);
    expect(res.body).toEqual({ error: "Unsupported media type; expected CSV or XLSX" });
  });

  it("POST /imports returns 400 when file is missing", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).post("/imports");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "File is required" });
  });

  it("POST /demo/reset returns deterministic seed metadata", async () => {
    const app = createApp(createMockPorts({ portfolio: [] }));
    const res = await request(app).post("/demo/reset");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.tickers).toEqual(["PETR4", "VALE3", "ITUB4", "BBAS3", "HGLG11", "MXRF11"]);
    expect(res.body.modalities).toEqual(["DAY_TRADE", "SWING"]);
    expect(res.body.hasFii).toBe(true);
    expect(res.body.hasProvento).toBe(true);
  });

  it("POST /demo/reset recreates the same portfolio twice", async () => {
    const app = createApp(createMockPorts({ portfolio: [] }));
    await request(app).post("/demo/reset");
    const first = await request(app).get("/portfolio");
    await request(app).post("/demo/reset");
    const second = await request(app).get("/portfolio");
    expect(first.body).toEqual(second.body);
    expect(first.body).toHaveLength(6);
  });

  it("GET /portfolio after demo reset has at least 5 tickers including FII", async () => {
    const app = createApp(createMockPorts({ portfolio: [] }));
    await request(app).post("/demo/reset");
    const res = await request(app).get("/portfolio");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
    const tickers = res.body.map((row: { ticker: string }) => row.ticker);
    expect(tickers).toContain("HGLG11");
    expect(tickers).toContain("MXRF11");
  });

  it("GET /apuration after demo reset reflects demo DARF", async () => {
    const app = createApp(createMockPorts({ portfolio: [] }));
    await request(app).post("/demo/reset");
    const res = await request(app).get("/apuration").query({ month: "2024-03" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      month: "2024-03",
      result: { cents: 320000 },
      exemptionApplied: { cents: 0 },
      darf: { cents: 48000 },
    });
  });

  it("GET /declaration after demo reset reflects seed bens and provento", async () => {
    const app = createApp(createMockPorts({ portfolio: [] }));
    await request(app).post("/demo/reset");
    const res = await request(app).get("/declaration").query({ year: "2024" });
    expect(res.status).toBe(200);
    expect(res.body.bensEDireitos).toHaveLength(6);
    expect(res.body.rendimentos).toEqual([
      { kind: "DIVIDENDO", amount: { cents: 25000 } },
      { kind: "JCP", amount: { cents: 9000 } },
      { kind: "RENDIMENTO_FII", amount: { cents: 42000 } },
    ]);
  });

  it("demo reset restores portfolio after empty state", async () => {
    const app = createApp(createMockPorts({ portfolio: [] }));
    const empty = await request(app).get("/portfolio");
    expect(empty.body).toEqual([]);
    await request(app).post("/demo/reset");
    const seeded = await request(app).get("/portfolio");
    expect(seeded.body[0]).toEqual({
      ticker: "PETR4",
      quantity: 200,
      averagePrice: { cents: 3000 },
      acquisitionCost: { cents: 600000 },
    });
  });

  it("GET /dashboard?month= returns KPIs from ports", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).get("/dashboard").query({ month: "2024-03" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      month: "2024-03",
      investedCost: { cents: 773400 },
      assetCount: 3,
      monthDarf: { cents: 22500 },
      exemptionUsedCents: 850000,
      exemptionLimitCents: 2000000,
      exemptionPercentUsed: 42.5,
    });
  });

  it("GET /dashboard without month returns 400", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).get("/dashboard");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Query parameter month is required as YYYY-MM" });
  });

  it("GET /dashboard after demo reset reflects demo KPIs", async () => {
    const app = createApp(createMockPorts({ portfolio: [] }));
    await request(app).post("/demo/reset");
    const res = await request(app).get("/dashboard").query({ month: "2024-03" });
    expect(res.status).toBe(200);
    expect(res.body.assetCount).toBe(6);
    expect(res.body.investedCost).toEqual({ cents: 2245000 });
    expect(res.body.monthDarf).toEqual({ cents: 48000 });
    expect(res.body.exemptionPercentUsed).toBe(91);
  });

  it("GET /dashboard with empty portfolio returns zero assets", async () => {
    const app = createApp(createMockPorts({ portfolio: [] }));
    const res = await request(app).get("/dashboard").query({ month: "2024-03" });
    expect(res.status).toBe(200);
    expect(res.body.assetCount).toBe(0);
    expect(res.body.investedCost).toEqual({ cents: 0 });
  });

  it("GET /timeline returns chronologically ordered events", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).get("/timeline");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].date).toBe("2024-01-10");
    expect(res.body[0].kind).toBe("BUY");
    expect(res.body[0].ticker).toBe("PETR4");
    expect(res.body[2].date).toBe("2024-03-12");
    expect(res.body[2].kind).toBe("SELL");
  });

  it("GET /timeline returns empty list", async () => {
    const app = createApp(createMockPorts({ timeline: [] }));
    const res = await request(app).get("/timeline");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("GET /timeline after demo reset includes day trade and FII events", async () => {
    const app = createApp(createMockPorts({ timeline: [] }));
    await request(app).post("/demo/reset");
    const res = await request(app).get("/timeline");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
    const kinds = res.body.map((row: { kind: string }) => row.kind);
    expect(kinds).toContain("DAY_TRADE");
    expect(kinds).toContain("RENDIMENTO_FII");
    const dates = res.body.map((row: { date: string }) => row.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("GET /timeline events expose id date kind ticker summary", async () => {
    const app = createApp(createMockPorts());
    const res = await request(app).get("/timeline");
    expect(res.body[0]).toEqual({
      id: "s1",
      date: "2024-01-10",
      kind: "BUY",
      ticker: "PETR4",
      summary: "Compra de 100 PETR4",
    });
  });
});
