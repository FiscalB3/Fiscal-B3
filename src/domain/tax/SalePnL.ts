import type { Asset, AssetKind } from "../assets/Asset";
import type { Money } from "../money/Money";

export type TradeModality = "DAY_TRADE" | "SWING";

export type SalePnL = {
  asset: Asset;
  date: string;
  modality: TradeModality;
  result: Money;
  soldValue: Money;
  assetKind: AssetKind;
};
