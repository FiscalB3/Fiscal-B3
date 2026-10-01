import type pg from "pg";
import type { PortfolioStore } from "../../application/ports/PortfolioStore";
import { sortPortfolioEvents, type PortfolioEvent } from "../../domain/events/PortfolioEvent";
import { AtivoRepository } from "./AtivoRepository";
import { OperacaoRepository } from "./OperacaoRepository";
import { ProventoRepository } from "./ProventoRepository";
import { EventoCorporativoRepository } from "./EventoCorporativoRepository";

function repositories(client: pg.PoolClient) {
  const assets = new AtivoRepository(client);
  return {
    operations: new OperacaoRepository(client, assets),
    incomes: new ProventoRepository(client, assets),
    actions: new EventoCorporativoRepository(client, assets),
  };
}

async function readEvents(client: pg.PoolClient): Promise<PortfolioEvent[]> {
  const repos = repositories(client);
  return sortPortfolioEvents([
    ...await repos.operations.listarEventos(),
    ...await repos.incomes.listarEventos(),
    ...await repos.actions.listarEventos(),
  ]);
}

export class PostgresPortfolioStore implements PortfolioStore {
  constructor(private readonly pool: pg.Pool) {}

  async read(): Promise<readonly PortfolioEvent[]> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const events = await readEvents(client);
      await client.query("COMMIT");
      return events;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async append(events: readonly PortfolioEvent[], validate: (history: readonly PortfolioEvent[]) => void): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // Serializes validation + append, including writers using T5 repositories.
      await client.query("LOCK TABLE operacoes, proventos, eventos_corporativos IN SHARE ROW EXCLUSIVE MODE");
      const history = await readEvents(client);
      const lastSequence = history.reduce((max, event) => Math.max(max, event.sequence), 0);
      const batch = events.map((event, index) => ({ ...event, sequence: lastSequence + index + 1 }));
      validate(sortPortfolioEvents([...history, ...batch]));
      const repos = repositories(client);
      for (const event of batch) {
        if (event.kind === "OPERATION") await repos.operations.inserir(event.operation);
        else if (event.kind === "INCOME") await repos.incomes.inserir(event.income);
        else await repos.actions.inserir(event.action);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
