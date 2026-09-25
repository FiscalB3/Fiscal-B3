import { useEffect, useState, type FormEvent } from "react";
import {
  createApiClient,
  formatCents,
  type AnnualDeclarationJson,
  type ApiClient,
  type DashboardJson,
  type DarfObligationJson,
  type MonthlyApurationJson,
  type PositionJson,
  type TimelineEventJson,
} from "./api";
import { AllocationChart, CompareBars, IncomeBars } from "./charts";
import "./styles.css";

type Tab = "dashboard" | "timeline" | "darf" | "upload" | "portfolio" | "apuration" | "declaration";

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

const NAV: Array<{ id: Tab; label: string }> = [
  { id: "dashboard", label: "Início" },
  { id: "timeline", label: "Linha do tempo" },
  { id: "darf", label: "DARF" },
  { id: "upload", label: "Importar" },
  { id: "portfolio", label: "Carteira" },
  { id: "apuration", label: "Apuração" },
  { id: "declaration", label: "Declaração" },
];

export function App({ api: apiProp, initialTab = "dashboard" }: AppProps) {
  const [api] = useState(() => apiProp ?? createApiClient());
  const [tab, setTab] = useState<Tab>(initialTab);
  const [dashboard, setDashboard] = useState<LoadState<DashboardJson>>({ status: "idle" });
  const [timeline, setTimeline] = useState<LoadState<TimelineEventJson[]>>({ status: "idle" });
  const [darfCalendar, setDarfCalendar] = useState<LoadState<DarfObligationJson[]>>({
    status: "idle",
  });
  const [portfolio, setPortfolio] = useState<LoadState<PositionJson[]>>({ status: "idle" });
  const [apuration, setApuration] = useState<LoadState<MonthlyApurationJson>>({ status: "idle" });
  const [declaration, setDeclaration] = useState<LoadState<AnnualDeclarationJson>>({ status: "idle" });
  const [upload, setUpload] = useState<LoadState<string>>({ status: "idle" });
  const [month, setMonth] = useState("2024-03");
  const [year, setYear] = useState("2024");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [demo, setDemo] = useState<LoadState<string>>({ status: "idle" });
  const [portfolioReload, setPortfolioReload] = useState(0);
  const [dashboardReload, setDashboardReload] = useState(0);
  const [timelineReload, setTimelineReload] = useState(0);
  const [darfReload, setDarfReload] = useState(0);

  useEffect(() => {
    if (tab !== "dashboard") return;
    let cancelled = false;
    setDashboard({ status: "loading" });
    api
      .getDashboard(month)
      .then((data) => {
        if (cancelled) return;
        setDashboard(
          data.assetCount === 0 ? { status: "empty" } : { status: "success", data },
        );
      })
      .catch(() => {
        if (cancelled) return;
        setDashboard({
          status: "error",
          message: "Não foi possível carregar o resumo. Tente novamente em instantes.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [api, tab, month, dashboardReload]);

  useEffect(() => {
    if (tab !== "timeline") return;
    let cancelled = false;
    setTimeline({ status: "loading" });
    api
      .getTimeline()
      .then((data) => {
        if (cancelled) return;
        setTimeline(data.length === 0 ? { status: "empty" } : { status: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        setTimeline({
          status: "error",
          message: "Não foi possível carregar a linha do tempo. Tente novamente.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [api, tab, timelineReload]);

  useEffect(() => {
    if (tab !== "darf") return;
    let cancelled = false;
    setDarfCalendar({ status: "loading" });
    api
      .getDarfCalendar(Number.parseInt(year, 10))
      .then((data) => {
        if (cancelled) return;
        setDarfCalendar(data.length === 0 ? { status: "empty" } : { status: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        setDarfCalendar({
          status: "error",
          message: "Não foi possível carregar o calendário de DARF. Tente novamente.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [api, tab, year, darfReload]);

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
      .catch(() => {
        if (cancelled) return;
        setPortfolio({
          status: "error",
          message: "Não foi possível carregar sua carteira. Tente novamente em instantes.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [api, tab, portfolioReload]);

  async function onLoadDemo() {
    setDemo({ status: "loading" });
    try {
      await api.resetDemo();
      setDemo({ status: "success", data: "Carteira de demonstração carregada." });
      setTab("dashboard");
      setPortfolioReload((n) => n + 1);
      setDashboardReload((n) => n + 1);
      setTimelineReload((n) => n + 1);
      setDarfReload((n) => n + 1);
    } catch {
      setDemo({
        status: "error",
        message: "Não foi possível carregar a demonstração. Tente novamente.",
      });
    }
  }

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setUpload({ status: "error", message: "Escolha um arquivo CSV ou XLSX para continuar." });
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
      setUpload({ status: "success", data: "Suas operações foram importadas com sucesso." });
    } catch {
      setUpload({
        status: "error",
        message: "Não foi possível importar o arquivo. Verifique o formato e tente de novo.",
      });
    }
  }

  async function onLoadApuration(event: FormEvent) {
    event.preventDefault();
    setApuration({ status: "loading" });
    try {
      const data = await api.getApuration(month);
      setApuration({ status: "success", data });
    } catch {
      setApuration({
        status: "error",
        message: "Não foi possível carregar a apuração deste mês. Tente novamente.",
      });
    }
  }

  async function onLoadDeclaration(event: FormEvent) {
    event.preventDefault();
    setDeclaration({ status: "loading" });
    try {
      const data = await api.getDeclaration(Number.parseInt(year, 10));
      setDeclaration({ status: "success", data });
    } catch {
      setDeclaration({
        status: "error",
        message: "Não foi possível carregar a declaração deste ano. Tente novamente.",
      });
    }
  }

  const portfolioTotal =
    portfolio.status === "success"
      ? portfolio.data.reduce((sum, row) => sum + row.acquisitionCost.cents, 0)
      : 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-lockup">
          <img className="brand-mark" src="/logo.png" alt="" width={36} height={36} />
          <div className="brand-text">
            <p className="brand-name">Fiscal B3</p>
            <p className="brand-tag">Organização fiscal</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="btn-ghost"
            disabled={demo.status === "loading"}
            onClick={() => void onLoadDemo()}
          >
            {demo.status === "loading" ? "Carregando…" : "Carregar demonstração"}
          </button>
          <nav className="nav" aria-label="Seções">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={tab === item.id ? "page" : undefined}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      {demo.status === "success" && (
        <p className="state state-success demo-banner" role="status">
          {demo.data}
        </p>
      )}
      {demo.status === "error" && (
        <p className="state state-error demo-banner" role="alert">
          {demo.message}
        </p>
      )}

      <div className="hero">
        <h1>Seu patrimônio sob controle</h1>
        <p>Acompanhe carteira, apuração mensal e declaração anual em um só lugar.</p>
      </div>

      <main className="main">
        {tab === "dashboard" && (
          <section className="panel">
            <h2 className="section-title">Resumo</h2>
            <p className="section-lead">
              Visão rápida do custo investido, obrigações do mês e uso da isenção.
            </p>
            <div className="field">
              <label htmlFor="dashboard-month">Mês de referência</label>
              <input
                id="dashboard-month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </div>
            {dashboard.status === "loading" && (
              <p className="state" role="status">
                Carregando resumo…
              </p>
            )}
            {dashboard.status === "empty" && (
              <p className="state state-empty" role="status">
                Você ainda não possui posições. Importe operações ou carregue a demonstração.
              </p>
            )}
            {dashboard.status === "error" && (
              <p className="state state-error" role="alert">
                {dashboard.message}
              </p>
            )}
            {dashboard.status === "success" && (
              <div className="kpi-grid" data-testid="dashboard-kpis">
                <article className="kpi-card">
                  <p className="kpi-label">Custo investido</p>
                  <p className="kpi-value money">{formatCents(dashboard.data.investedCost.cents)}</p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-label">Ativos</p>
                  <p className="kpi-value">{dashboard.data.assetCount}</p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-label">DARF do mês</p>
                  <p className="kpi-value">{formatCents(dashboard.data.monthDarf.cents)}</p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-label">Isenção usada</p>
                  <p className="kpi-value">{dashboard.data.exemptionPercentUsed}%</p>
                  <p className="kpi-hint">
                    {formatCents(dashboard.data.exemptionUsedCents)} de{" "}
                    {formatCents(dashboard.data.exemptionLimitCents)}
                  </p>
                  <div
                    className={`exemption-meter is-${dashboard.data.exemptionStatus}`}
                    data-testid="exemption-meter"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(100, dashboard.data.exemptionPercentUsed)}
                    aria-label="Uso da isenção mensal de ações swing"
                  >
                    <div
                      className="exemption-meter-fill"
                      style={{
                        width: `${Math.min(100, dashboard.data.exemptionPercentUsed)}%`,
                      }}
                    />
                  </div>
                  <p className="kpi-hint">
                    Restante: {formatCents(dashboard.data.exemptionRemainingCents)} ·{" "}
                    {dashboard.data.exemptionStatus}
                  </p>
                </article>
              </div>
            )}
          </section>
        )}

        {tab === "timeline" && (
          <section className="panel">
            <h2 className="section-title">Linha do tempo</h2>
            <p className="section-lead">Operações e eventos em ordem cronológica.</p>
            {timeline.status === "loading" && (
              <p className="state" role="status">
                Carregando linha do tempo…
              </p>
            )}
            {timeline.status === "empty" && (
              <p className="state state-empty" role="status">
                Nenhum evento registrado ainda.
              </p>
            )}
            {timeline.status === "error" && (
              <p className="state state-error" role="alert">
                {timeline.message}
              </p>
            )}
            {timeline.status === "success" && (
              <ol className="timeline" data-testid="timeline-list">
                {timeline.data.map((event) => (
                  <li key={event.id} className="timeline-item">
                    <time dateTime={event.date}>{event.date}</time>
                    <span className="timeline-kind">{event.kind}</span>
                    <span className="ticker">{event.ticker}</span>
                    <span className="timeline-summary">{event.summary}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {tab === "darf" && (
          <section className="panel">
            <h2 className="section-title">Calendário de DARF</h2>
            <p className="section-lead">
              Meses com DARF devido e vencimento no último dia útil do mês seguinte.
            </p>
            <div className="field">
              <label htmlFor="darf-year">Ano</label>
              <input
                id="darf-year"
                type="number"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </div>
            {darfCalendar.status === "loading" && (
              <p className="state" role="status">
                Carregando obrigações…
              </p>
            )}
            {darfCalendar.status === "empty" && (
              <p className="state state-empty" role="status">
                Nenhuma obrigação de DARF neste ano.
              </p>
            )}
            {darfCalendar.status === "error" && (
              <p className="state state-error" role="alert">
                {darfCalendar.message}
              </p>
            )}
            {darfCalendar.status === "success" && (
              <div className="table-wrap">
                <table className="table" data-testid="darf-calendar">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>DARF</th>
                      <th>Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {darfCalendar.data.map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td>{formatCents(row.darf.cents)}</td>
                        <td>{row.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === "upload" && (
          <section className="panel">
            <h2 className="section-title">Importar operações</h2>
            <p className="section-lead">
              Envie a planilha da sua corretora em CSV ou XLSX para atualizar suas operações.
            </p>
            <form onSubmit={onUpload}>
              <div
                className={dragging ? "dropzone is-dragging" : "dropzone"}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const dropped = event.dataTransfer.files?.[0];
                  if (!dropped) return;
                  const input = event.currentTarget.querySelector("input");
                  if (!input) return;
                  const transfer = new DataTransfer();
                  transfer.items.add(dropped);
                  input.files = transfer.files;
                  setFileName(dropped.name);
                }}
              >
                <p className="dropzone-title">{dragging ? "Solte o arquivo aqui" : "Planilha da corretora"}</p>
                <p className="dropzone-hint">{fileName ?? "Arraste o arquivo ou selecione no seu dispositivo"}</p>
                <div className="field">
                  <label htmlFor="file">Arquivo</label>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    accept=".csv,.xlsx,.xls,text/csv"
                    onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
                  />
                </div>
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
          <section className="panel">
            <h2 className="section-title">Sua carteira</h2>
            <p className="section-lead">
              Veja quantidade, preço médio e custo de aquisição de cada ativo.
            </p>
            {portfolio.status === "success" && (
              <div className="balance">
                <span className="balance-label">Custo total investido</span>
                <span className="balance-value">{formatCents(portfolioTotal)}</span>
              </div>
            )}
            {portfolio.status === "empty" && (
              <p className="state state-empty" role="status">
                Você ainda não possui posições. Importe suas operações para começar.
              </p>
            )}
            {portfolio.status === "error" && (
              <p className="state state-error" role="alert">
                {portfolio.message}
              </p>
            )}
            {portfolio.status === "success" && (
              <div className="split">
                <AllocationChart
                  rows={portfolio.data}
                  selected={selectedTicker}
                  onSelect={(ticker) => setSelectedTicker((current) => (current === ticker ? null : ticker))}
                />
                <div className="table-wrap">
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
                        <tr
                          key={row.ticker}
                          className={selectedTicker === row.ticker ? "is-selected" : undefined}
                          onClick={() =>
                            setSelectedTicker((current) => (current === row.ticker ? null : row.ticker))
                          }
                        >
                          <td>
                            <span className="ticker">{row.ticker}</span>
                          </td>
                          <td>{row.quantity}</td>
                          <td>{formatCents(row.averagePrice.cents)}</td>
                          <td className="money">{formatCents(row.acquisitionCost.cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "apuration" && (
          <section className="panel">
            <h2 className="section-title">Apuração mensal</h2>
            <p className="section-lead">
              Confira o resultado do mês, a isenção aplicada e o valor estimado de DARF.
            </p>
            <form onSubmit={onLoadApuration} className="stack">
              <div className="field">
                <label htmlFor="month">Mês de referência</label>
                <input id="month" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="AAAA-MM" />
              </div>
              <button className="btn-primary" type="submit">
                Ver apuração
              </button>
            </form>
            {apuration.status === "error" && (
              <p className="state state-error" role="alert">
                {apuration.message}
              </p>
            )}
            {apuration.status === "success" && (
              <>
                <div className="balance">
                  <span className="balance-label">DARF estimado</span>
                  <span className="balance-value">{formatCents(apuration.data.darf.cents)}</span>
                </div>
                <CompareBars
                  items={[
                    { label: "Resultado", cents: apuration.data.result.cents, tone: "money" },
                    { label: "Isenção", cents: apuration.data.exemptionApplied.cents, tone: "muted" },
                    { label: "DARF", cents: apuration.data.darf.cents, tone: "brand" },
                  ]}
                />
              </>
            )}
          </section>
        )}

        {tab === "declaration" && (
          <section className="panel">
            <h2 className="section-title">Declaração anual</h2>
            <p className="section-lead">
              Organize bens e direitos e os rendimentos do ano para a sua declaração.
            </p>
            <form onSubmit={onLoadDeclaration} className="stack">
              <div className="field">
                <label htmlFor="year">Ano-calendário</label>
                <input id="year" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <button className="btn-primary" type="submit">
                Ver declaração
              </button>
            </form>
            {declaration.status === "error" && (
              <p className="state state-error" role="alert">
                {declaration.message}
              </p>
            )}
            {declaration.status === "success" && (
              <>
                <h3 className="section-title" style={{ marginTop: "1.25rem" }}>
                  Bens e direitos
                </h3>
                {declaration.data.bensEDireitos.length === 0 ? (
                  <p className="state state-empty">Nenhum bem declarado neste ano.</p>
                ) : (
                  <div className="split">
                    <AllocationChart
                      rows={declaration.data.bensEDireitos}
                      selected={selectedTicker}
                      onSelect={(ticker) => setSelectedTicker((current) => (current === ticker ? null : ticker))}
                    />
                    <div className="table-wrap">
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
                            <tr
                              key={row.ticker}
                              className={selectedTicker === row.ticker ? "is-selected" : undefined}
                              onClick={() =>
                                setSelectedTicker((current) => (current === row.ticker ? null : row.ticker))
                              }
                            >
                              <td>
                                <span className="ticker">{row.ticker}</span>
                              </td>
                              <td>{row.quantity}</td>
                              <td className="money">{formatCents(row.acquisitionCost.cents)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {declaration.data.rendimentos.length > 0 && (
                  <div className="chart-block">
                    <IncomeBars lines={declaration.data.rendimentos} />
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
