export type CostEvolutionPoint = { month: string; costCents: number };

export type PortfolioCostEvolution = { points: readonly CostEvolutionPoint[] };

export interface GetPortfolioCostEvolution {
  execute(): Promise<PortfolioCostEvolution>;
}
