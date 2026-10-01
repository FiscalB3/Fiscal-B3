import type pg from "pg";
import type { PortfolioEvent } from "../../domain/events/PortfolioEvent";
import type { Asset } from "../../domain/assets/Asset";
import type { Income } from "../../domain/incomes/Income";
import { Money } from "../../domain/money/Money";
import type { AtivoRepository } from "./AtivoRepository";

type ProventoRow = {
  event_sequence: string;
  ticker: string;
  asset_kind: string;
  cnpj: string | null;
  data: string;
  kind: string;
  valor_centavos: string;
};

function toIncome(row: ProventoRow): Income {
  const asset: Asset = {
    ticker: row.ticker,
    kind: row.asset_kind as Asset["kind"],
    ...(row.cnpj ? { cnpj: row.cnpj } : {}),
  };
  return {
    asset,
    date: row.data,
    kind: row.kind as Income["kind"],
    amount: Money.fromCents(Number(row.valor_centavos)),
  };
}

/** Somente insere e lista, em ordem cronológica. Sem update/delete. */
export class ProventoRepository {
  constructor(
    private readonly pool: Pick<pg.PoolClient, "query">,
    private readonly ativos: AtivoRepository,
  ) {}

  async inserir(income: Income): Promise<void> {
    const ativoId = await this.ativos.obterOuCriarId(income.asset);
    await this.pool.query(
      `INSERT INTO proventos (ativo_id, data, kind, valor_centavos)
       VALUES ($1, $2, $3, $4)`,
      [ativoId, income.date, income.kind, income.amount.toCents()],
    );
  }

  async listar(): Promise<Income[]> {
    return (await this.listarEventos()).map((event) => event.income);
  }

  async listarEventos(): Promise<Extract<PortfolioEvent, { kind: "INCOME" }>[]> {
    const result = await this.pool.query<ProventoRow>(
      `SELECT p.event_sequence, a.ticker, a.kind AS asset_kind, a.cnpj, p.data, p.kind, p.valor_centavos
       FROM proventos p
       JOIN ativos a ON a.id = p.ativo_id
       ORDER BY p.data ASC, p.id ASC`,
    );
    return result.rows.map((row) => ({ kind: "INCOME", date: row.data, sequence: Number(row.event_sequence), income: toIncome(row) }));
  }
}
