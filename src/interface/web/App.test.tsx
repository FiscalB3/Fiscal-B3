import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import type { ApiClient, DashboardJson } from "./api";

const sampleDashboard: DashboardJson = {
  month: "2024-03",
  investedCost: { cents: 773400 },
  assetCount: 3,
  monthDarf: { cents: 22500 },
  exemptionUsedCents: 850000,
  exemptionLimitCents: 2000000,
  exemptionPercentUsed: 42.5,
  exemptionStatus: "ok",
  exemptionRemainingCents: 1150000,
};

function mockApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    getPortfolio: vi.fn().mockResolvedValue([]),
    getDashboard: vi.fn().mockResolvedValue({
      ...sampleDashboard,
      assetCount: 0,
      investedCost: { cents: 0 },
    }),
    getTimeline: vi.fn().mockResolvedValue([]),
    getDarfCalendar: vi.fn().mockResolvedValue([]),
    getModalityBreakdown: vi.fn().mockResolvedValue({
      month: "2024-03",
      buckets: [
        {
          modality: "SWING",
          result: { cents: 150000 },
          tax: { cents: 22500 },
          lossCarryforward: { cents: 0 },
        },
        {
          modality: "DAY_TRADE",
          result: { cents: 0 },
          tax: { cents: 0 },
          lossCarryforward: { cents: 40000 },
        },
      ],
    }),
    getLossCarryforward: vi.fn().mockResolvedValue({ points: [] }),
    getDarfBreakdown: vi.fn().mockResolvedValue({
      month: "2024-03",
      grossResult: { cents: 150000 },
      exemptionApplied: { cents: 0 },
      taxableBase: { cents: 150000 },
      ratePercent: 15,
      darf: { cents: 22500 },
    }),
    getInsights: vi.fn().mockResolvedValue({
      cards: [
        { id: "fii-share", title: "Concentração em FIIs", body: "31% do custo investido está em FIIs." },
        { id: "top-darf", title: "Maior DARF", body: "O mês 2024-03 teve o maior DARF." },
      ],
    }),
    getYearComparison: vi.fn().mockResolvedValue({
      yearA: 2023,
      yearB: 2024,
      costA: { cents: 500000 },
      costB: { cents: 773400 },
      incomeA: { cents: 10000 },
      incomeB: { cents: 32500 },
      darfA: { cents: 0 },
      darfB: { cents: 34500 },
    }),
    getPortfolioCostEvolution: vi.fn().mockResolvedValue({
      points: [
        { month: "2024-01", costCents: 500000 },
        { month: "2024-03", costCents: 773400 },
      ],
    }),
    simulateSale: vi.fn().mockResolvedValue({
      estimatedGainCents: 6500,
      estimatedTaxCents: 975,
      persisted: false,
    }),
    getApuration: vi.fn(),
    getDeclaration: vi.fn(),
    getDeclarationCsvUrl: vi.fn((year: number) => `/declaration.csv?year=${year}`),
    importFile: vi.fn(),
    resetDemo: vi.fn().mockResolvedValue({
      ok: true,
      tickers: ["PETR4", "VALE3", "ITUB4", "BBAS3", "HGLG11", "MXRF11"],
      modalities: ["DAY_TRADE", "SWING"],
      hasFii: true,
      hasProvento: true,
    }),
    ...overrides,
  };
}

