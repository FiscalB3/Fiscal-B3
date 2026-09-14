export type AssetKind = "ACAO" | "FII";

export type Asset = {
  ticker: string;
  kind: AssetKind;
  cnpj?: string;
};

export function createAsset(input: Asset): Asset {
  return {
    ticker: input.ticker.trim().toUpperCase(),
    kind: input.kind,
    ...(input.cnpj !== undefined ? { cnpj: input.cnpj } : {}),
  };
}
