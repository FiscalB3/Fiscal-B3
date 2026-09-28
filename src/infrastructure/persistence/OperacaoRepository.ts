import type pg from "pg";
import type { Asset } from "../../domain/assets/Asset";
import { Money } from "../../domain/money/Money";
import type { Operation } from "../../domain/operations/Operation";
import type { AtivoRepository } from "./AtivoRepository";

type OperacaoRow = {
  ticker: string;
  asset_kind: string;
  cnpj: string | null;
  data: string;
  kind: string;
  quantidade: number;
  preco_unitario_centavos: string;
  corretagem_centavos: string;
  taxas_b3_centavos: string;
};

function toOperation(row: OperacaoRow): Operation {
  const asset: Asset = {
    ticker: row.ticker,
    kind: row.asset_kind as Asset["kind"],
    ...(row.cnpj ? { cnpj: row.cnpj } : {}),
  };
  return {
    asset,
    date: row.data,
    kind: row.kind as Operation["kind"],
    quantity: row.quantidade,
    unitPrice: Money.fromCents(Number(row.preco_unitario_centavos)),
    brokerage: Money.fromCents(Number(row.corretagem_centavos)),
    b3Fees: Money.fromCents(Number(row.taxas_b3_centavos)),
  };
}

/**
 * Somente insere e lista. Não existe `atualizar`/`deletar`: a posição e o
 * preço médio (campos derivados, calculados por `PositionEngine` em T2) nunca
 * são persistidos ou editáveis aqui - só os eventos brutos de operação.
 */
export class OperacaoRepository {
  constructor(
    private readonly pool: pg.Pool,
    private readonly ativos: AtivoRepository,
  ) {}

  async inserir(operation: Operation): Promise<void> {
    const ativoId = await this.ativos.obterOuCriarId(operation.asset);
    await this.pool.query(
      `INSERT INTO operacoes
         (ativo_id, data, kind, quantidade, preco_unitario_centavos, corretagem_centavos, taxas_b3_centavos)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        ativoId,
        operation.date,
        operation.kind,
        operation.quantity,
        operation.unitPrice.toCents(),
        operation.brokerage.toCents(),
        operation.b3Fees.toCents(),
      ],
    );
  }

  async listar(): Promise<Operation[]> {
    const result = await this.pool.query<OperacaoRow>(
      `SELECT a.ticker, a.kind AS asset_kind, a.cnpj,
              o.data, o.kind, o.quantidade,
              o.preco_unitario_centavos, o.corretagem_centavos, o.taxas_b3_centavos
       FROM operacoes o
       JOIN ativos a ON a.id = o.ativo_id
       ORDER BY o.data ASC, o.id ASC`,
    );
    return result.rows.map(toOperation);
  }
}