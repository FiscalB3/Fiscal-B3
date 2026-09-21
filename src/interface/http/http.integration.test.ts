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
});
