export type SimulateSaleInput = {
  ticker: string;
  quantity: number;
  priceCents: number;
  month: string;
};

export type SimulateSaleResult = {
  estimatedGainCents: number;
  estimatedTaxCents: number;
  persisted: false;
};

export interface SimulateSale {
  execute(input: SimulateSaleInput): Promise<SimulateSaleResult>;
}
