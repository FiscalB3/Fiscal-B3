import { describe, expect, it } from "vitest";
import { createPortfolioUseCases } from "./createPortfolioUseCases";
import type { PortfolioStore } from "../ports/PortfolioStore";
import type { PortfolioEvent } from "../../domain/events/PortfolioEvent";
import { Money } from "../../domain/money/Money";

const source = { filename: "test.csv", mimeType: "text/csv", content: new Uint8Array() };
const buy: PortfolioEvent = {
  kind: "OPERATION", date: "2024-01-02", sequence: 0,
  operation: { asset: { ticker: "TEST11", kind: "FII" }, date: "2024-01-02", kind: "COMPRA", quantity: 100,
    unitPrice: Money.fromReais("10.00"), brokerage: Money.fromCents(0), b3Fees: Money.fromCents(0) },
};

function setup(events: readonly PortfolioEvent[] = []) {
  let history = [...events];
  const store: PortfolioStore = {
    async read() { return history; },
    async append(batch, validate) {
      const next = [...history, ...batch];
      validate(next);
      history = next;
    },
  };
  return { store, ports: createPortfolioUseCases(store, { parse: () => ({ ok: true, events: [buy] }) }) };
}

describe("T7 application (MVP-12)", () => {
  it("imports events and rebuilds positions", async () => {
    const { store, ports } = setup();
    expect(await ports.importOperations.execute(source)).toEqual({ ok: true });
    expect(await store.read()).toEqual([buy]);
    expect(await ports.getPortfolio.execute()).toEqual([{ ticker: "TEST11", quantity: 100, averagePrice: Money.fromReais("10.00"), acquisitionCost: Money.fromReais("1000.00") }]);
  });

  it("preserves history on parser rejection", async () => {
    const { store } = setup([buy]);
    const ports = createPortfolioUseCases(store, { parse: () => ({ ok: false, errors: [{ line: 2, message: "invalid" }] }) });
    expect(await ports.importOperations.execute(source)).toEqual({ ok: false, errors: [{ line: 2, message: "invalid" }] });
    expect(await store.read()).toEqual([buy]);
  });

  it("rejects an invalid combined history without appending", async () => {
    const { store } = setup();
    const sale = { ...buy, operation: { ...buy.operation, kind: "VENDA" as const } };
    const ports = createPortfolioUseCases(store, { parse: () => ({ ok: true, events: [sale] }) });
    expect(await ports.importOperations.execute(source)).toEqual({ ok: false, errors: [{ line: 0, message: "Insufficient position for TEST11" }] });
    expect(await store.read()).toEqual([]);
  });

  it("propagates persistence failures", async () => {
    const { store, ports } = setup();
    store.append = async () => { throw new Error("database offline"); };
    await expect(ports.importOperations.execute(source)).rejects.toThrow("database offline");
  });

  it("propagates read failures for all queries", async () => {
    const { store, ports } = setup();
    store.read = async () => { throw new Error("database offline"); };
    await expect(ports.getPortfolio.execute()).rejects.toThrow("database offline");
    await expect(ports.getMonthlyApuration.execute({ month: "2024-02" })).rejects.toThrow("database offline");
    await expect(ports.getAnnualDeclaration.execute({ year: 2024 })).rejects.toThrow("database offline");
  });

  it("returns empty results for empty history", async () => {
    const { ports } = setup();
    expect(await ports.getPortfolio.execute()).toEqual([]);
    expect(await ports.getMonthlyApuration.execute({ month: "2024-02" })).toEqual({ month: "2024-02", result: Money.fromCents(0), exemptionApplied: Money.fromCents(0), darf: Money.fromCents(0) });
    const annual = await ports.getAnnualDeclaration.execute({ year: 2024 });
    expect(annual.bensEDireitos).toEqual([]);
    expect(annual.rendimentos.map((income) => income.amount.toCents())).toEqual([0, 0, 0, 0]);
  });
});
