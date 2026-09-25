export type ResetDemoResult = {
  ok: true;
  tickers: readonly string[];
  modalities: readonly ("DAY_TRADE" | "SWING")[];
  hasFii: true;
  hasProvento: true;
};

export interface ResetDemo {
  execute(): Promise<ResetDemoResult>;
}
