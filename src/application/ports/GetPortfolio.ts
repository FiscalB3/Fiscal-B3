import type { PositionSnapshot } from "../../domain/position/PositionSnapshot";

export interface GetPortfolio {
  execute(): Promise<readonly PositionSnapshot[]>;
}
