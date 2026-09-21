import { useEffect, useState, type FormEvent } from "react";
import {
  createApiClient,
  formatCents,
  type AnnualDeclarationJson,
  type ApiClient,
  type MonthlyApurationJson,
  type PositionJson,
} from "./api";
import "./styles.css";

type Tab = "upload" | "portfolio" | "apuration" | "declaration";

type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "empty" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

export type AppProps = {
  api?: ApiClient;
  initialTab?: Tab;
};

export function App({ api = createApiClient(), initialTab = "portfolio" }: AppProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [portfolio, setPortfolio] = useState<LoadState<PositionJson[]>>({ status: "idle" });
  const [apuration, setApuration] = useState<LoadState<MonthlyApurationJson>>({ status: "idle" });
  const [declaration, setDeclaration] = useState<LoadState<AnnualDeclarationJson>>({ status: "idle" });
  const [upload, setUpload] = useState<LoadState<string>>({ status: "idle" });
  const [month, setMonth] = useState("2024-03");
  const [year, setYear] = useState("2024");

  useEffect(() => {
    if (tab !== "portfolio") return;
    let cancelled = false;
    setPortfolio({ status: "loading" });
    api
      .getPortfolio()
      .then((data) => {
        if (cancelled) return;
        setPortfolio(data.length === 0 ? { status: "empty" } : { status: "success", data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPortfolio({
          status: "error",
          message: error instanceof Error ? error.message : "Failed to load portfolio",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [api, tab]);

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setUpload({ status: "error", message: "Selecione um arquivo CSV ou XLSX" });
      return;
    }
    setUpload({ status: "loading" });
    try {
      const result = await api.importFile(file);
      if (!result.ok) {
        setUpload({
          status: "error",
          message: result.errors.map((e) => `Linha ${e.line}: ${e.message}`).join("; "),
        });
        return;
      }
      setUpload({ status: "success", data: "Importação concluída" });
    } catch (error: unknown) {
      setUpload({
        status: "error",
        message: error instanceof Error ? error.message : "Falha na importação",
      });
    }
  }

  async function onLoadApuration(event: FormEvent) {
    event.preventDefault();
    setApuration({ status: "loading" });
    try {
      const data = await api.getApuration(month);
      setApuration({ status: "success", data });
    } catch (error: unknown) {
      setApuration({
        status: "error",
        message: error instanceof Error ? error.message : "Falha ao carregar apuração",
      });
    }
  }

  async function onLoadDeclaration(event: FormEvent) {
    event.preventDefault();
    setDeclaration({ status: "loading" });
    try {
      const data = await api.getDeclaration(Number.parseInt(year, 10));
      setDeclaration({ status: "success", data });
    } catch (error: unknown) {
      setDeclaration({
        status: "error",
        message: error instanceof Error ? error.message : "Falha ao carregar declaração",
      });
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="brand">Fiscal B3</p>
        <h1>Consolidador de investimentos</h1>
        <p>Importe operações, consulte posição, apuração mensal e declaração anual.</p>
      </header>
      <div className="layout">
        <nav className="nav" aria-label="Seções">
          <button type="button" aria-current={tab === "upload" ? "page" : undefined} onClick={() => setTab("upload")}>
            Upload
          </button>
          <button
            type="button"
            aria-current={tab === "portfolio" ? "page" : undefined}
            onClick={() => setTab("portfolio")}
          >
            Posição
          </button>
          <button
            type="button"
            aria-current={tab === "apuration" ? "page" : undefined}
            onClick={() => setTab("apuration")}
          >
            Mensal
          </button>
          <button
            type="button"
            aria-current={tab === "declaration" ? "page" : undefined}
            onClick={() => setTab("declaration")}
          >
            Declaração
          </button>
        </nav>
        <main className="main">
          {tab === "upload" && (
            <section>
              <h2 className="section-title">Importar operações</h2>
              <p className="section-lead">Envie um CSV ou XLSX no layout fixo do MVP.</p>
              <form onSubmit={onUpload}>
                <div className="field">
                  <label htmlFor="file">Arquivo</label>
                  <input id="file" name="file" type="file" accept=".csv,.xlsx,.xls,text/csv" />
                </div>
                <button className="btn-accent" type="submit">
                  Enviar
                </button>
              </form>
              {upload.status === "success" && (
                <p className="state state-success" role="status">
                  {upload.data}
                </p>
              )}
              {upload.status === "error" && (
                <p className="state state-error" role="alert">
                  {upload.message}
                </p>
              )}
            </section>
          )}

          {tab === "portfolio" && (
            <section>
              <h2 className="section-title">Posição atual</h2>
              <p className="section-lead">Quantidade e preço médio por ativo, vindos da API.</p>
              {portfolio.status === "empty" && (
                <p className="state state-empty" role="status">
                  Nenhuma posição encontrada
                </p>
              )}
              {portfolio.status === "error" && (
                <p className="state state-error" role="alert">
                  {portfolio.message}
                </p>
              )}
              {portfolio.status === "success" && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Quantidade</th>
                      <th>Preço médio</th>
                      <th>Custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.data.map((row) => (
                      <tr key={row.ticker}>
                        <td>{row.ticker}</td>
                        <td>{row.quantity}</td>
                        <td>{formatCents(row.averagePrice.cents)}</td>
                        <td>{formatCents(row.acquisitionCost.cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {tab === "apuration" && (
            <section>
              <h2 className="section-title">Apuração mensal</h2>
              <p className="section-lead">Consulta o resultado e o DARF do mês via API.</p>
              <form onSubmit={onLoadApuration} className="stack">
                <div className="field">
                  <label htmlFor="month">Mês</label>
                  <input id="month" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="YYYY-MM" />
                </div>
                <button className="btn-primary" type="submit">
                  Consultar
                </button>
              </form>
              {apuration.status === "error" && (
                <p className="state state-error" role="alert">
                  {apuration.message}
                </p>
              )}
              {apuration.status === "success" && (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>Resultado</th>
                      <th>Isenção</th>
                      <th>DARF</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{apuration.data.month}</td>
                      <td>{formatCents(apuration.data.result.cents)}</td>
                      <td>{formatCents(apuration.data.exemptionApplied.cents)}</td>
                      <td>{formatCents(apuration.data.darf.cents)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </section>
          )}

          {tab === "declaration" && (
            <section>
              <h2 className="section-title">Declaração anual</h2>
              <p className="section-lead">Bens e direitos e rendimentos do ano-calendário.</p>
              <form onSubmit={onLoadDeclaration} className="stack">
                <div className="field">
                  <label htmlFor="year">Ano</label>
                  <input id="year" value={year} onChange={(e) => setYear(e.target.value)} />
                </div>
                <button className="btn-primary" type="submit">
                  Consultar
                </button>
              </form>
              {declaration.status === "error" && (
                <p className="state state-error" role="alert">
                  {declaration.message}
                </p>
              )}
              {declaration.status === "success" && (
                <>
                  <h3 className="section-title">Bens e direitos</h3>
                  {declaration.data.bensEDireitos.length === 0 ? (
                    <p className="state state-empty">Nenhum bem registrado</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Ticker</th>
                          <th>Quantidade</th>
                          <th>Custo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {declaration.data.bensEDireitos.map((row) => (
                          <tr key={row.ticker}>
                            <td>{row.ticker}</td>
                            <td>{row.quantity}</td>
                            <td>{formatCents(row.acquisitionCost.cents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
