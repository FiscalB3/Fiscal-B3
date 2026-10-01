import pg from "pg";

const { Pool, types } = pg;

// DATE (oid 1082) chega como string "YYYY-MM-DD" do Postgres. O parser padrão
// do node-postgres converte isso para um objeto Date, o que pode deslocar o
// dia dependendo do fuso horário do processo. O domínio (T1) trata datas como
// string ISO simples, então mantemos o valor cru aqui.
types.setTypeParser(1082, (value: string) => value);

export type PersistenceConfig = {
  options?: string;
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
};

export function createPool(config: PersistenceConfig = {}): pg.Pool {
  if (config.connectionString ?? process.env.DATABASE_URL) {
    return new Pool({
      options: config.options,
      connectionString: config.connectionString ?? process.env.DATABASE_URL,
    });
  }

  return new Pool({
    options: config.options,
    host: config.host ?? process.env.PGHOST ?? "localhost",
    port: config.port ?? (process.env.PGPORT ? Number(process.env.PGPORT) : 5432),
    user: config.user ?? process.env.PGUSER ?? "fiscal",
    password: config.password ?? process.env.PGPASSWORD,
    database: config.database ?? process.env.PGDATABASE ?? "fiscal_b3",
  });
}
