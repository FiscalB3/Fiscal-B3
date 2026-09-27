import { describe, expect, it } from "vitest";
import { buildExemptionMeter, SWING_STOCK_EXEMPTION_LIMIT_CENTS } from "./exemptionMeter";

describe("buildExemptionMeter", () => {
  it("uses the R$ 20.000 swing stock limit", () => {
    expect(SWING_STOCK_EXEMPTION_LIMIT_CENTS).toBe(2_000_000);
  });

  it("returns ok below 80% usage", () => {
    const meter = buildExemptionMeter(850_000);
    expect(meter.status).toBe("ok");
    expect(meter.percentUsed).toBe(42.5);
    expect(meter.remainingCents).toBe(1_150_000);
  });

  it("returns warning from 80% up to the limit", () => {
    const meter = buildExemptionMeter(1_820_000);
    expect(meter.status).toBe("warning");
    expect(meter.percentUsed).toBe(91);
    expect(meter.remainingCents).toBe(180_000);
  });

  it("returns exceeded above the limit", () => {
    const meter = buildExemptionMeter(2_100_000);
    expect(meter.status).toBe("exceeded");
    expect(meter.remainingCents).toBe(0);
    expect(meter.percentUsed).toBe(105);
  });

  it("returns ok at zero usage", () => {
    expect(buildExemptionMeter(0)).toEqual({
      usedCents: 0,
      limitCents: 2_000_000,
      remainingCents: 2_000_000,
      percentUsed: 0,
      status: "ok",
    });
  });

  it("returns warning exactly at 80%", () => {
    expect(buildExemptionMeter(1_600_000).status).toBe("warning");
  });

  it("returns warning exactly at the limit", () => {
    const meter = buildExemptionMeter(2_000_000);
    expect(meter.status).toBe("warning");
    expect(meter.remainingCents).toBe(0);
  });

  it("rejects negative usage", () => {
    expect(() => buildExemptionMeter(-1)).toThrow("usedCents must be a non-negative integer");
  });

  it("treats caller-supplied usedCents as swing equity only (FII/day trade excluded upstream)", () => {
    // Domain meter never inspects asset kind; FII and day trade must not be included in usedCents by the caller.
    const swingOnly = buildExemptionMeter(500_000);
    const withExtraIfMistakenlyIncluded = buildExemptionMeter(500_000 + 300_000);
    expect(swingOnly.percentUsed).toBe(25);
    expect(withExtraIfMistakenlyIncluded.percentUsed).toBe(40);
    expect(swingOnly.percentUsed).not.toBe(withExtraIfMistakenlyIncluded.percentUsed);
  });
});
