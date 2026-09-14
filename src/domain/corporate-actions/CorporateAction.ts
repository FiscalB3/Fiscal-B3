import type { Asset } from "../assets/Asset";

export type CorporateActionKind = "DESDOBRAMENTO" | "GRUPAMENTO";

export type CorporateAction = {
  asset: Asset;
  date: string;
  kind: CorporateActionKind;
  factor: number;
};
