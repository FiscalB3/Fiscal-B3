import { describe, expect, it } from "vitest";
import { Money } from "./Money";

describe("Money", () => {
  it("adds two amounts using integer cents", () => {
    const sum = Money.fromReais("10.50").add(Money.fromReais("0.20"));
    expect(sum.equals(Money.fromReais("10.70"))).toBe(true);
    expect(sum.toCents()).toBe(1070);
  });

  it("subtracts two amounts using integer cents", () => {
    const difference = Money.fromReais("10.00").subtract(Money.fromReais("0.01"));
    expect(difference.equals(Money.fromReais("9.99"))).toBe(true);
    expect(difference.toCents()).toBe(999);
  });

  it("multiplies unit price by an integer quantity", () => {
    const total = Money.fromReais("10.50").multiplyByQuantity(3);
    expect(total.equals(Money.fromReais("31.50"))).toBe(true);
    expect(total.toCents()).toBe(3150);
  });

  it("rejects NaN cents", () => {
    expect(() => Money.fromCents(Number.NaN)).toThrow("Invalid money amount");
  });

  it("rejects a non-decimal reais string", () => {
    expect(() => Money.fromReais("10")).toThrow("Invalid money amount");
  });

  it("does not use binary float for 0.10 + 0.20", () => {
    const sum = Money.fromReais("0.10").add(Money.fromReais("0.20"));
    expect(sum.equals(Money.fromReais("0.30"))).toBe(true);
    expect(sum.toCents()).toBe(30);
  });
});
