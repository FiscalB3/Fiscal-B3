import type pg from "pg";
import type { Asset } from "../../domain/assets/Asset";

type AtivoRow = {
  ticker: string;
  kind: string;
  cnpj: string | null;
};

function toAsset(row: AtivoRow): Asset {
  return {
    ticker: row.ticker,
    kind: row.kind as Asset["kind"],
    ...(row.cnpj ? { cnpj: row.cnpj } : {}),
  };
}

/**
 * Ativos funcionam como tabela de referência (chave natural = ticker), não
 * como log de eventos: não há "preço médio" ou qualquer campo derivado aqui,
 * então o upsert por ticker não fere a regra de T5 de nenhum campo derivado
 * editável na mão. `obterOuCriarId` nunca sobrescreve `kind`/`cnpj`.
 */
export class AtivoRepository {
  constructor(private readonly pool: pg.Pool) {}

  async obterOuCriarId(asset: Asset): Promise<number> {
    const result = await this.pool.query<{ id: number }>(
      `INSERT INTO ativos (ticker, kind, cnpj)
       VALUES ($1, $2, $3)
       ON CONFLICT (ticker) DO UPDATE SET ticker = EXCLUDED.ticker
       RETURNING id`,
      [asset.ticker, asset.kind, asset.cnpj ?? null],
    );
    return result.rows[0]!.id;
  }

  async listar(): Promise<Asset[]> {
    const result = await this.pool.query<AtivoRow>(
      "SELECT ticker, kind, cnpj FROM ativos ORDER BY ticker ASC",
    );
    return result.rows.map(toAsset);
  }
}