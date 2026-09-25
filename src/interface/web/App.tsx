import { useEffect, useState, type FormEvent } from "react";
import {
  createApiClient,
  formatCents,
  type AnnualDeclarationJson,
  type ApiClient,
  type DashboardJson,
  type DarfBreakdownJson,
  type DarfObligationJson,
  type InsightsJson,
  type CostEvolutionJson,
  type LossCarryforwardJson,
  type ModalityBreakdownJson,
  type MonthlyApurationJson,
  type PositionJson,
  type SimulateSaleJson,
  type TimelineEventJson,
  type YearComparisonJson,
} from "./api";
import { AllocationChart, CompareBars, IncomeBars, LineChart } from "./charts";
import { HelpTip } from "./HelpTip";
import { HELP } from "./helpCopy";
import "./styles.css";

type Tab =
  | "dashboard"
  | "timeline"
  | "darf"
  | "losses"
  | "compare"
  | "simulate"
  | "upload"
  | "portfolio"
  | "apuration"
  | "declaration";

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
  { id: "losses", label: "Prejuízos" },
  { id: "compare", label: "Anos" },
  { id: "simulate", label: "Simular" },
  { id: "upload", label: "Importar" },
  { id: "portfolio", label: "Carteira" },
  { id: "apuration", label: "Apuração" },
  { id: "declaration", label: "Declaração" },
];

