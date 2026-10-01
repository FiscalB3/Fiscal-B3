import { createApp } from "./createApp";
import { createMockPorts } from "./mocks";
import { createRealPorts } from "../../infrastructure/createRealPorts";
import { createPool } from "../../infrastructure/persistence/db";
import { runMigrations } from "../../infrastructure/persistence/migrate";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const demo = process.env.FISCAL_B3_MODE === "demo";
const pool = demo ? undefined : createPool();
if (pool) await runMigrations(pool);
const app = createApp(pool ? createRealPorts(pool) : createMockPorts());

const server = app.listen(port, () => {
  console.log(`Fiscal B3 API (${demo ? "demo" : "PostgreSQL"}) listening on http://localhost:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(() => { void pool?.end(); });
  });
}
