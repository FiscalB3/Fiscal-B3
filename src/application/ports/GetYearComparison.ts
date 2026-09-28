export type YearComparison = {
  yearA: number;
  yearB: number;
  costA: { cents: number };
  costB: { cents: number };
  incomeA: { cents: number };
  incomeB: { cents: number };
  darfA: { cents: number };
  darfB: { cents: number };
};

export interface GetYearComparison {
  execute(input: { yearA: number; yearB: number }): Promise<YearComparison>;
}
