import type pg from "pg";
import type { Asset } from "../../domain/assets/Asset";
import type { CorporateAction } from "../../domain/corporate-actions/CorporateAction";
import type { AtivoRepository } from "./AtivoRepository";

type EventoCorporativoRow = {
  ticker: string;
  asset_kind: string;
  cnpj: string | null;
  data: string;
  kind: string;
  fator: string;
};

function toCorporateAction(row: EventoCorporativoRow): CorporateAction {
  const asset: Asset = {
    ticker: row.ticker,
    kind: row.asset_kind as Asset["kind"],
    ...(row.cnpj ? { cnpj: row.cnpj } : {}),
  };
  return {
    asset,
    date: row.data,
    kind: row.kind as CorporateAction["kind"],
    factor: Number(row.fator),
  };
}

/**
 * Somente insere e lista, em ordem cronológica. Desdobramento/grupamento tem
 * tabela própria (não vira `operacoes`) - decisão registrada em tasks.md.
 */
export class EventoCorporativoRepository {
  constructor(
    private readonly pool: pg.Pool,
    private readonly ativos: AtivoRepository,
  ) {}

  async inserir(action: CorporateAction): Promise<void> {
    const ativoId = await this.ativos.obterOuCriarId(action.asset);
    await this.pool.query(
      `INSERT INTO eventos_corporativos (ativo_id, data, kind, fator)
       VALUES ($1, $2, $3, $4)`,
      [ativoId, action.date, action.kind, action.factor],
    );
  }

  async listar(): Promise<CorporateAction[]> {
    const result = await this.pool.query<EventoCorporativoRow>(
      `SELECT a.ticker, a.kind AS asset_kind, a.cnpj, e.data, e.kind, e.fator
       FROM eventos_corporativos e
       JOIN ativos a ON a.id = e.ativo_id
       ORDER BY e.data ASC, e.id ASC`,
    );
    return result.rows.map(toCorporateAction);
  }
}