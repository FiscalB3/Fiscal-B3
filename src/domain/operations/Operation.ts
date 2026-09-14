import type { Asset } from "../assets/Asset";
import type { Money } from "../money/Money";

export type OperationKind = "COMPRA" | "VENDA";

export type Operation = {
  asset: Asset;
  date: string;
  kind: OperationKind;
  quantity: number;
  unitPrice: Money;
  brokerage: Money;
  b3Fees: Money;
};