export function App({ api: apiProp, initialTab = "dashboard" }: AppProps) {
  const [api] = useState(() => apiProp ?? createApiClient());
  const [tab, setTab] = useState<Tab>(initialTab);
  const [dashboard, setDashboard] = useState<LoadState<DashboardJson>>({ status: "idle" });
  const [modality, setModality] = useState<LoadState<ModalityBreakdownJson>>({ status: "idle" });
  const [insights, setInsights] = useState<LoadState<InsightsJson>>({ status: "idle" });
  const [darfBreakdown, setDarfBreakdown] = useState<LoadState<DarfBreakdownJson>>({ status: "idle" });
  const [costEvolution, setCostEvolution] = useState<LoadState<CostEvolutionJson>>({ status: "idle" });
  const [yearComparison, setYearComparison] = useState<LoadState<YearComparisonJson>>({ status: "idle" });
  const [simulation, setSimulation] = useState<LoadState<SimulateSaleJson>>({ status: "idle" });
  const [checklist, setChecklist] = useState({ bens: false, rendimentos: false, darf: false });
  const [simTicker, setSimTicker] = useState("PETR4");
  const [simQty, setSimQty] = useState("10");
  const [simPrice, setSimPrice] = useState("35.00");
  const [yearB, setYearB] = useState("2023");
  const [timeline, setTimeline] = useState<LoadState<TimelineEventJson[]>>({ status: "idle" });
  const [darfCalendar, setDarfCalendar] = useState<LoadState<DarfObligationJson[]>>({
    status: "idle",
  });
  const [losses, setLosses] = useState<LoadState<LossCarryforwardJson>>({
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
  const [lossesReload, setLossesReload] = useState(0);
  const [assetHistory, setAssetHistory] = useState<LoadState<TimelineEventJson[]>>({ status: "idle" });
  const [tickerFilter, setTickerFilter] = useState("");

  useEffect(() => {
    if (tab !== "portfolio" || !selectedTicker) {
      setAssetHistory({ status: "idle" });
      return;
    }
    let cancelled = false;
    setAssetHistory({ status: "loading" });
    api
      .getTimeline()
      .then((events) => {
        if (cancelled) return;
        const filtered = events.filter((event) => event.ticker === selectedTicker);
        setAssetHistory(
          filtered.length === 0 ? { status: "empty" } : { status: "success", data: filtered },
        );
      })
      .catch(() => {
        if (cancelled) return;
        setAssetHistory({
          status: "error",
          message: "Não foi possível carregar o histórico do ativo.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [api, tab, selectedTicker]);

  useEffect(() => {
    if (tab !== "dashboard") return;
    let cancelled = false;
    setDashboard({ status: "loading" });
    setModality({ status: "loading" });
    setInsights({ status: "loading" });
    setDarfBreakdown({ status: "loading" });
    setCostEvolution({ status: "loading" });
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
    api
      .getModalityBreakdown(month)
      .then((data) => {
        if (cancelled) return;
        setModality({ status: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        setModality({
          status: "error",
          message: "Não foi possível carregar day trade vs swing.",
        });
      });
    api
      .getInsights(month)
      .then((data) => {
        if (cancelled) return;
        setInsights({ status: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        setInsights({ status: "error", message: "Não foi possível carregar insights." });
      });
    api
      .getDarfBreakdown(month)
      .then((data) => {
        if (cancelled) return;
        setDarfBreakdown({ status: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        setDarfBreakdown({ status: "error", message: "Não foi possível explicar o DARF." });
      });
    api
      .getPortfolioCostEvolution()
      .then((data) => {
        if (cancelled) return;
        setCostEvolution({ status: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        setCostEvolution({ status: "error", message: "Não foi possível carregar a evolução do custo." });
      });
    return () => {
      cancelled = true;
    };
  }, [api, tab, month, dashboardReload]);

  useEffect(() => {
    if (tab !== "compare") return;
    let cancelled = false;
    setYearComparison({ status: "loading" });
    api
      .getYearComparison(Number.parseInt(yearB, 10), Number.parseInt(year, 10))
      .then((data) => {
        if (cancelled) return;
        setYearComparison({ status: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        setYearComparison({ status: "error", message: "Não foi possível comparar os anos." });
      });
    return () => {
      cancelled = true;
    };
  }, [api, tab, year, yearB]);

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
    if (tab !== "losses") return;
    let cancelled = false;
    setLosses({ status: "loading" });
    api
      .getLossCarryforward(Number.parseInt(year, 10))
      .then((data) => {
        if (cancelled) return;
        setLosses(data.points.length === 0 ? { status: "empty" } : { status: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        setLosses({
          status: "error",
          message: "Não foi possível carregar a evolução de prejuízos.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [api, tab, year, lossesReload]);

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
      setLossesReload((n) => n + 1);
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

  const filteredPortfolio =
    portfolio.status === "success"
      ? portfolio.data.filter((row) =>
          row.ticker.toUpperCase().includes(tickerFilter.trim().toUpperCase()),
        )
      : [];

  return (
    <div className="app print-root">
      <aside className="sidebar no-print">
        <div className="brand-lockup">
          <img className="brand-mark" src="/logo.png" alt="" width={36} height={36} />
          <div className="brand-text">
            <p className="brand-name">Fiscal B3</p>
            <p className="brand-tag">Organização fiscal</p>
          </div>
        </div>
        <div className="sidebar-actions">
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
      </aside>
      <div className="app-body">
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
                  <p className="kpi-label">
                    Custo investido
                    <HelpTip label="Custo investido" text={HELP.custoInvestido} />
                  </p>
                  <p className="kpi-value money">{formatCents(dashboard.data.investedCost.cents)}</p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-label">Ativos</p>
                  <p className="kpi-value">{dashboard.data.assetCount}</p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-label">
                    DARF do mês
                    <HelpTip label="DARF" text={HELP.darf} />
                  </p>
                  <p className="kpi-value">{formatCents(dashboard.data.monthDarf.cents)}</p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-label">
                    Isenção usada
                    <HelpTip label="Isenção" text={HELP.isencao} />
                  </p>
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
            {modality.status === "success" && (
              <>
                <div className="modality-grid" data-testid="modality-breakdown">
                  {modality.data.buckets.map((bucket) => (
                    <article key={bucket.modality} className="modality-card">
                      <h3>
                        {bucket.modality === "DAY_TRADE" ? "Day trade" : "Swing trade"}
                        <HelpTip
                          label={bucket.modality === "DAY_TRADE" ? "Day trade" : "Swing trade"}
                          text={bucket.modality === "DAY_TRADE" ? HELP.dayTrade : HELP.swingTrade}
                        />
                      </h3>
                      <p>
                        Resultado: <strong>{formatCents(bucket.result.cents)}</strong>
                      </p>
                      <p>
                        Imposto: <strong>{formatCents(bucket.tax.cents)}</strong>
                      </p>
                      <p>
                        Prejuízo a compensar{" "}
                        <HelpTip label="Prejuízo a compensar" text={HELP.prejuizoCompensar} />:{" "}
                        <strong>{formatCents(bucket.lossCarryforward.cents)}</strong>
                      </p>
                    </article>
                  ))}
                </div>
                <CompareBars
                  title="Day trade vs swing"
                  items={modality.data.buckets.flatMap((bucket) => [
                    {
                      label: `${bucket.modality === "DAY_TRADE" ? "Day" : "Swing"} · resultado`,
                      cents: bucket.result.cents,
                      tone: "money" as const,
                    },
                    {
                      label: `${bucket.modality === "DAY_TRADE" ? "Day" : "Swing"} · imposto`,
                      cents: bucket.tax.cents,
                      tone: "brand" as const,
                    },
                  ])}
                />
              </>
            )}
            {modality.status === "error" && (
              <p className="state state-error" role="alert">
                {modality.message}
              </p>
            )}
            {darfBreakdown.status === "success" && (
              <div className="asset-detail" data-testid="darf-breakdown">
                <h3>
                  Por que este DARF? <HelpTip label="DARF" text={HELP.darf} />
                </h3>
                <p>Resultado: {formatCents(darfBreakdown.data.grossResult.cents)}</p>
                <p>
                  Isenção aplicada <HelpTip label="Isenção" text={HELP.isencao} />:{" "}
                  {formatCents(darfBreakdown.data.exemptionApplied.cents)}
                </p>
                <p>
                  Base tributável <HelpTip label="Base tributável" text={HELP.baseTributavel} />:{" "}
                  {formatCents(darfBreakdown.data.taxableBase.cents)}
                </p>
                <p>Alíquota: {darfBreakdown.data.ratePercent}%</p>
                <p>DARF: {formatCents(darfBreakdown.data.darf.cents)}</p>
              </div>
            )}
            {insights.status === "success" && (
              <div className="modality-grid" data-testid="insight-cards">
                {insights.data.cards.map((card) => (
                  <article key={card.id} className="modality-card">
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
            )}
            {costEvolution.status === "success" && (
              <div data-testid="cost-evolution">
                <LineChart
                  title="Evolução do custo da carteira"
                  labels={costEvolution.data.points.map((point) => point.month)}
                  series={[
                    {
                      key: "cost",
                      label: "Custo",
                      values: costEvolution.data.points.map((point) => point.costCents),
                      tone: "brand",
                    },
                  ]}
                />
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
            <h2 className="section-title">
              Calendário de DARF
              <HelpTip label="Calendário de DARF" text={HELP.vencimentoDarf} />
            </h2>
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
              <>
                <CompareBars
                  title="DARF por mês"
                  items={darfCalendar.data.map((row) => ({
                    label: row.month,
                    cents: row.darf.cents,
                    tone: "brand" as const,
                  }))}
                />
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
              </>
            )}
          </section>
        )}

        {tab === "losses" && (
          <section className="panel">
            <h2 className="section-title">
              Prejuízos a compensar
              <HelpTip label="Prejuízos a compensar" text={HELP.prejuizoCompensar} />
            </h2>
            <p className="section-lead">Evolução mensal separada por day trade e swing.</p>
            <div className="field">
              <label htmlFor="losses-year">Ano</label>
              <input
                id="losses-year"
                type="number"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </div>
            {losses.status === "empty" && (
              <p className="state state-empty" role="status">
                Nenhum prejuízo acumulado neste ano.
              </p>
            )}
            {losses.status === "error" && (
              <p className="state state-error" role="alert">
                {losses.message}
              </p>
            )}
            {losses.status === "success" && (
              <>
                <LineChart
                  title="Prejuízo a compensar no tempo"
                  labels={losses.data.points.map((row) => row.month)}
                  series={[
                    {
                      key: "day",
                      label: "Day trade",
                      values: losses.data.points.map((row) => row.dayTrade.cents),
                      tone: "brand",
                    },
                    {
                      key: "swing",
                      label: "Swing",
                      values: losses.data.points.map((row) => row.swing.cents),
                      tone: "money",
                    },
                  ]}
                />
                <div className="table-wrap">
                  <table className="table" data-testid="loss-carryforward">
                    <thead>
                      <tr>
                        <th>Mês</th>
                        <th>Day trade</th>
                        <th>Swing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {losses.data.points.map((row) => (
                        <tr key={row.month}>
                          <td>{row.month}</td>
                          <td>{formatCents(row.dayTrade.cents)}</td>
                          <td>{formatCents(row.swing.cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {tab === "compare" && (
          <section className="panel">
            <h2 className="section-title">Comparativo anual</h2>
            <p className="section-lead">Compare custo, rendimentos e DARF entre dois anos.</p>
            <div className="field">
              <label htmlFor="year-a">Ano A</label>
              <input id="year-a" value={yearB} onChange={(e) => setYearB(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="year-b">Ano B</label>
              <input id="year-b" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            {yearComparison.status === "success" && (
              <>
                <div className="modality-grid" data-testid="year-comparison">
                  <article className="modality-card">
                    <h3>{yearComparison.data.yearA}</h3>
                    <p>Custo: {formatCents(yearComparison.data.costA.cents)}</p>
                    <p>Rendimentos: {formatCents(yearComparison.data.incomeA.cents)}</p>
                    <p>DARF: {formatCents(yearComparison.data.darfA.cents)}</p>
                  </article>
                  <article className="modality-card">
                    <h3>{yearComparison.data.yearB}</h3>
                    <p>Custo: {formatCents(yearComparison.data.costB.cents)}</p>
                    <p>Rendimentos: {formatCents(yearComparison.data.incomeB.cents)}</p>
                    <p>DARF: {formatCents(yearComparison.data.darfB.cents)}</p>
                  </article>
                </div>
                <CompareBars
                  title="Comparativo lado a lado"
                  items={[
                    {
                      label: `Custo ${yearComparison.data.yearA}`,
                      cents: yearComparison.data.costA.cents,
                      tone: "muted",
                    },
                    {
                      label: `Custo ${yearComparison.data.yearB}`,
                      cents: yearComparison.data.costB.cents,
                      tone: "brand",
                    },
                    {
                      label: `Rend. ${yearComparison.data.yearA}`,
                      cents: yearComparison.data.incomeA.cents,
                      tone: "muted",
                    },
                    {
                      label: `Rend. ${yearComparison.data.yearB}`,
                      cents: yearComparison.data.incomeB.cents,
                      tone: "money",
                    },
                    {
                      label: `DARF ${yearComparison.data.yearA}`,
                      cents: yearComparison.data.darfA.cents,
                      tone: "muted",
                    },
                    {
                      label: `DARF ${yearComparison.data.yearB}`,
                      cents: yearComparison.data.darfB.cents,
                      tone: "brand",
                    },
                  ]}
                />
              </>
            )}
            {yearComparison.status === "error" && (
              <p className="state state-error" role="alert">
                {yearComparison.message}
              </p>
            )}
          </section>
        )}

        {tab === "simulate" && (
          <section className="panel">
            <h2 className="section-title">
              Simular venda
              <HelpTip label="Simular venda" text={HELP.simularVenda} />
            </h2>
            <p className="section-lead">Estime ganho e IR do mês sem gravar a operação.</p>
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                setSimulation({ status: "loading" });
                const priceCents = Math.round(Number.parseFloat(simPrice) * 100);
                void api
                  .simulateSale({
                    ticker: simTicker,
                    quantity: Number.parseInt(simQty, 10),
                    priceCents,
                    month,
                  })
                  .then((data) => setSimulation({ status: "success", data }))
                  .catch(() =>
                    setSimulation({ status: "error", message: "Não foi possível simular a venda." }),
                  );
              }}
            >
              <div className="field">
                <label htmlFor="sim-ticker">Ticker</label>
                <input id="sim-ticker" value={simTicker} onChange={(e) => setSimTicker(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="sim-qty">Quantidade</label>
                <input id="sim-qty" value={simQty} onChange={(e) => setSimQty(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="sim-price">Preço (R$)</label>
                <input id="sim-price" value={simPrice} onChange={(e) => setSimPrice(e.target.value)} />
              </div>
              <button className="btn-primary" type="submit">
                Simular
              </button>
            </form>
            {simulation.status === "success" && (
              <div className="asset-detail" data-testid="simulate-result">
                <p>Ganho/perda estimado: {formatCents(simulation.data.estimatedGainCents)}</p>
                <p>IR estimado: {formatCents(simulation.data.estimatedTaxCents)}</p>
                <p>Não persistido</p>
                <CompareBars
                  title="Impacto estimado da venda"
                  items={[
                    {
                      label: "Ganho/perda",
                      cents: simulation.data.estimatedGainCents,
                      tone: "money",
                    },
                    {
                      label: "IR estimado",
                      cents: simulation.data.estimatedTaxCents,
                      tone: "brand",
                    },
                  ]}
                />
              </div>
            )}
            {simulation.status === "error" && (
              <p className="state state-error" role="alert">
                {simulation.message}
              </p>
            )}
          </section>
        )}

        {tab === "upload" && (
          <section className="panel">
            <h2 className="section-title">Importar operações</h2>
            <p className="section-lead">
              Envie a planilha da sua corretora em CSV ou XLSX para atualizar suas operações.
            </p>
            <form onSubmit={onUpload} className="upload-form">
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
              <div className="field">
                <label htmlFor="ticker-filter">Filtrar ticker</label>
                <input
                  id="ticker-filter"
                  value={tickerFilter}
                  onChange={(event) => setTickerFilter(event.target.value)}
                  placeholder="Ex.: PETR"
                />
              </div>
            )}
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
                  rows={filteredPortfolio}
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
                      {filteredPortfolio.map((row) => (
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
            {portfolio.status === "success" && selectedTicker && (
              <aside className="asset-detail" data-testid="asset-detail">
                {(() => {
                  const row = portfolio.data.find((item) => item.ticker === selectedTicker);
                  if (!row) return null;
                  return (
                    <>
                      <h3>Detalhe · {row.ticker}</h3>
                      <p>
                        Quantidade: <strong>{row.quantity}</strong>
                      </p>
                      <p>
                        Preço médio <HelpTip label="Preço médio" text={HELP.precoMedio} />:{" "}
                        <strong>{formatCents(row.averagePrice.cents)}</strong>
                      </p>
                      <p>
                        Custo de aquisição:{" "}
                        <strong className="money">{formatCents(row.acquisitionCost.cents)}</strong>
                      </p>
                      <h4>Histórico recente</h4>
                      {assetHistory.status === "loading" && (
                        <p className="state" role="status">
                          Carregando histórico…
                        </p>
                      )}
                      {assetHistory.status === "empty" && (
                        <p className="state state-empty" role="status">
                          Sem eventos para este ativo.
                        </p>
                      )}
                      {assetHistory.status === "error" && (
                        <p className="state state-error" role="alert">
                          {assetHistory.message}
                        </p>
                      )}
                      {assetHistory.status === "success" && (
                        <ul className="asset-history">
                          {assetHistory.data.map((event) => (
                            <li key={event.id}>
                              <time dateTime={event.date}>{event.date}</time> · {event.kind} ·{" "}
                              {event.summary}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  );
                })()}
              </aside>
            )}
          </section>
        )}

        {tab === "apuration" && (
          <section className="panel">
            <h2 className="section-title">
              Apuração mensal
              <HelpTip label="Apuração mensal" text={HELP.apuracao} />
            </h2>
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
                  <span className="balance-label">
                    DARF estimado
                    <HelpTip label="DARF" text={HELP.darf} />
                  </span>
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
            <p className="section-lead">
              <a
                className="btn-accent"
                href={api.getDeclarationCsvUrl(Number.parseInt(year, 10) || 2024)}
                download={`declaracao-${year}.csv`}
              >
                Baixar CSV
              </a>
            </p>
            {declaration.status === "error" && (
              <p className="state state-error" role="alert">
                {declaration.message}
              </p>
            )}
            {declaration.status === "success" && (
              <>
                <div className="asset-detail" data-testid="declaration-checklist">
                  <h3>Checklist da declaração</h3>
                  <label>
                    <input
                      type="checkbox"
                      checked={checklist.bens}
                      onChange={(e) => setChecklist((c) => ({ ...c, bens: e.target.checked }))}
                    />{" "}
                    Bens e direitos conferidos ({declaration.data.bensEDireitos.length} itens)
                  </label>
                  <br />
                  <label>
                    <input
                      type="checkbox"
                      checked={checklist.rendimentos}
                      onChange={(e) => setChecklist((c) => ({ ...c, rendimentos: e.target.checked }))}
                    />{" "}
                    Rendimentos conferidos ({declaration.data.rendimentos.length} linhas)
                  </label>
                  <br />
                  <label>
                    <input
                      type="checkbox"
                      checked={checklist.darf}
                      onChange={(e) => setChecklist((c) => ({ ...c, darf: e.target.checked }))}
                    />{" "}
                    DARF do ano revisado
                  </label>
                </div>
                <h3 className="section-title">
                  Bens e direitos
                  <HelpTip label="Bens e direitos" text={HELP.bensDireitos} />
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
    </div>
  );
}
