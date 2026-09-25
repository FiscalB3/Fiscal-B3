export const SWING_STOCK_EXEMPTION_LIMIT_CENTS = 2_000_000;

export type ExemptionMeterStatus = "ok" | "warning" | "exceeded";

export type ExemptionMeter = {
  usedCents: number;
  limitCents: number;
  remainingCents: number;
  percentUsed: number;
  status: ExemptionMeterStatus;
};

/**
 * Monthly R$ 20.000 swing-stock sales exemption meter.
 * Only swing equity sales volume counts; FII and day trade are excluded by the caller.
 */
export function buildExemptionMeter(usedCents: number): ExemptionMeter {
  if (!Number.isInteger(usedCents) || usedCents < 0) {
    throw new Error("usedCents must be a non-negative integer");
  }
  const limitCents = SWING_STOCK_EXEMPTION_LIMIT_CENTS;
  const remainingCents = Math.max(0, limitCents - usedCents);
  const percentUsed = Math.round((usedCents / limitCents) * 1000) / 10;
  let status: ExemptionMeterStatus = "ok";
  if (usedCents > limitCents) {
    status = "exceeded";
  } else if (percentUsed >= 80) {
    status = "warning";
  }
  return { usedCents, limitCents, remainingCents, percentUsed, status };
}
