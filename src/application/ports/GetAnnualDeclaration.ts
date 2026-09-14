import type { Money } from "../../domain/money/Money";
import type { PositionSnapshot } from "../../domain/position/PositionSnapshot";

export type AnnualIncomeLine = {
  kind: "DIVIDENDO" | "JCP" | "RENDIMENTO_FII" | "GANHO_DE_CAPITAL";
  amount: Money;
};

export type AnnualDeclaration = {
  year: number;
  bensEDireitos: readonly PositionSnapshot[];
  rendimentos: readonly AnnualIncomeLine[];
};

export interface GetAnnualDeclaration {
  execute(input: { year: number }): Promise<AnnualDeclaration>;
}
