export type InsightCard = {
  id: string;
  title: string;
  body: string;
};

export type InsightSet = {
  cards: readonly InsightCard[];
};

export interface GetInsights {
  execute(input: { month: string }): Promise<InsightSet>;
}
