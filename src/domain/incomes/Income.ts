import type { Asset } from "../assets/Asset";
import type { Money } from "../money/Money";

export type IncomeKind = "DIVIDENDO" | "JCP" | "RENDIMENTO_FII";

export type Income = {
  asset: Asset;
  date: string;
  kind: IncomeKind;
  amount: Money;
};