describe("Web UI", () => {
  it("opens on dashboard by default", async () => {
    render(<App api={mockApi({ getDashboard: vi.fn().mockResolvedValue(sampleDashboard) })} />);
    expect(await screen.findByTestId("dashboard-kpis")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Início" })).toHaveAttribute("aria-current", "page");
  });

  it("shows dashboard KPIs from API", async () => {
    render(<App api={mockApi({ getDashboard: vi.fn().mockResolvedValue(sampleDashboard) })} />);
    expect(await screen.findByText("Custo investido")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 7734,00").length).toBeGreaterThan(0);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 225,00").length).toBeGreaterThan(0);
    expect(screen.getByText("42.5%")).toBeInTheDocument();
    expect(screen.getByTestId("exemption-meter")).toHaveClass("is-ok");
    expect(await screen.findByTestId("insight-cards")).toBeInTheDocument();
    expect(screen.getByTestId("darf-breakdown")).toBeInTheDocument();
    expect(screen.getByTestId("cost-evolution")).toBeInTheDocument();
  });

  it("shows empty dashboard state", async () => {
    render(
      <App
        api={mockApi({
          getDashboard: vi.fn().mockResolvedValue({
            ...sampleDashboard,
            assetCount: 0,
            investedCost: { cents: 0 },
          }),
        })}
      />,
    );
    expect(
      await screen.findByText(
        "Você ainda não possui posições. Importe operações ou carregue a demonstração.",
      ),
    ).toBeInTheDocument();
  });

  it("shows dashboard error", async () => {
    render(
      <App api={mockApi({ getDashboard: vi.fn().mockRejectedValue(new Error("Failed to load dashboard")) })} />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar o resumo. Tente novamente em instantes.",
    );
  });

  it("shows empty portfolio state", async () => {
    render(<App api={mockApi({ getPortfolio: vi.fn().mockResolvedValue([]) })} initialTab="portfolio" />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Você ainda não possui posições. Importe suas operações para começar.",
    );
  });

  it("shows portfolio success with ticker", async () => {
    render(
      <App
        api={mockApi({
          getPortfolio: vi.fn().mockResolvedValue([
            {
              ticker: "PETR4",
              quantity: 100,
              averagePrice: { cents: 2850 },
              acquisitionCost: { cents: 285000 },
            },
          ]),
        })}
        initialTab="portfolio"
      />,
    );
    expect((await screen.findAllByText("PETR4")).length).toBeGreaterThan(0);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("shows portfolio error", async () => {
    render(
      <App
        api={mockApi({ getPortfolio: vi.fn().mockRejectedValue(new Error("Failed to load portfolio")) })}
        initialTab="portfolio"
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar sua carteira. Tente novamente em instantes.",
    );
  });

  it("shows upload success", async () => {
    const user = userEvent.setup();
    const importFile = vi.fn().mockResolvedValue({ ok: true });
    render(<App api={mockApi({ importFile })} initialTab="upload" />);
    const file = new File(["ticker,qty\n"], "ops.csv", { type: "text/csv" });
    await user.upload(screen.getByLabelText("Arquivo"), file);
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Suas operações foram importadas com sucesso.");
    });
  });

  it("shows upload error", async () => {
    const user = userEvent.setup();
    const importFile = vi.fn().mockResolvedValue({
      ok: false,
      errors: [{ line: 2, message: "invalid quantity" }],
    });
    render(<App api={mockApi({ importFile })} initialTab="upload" />);
    const file = new File(["bad"], "ops.csv", { type: "text/csv" });
    await user.upload(screen.getByLabelText("Arquivo"), file);
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Linha 2: invalid quantity");
    });
  });

  it("loads demonstration and shows dashboard KPIs", async () => {
    const user = userEvent.setup();
    const resetDemo = vi.fn().mockResolvedValue({
      ok: true,
      tickers: ["PETR4", "VALE3", "ITUB4", "BBAS3", "HGLG11", "MXRF11"],
      modalities: ["DAY_TRADE", "SWING"],
      hasFii: true,
      hasProvento: true,
    });
    const getDashboard = vi
      .fn()
      .mockResolvedValueOnce({
        ...sampleDashboard,
        assetCount: 0,
        investedCost: { cents: 0 },
      })
      .mockResolvedValueOnce({
        month: "2024-03",
        investedCost: { cents: 2245000 },
        assetCount: 6,
        monthDarf: { cents: 48000 },
        exemptionUsedCents: 1820000,
        exemptionLimitCents: 2000000,
        exemptionPercentUsed: 91,
        exemptionStatus: "warning",
        exemptionRemainingCents: 180000,
      });
    render(<App api={mockApi({ resetDemo, getDashboard })} />);
    expect(
      await screen.findByText(
        "Você ainda não possui posições. Importe operações ou carregue a demonstração.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Carregar demonstração" }));
    await waitFor(() => {
      expect(resetDemo).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("Carteira de demonstração carregada.")).toBeInTheDocument();
    expect(await screen.findByTestId("dashboard-kpis")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByTestId("exemption-meter")).toHaveClass("is-warning");
  });

  it("shows timeline events ordered with type ticker and date", async () => {
    render(
      <App
        api={mockApi({
          getTimeline: vi.fn().mockResolvedValue([
            {
              id: "1",
              date: "2024-01-10",
              kind: "BUY",
              ticker: "PETR4",
              summary: "Compra de 100 PETR4",
            },
            {
              id: "2",
              date: "2024-03-12",
              kind: "SELL",
              ticker: "PETR4",
              summary: "Venda swing de 20 PETR4",
            },
          ]),
        })}
        initialTab="timeline"
      />,
    );
    const list = await screen.findByTestId("timeline-list");
    expect(list).toBeInTheDocument();
    expect(screen.getByText("2024-01-10")).toBeInTheDocument();
    expect(screen.getByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("SELL")).toBeInTheDocument();
    expect(screen.getByText("Compra de 100 PETR4")).toBeInTheDocument();
  });

  it("shows empty timeline state", async () => {
    render(<App api={mockApi({ getTimeline: vi.fn().mockResolvedValue([]) })} initialTab="timeline" />);
    expect(await screen.findByText("Nenhum evento registrado ainda.")).toBeInTheDocument();
  });

  it("shows timeline error", async () => {
    render(
      <App
        api={mockApi({ getTimeline: vi.fn().mockRejectedValue(new Error("Failed to load timeline")) })}
        initialTab="timeline"
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar a linha do tempo. Tente novamente.",
    );
  });

  it("shows DARF calendar with due dates from API", async () => {
    render(
      <App
        api={mockApi({
          getDarfCalendar: vi.fn().mockResolvedValue([
            { month: "2024-03", darf: { cents: 22500 }, dueDate: "2024-04-30" },
            { month: "2024-05", darf: { cents: 9000 }, dueDate: "2024-06-28" },
          ]),
        })}
        initialTab="darf"
      />,
    );
    expect(await screen.findByTestId("darf-calendar")).toBeInTheDocument();
    expect(screen.getByText("2024-03")).toBeInTheDocument();
    expect(screen.getByText("2024-04-30")).toBeInTheDocument();
    expect(screen.getByText("R$ 225,00")).toBeInTheDocument();
  });

  it("shows empty DARF calendar", async () => {
    render(<App api={mockApi({ getDarfCalendar: vi.fn().mockResolvedValue([]) })} initialTab="darf" />);
    expect(await screen.findByText("Nenhuma obrigação de DARF neste ano.")).toBeInTheDocument();
  });

  it("shows day vs swing modality buckets side by side", async () => {
    render(<App api={mockApi({ getDashboard: vi.fn().mockResolvedValue(sampleDashboard) })} />);
    expect(await screen.findByTestId("modality-breakdown")).toBeInTheDocument();
    expect(screen.getByText("Swing trade")).toBeInTheDocument();
    expect(screen.getByText("Day trade")).toBeInTheDocument();
    expect(screen.getByText("R$ 400,00")).toBeInTheDocument();
  });

  it("shows loss carryforward evolution with separate modalities", async () => {
    render(
      <App
        api={mockApi({
          getLossCarryforward: vi.fn().mockResolvedValue({
            points: [
              { month: "2024-01", dayTrade: { cents: 50000 }, swing: { cents: 20000 } },
              { month: "2024-03", dayTrade: { cents: 40000 }, swing: { cents: 0 } },
            ],
          }),
        })}
        initialTab="losses"
      />,
    );
    expect(await screen.findByTestId("loss-carryforward")).toBeInTheDocument();
    expect(screen.getByText("2024-01")).toBeInTheDocument();
    expect(screen.getByText("R$ 500,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 200,00")).toBeInTheDocument();
  });

  it("opens asset detail from portfolio without recalculating average price", async () => {
    const user = userEvent.setup();
    render(
      <App
        api={mockApi({
          getPortfolio: vi.fn().mockResolvedValue([
            {
              ticker: "PETR4",
              quantity: 100,
              averagePrice: { cents: 2850 },
              acquisitionCost: { cents: 285000 },
            },
          ]),
          getTimeline: vi.fn().mockResolvedValue([
            {
              id: "1",
              date: "2024-01-10",
              kind: "BUY",
              ticker: "PETR4",
              summary: "Compra de 100 PETR4",
            },
          ]),
        })}
        initialTab="portfolio"
      />,
    );
    expect((await screen.findAllByText("PETR4")).length).toBeGreaterThan(0);
    const row = screen.getByText("100").closest("tr");
    expect(row).toBeTruthy();
    await user.click(row!);
    expect(await screen.findByTestId("asset-detail")).toBeInTheDocument();
    expect(screen.getByText("Detalhe · PETR4")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 28,50").length).toBeGreaterThan(0);
    expect(screen.getByText(/Compra de 100 PETR4/)).toBeInTheDocument();
  });

  it("filters portfolio table and chart by ticker", async () => {
    const user = userEvent.setup();
    render(
      <App
        api={mockApi({
          getPortfolio: vi.fn().mockResolvedValue([
            {
              ticker: "PETR4",
              quantity: 100,
              averagePrice: { cents: 2850 },
              acquisitionCost: { cents: 285000 },
            },
            {
              ticker: "VALE3",
              quantity: 40,
              averagePrice: { cents: 6210 },
              acquisitionCost: { cents: 248400 },
            },
          ]),
        })}
        initialTab="portfolio"
      />,
    );
    expect((await screen.findAllByText("PETR4")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("VALE3").length).toBeGreaterThan(0);
    await user.type(screen.getByLabelText("Filtrar ticker"), "vale");
    expect(screen.queryByText("PETR4")).not.toBeInTheDocument();
    expect(screen.getAllByText("VALE3").length).toBeGreaterThan(0);
  });

  it("shows CSV download link on declaration tab", async () => {
    render(<App api={mockApi()} initialTab="declaration" />);
    const link = await screen.findByRole("link", { name: "Baixar CSV" });
    expect(link).toHaveAttribute("href", "/declaration.csv?year=2024");
  });

  it("uses print-root class for print-ready layout", () => {
    const { container } = render(<App api={mockApi()} />);
    expect(container.querySelector(".print-root")).toBeInTheDocument();
    expect(container.querySelector(".topbar")).toHaveClass("no-print");
  });

  it("shows year comparison side by side", async () => {
    render(<App api={mockApi()} initialTab="compare" />);
    expect(await screen.findByTestId("year-comparison")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("simulates a sale without persisting", async () => {
    const user = userEvent.setup();
    const simulateSale = vi.fn().mockResolvedValue({
      estimatedGainCents: 6500,
      estimatedTaxCents: 975,
      persisted: false,
    });
    render(<App api={mockApi({ simulateSale })} initialTab="simulate" />);
    const buttons = screen.getAllByRole("button", { name: /^Simular$/ });
    await user.click(buttons[buttons.length - 1]);
    expect(await screen.findByTestId("simulate-result")).toBeInTheDocument();
    expect(simulateSale).toHaveBeenCalled();
    expect(screen.getByText(/Não persistido/)).toBeInTheDocument();
  });
});
