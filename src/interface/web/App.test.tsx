import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import type { ApiClient } from "./api";

function mockApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    getPortfolio: vi.fn().mockResolvedValue([]),
    getApuration: vi.fn(),
    getDeclaration: vi.fn(),
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
  it("shows empty portfolio state", async () => {
    render(<App api={mockApi({ getPortfolio: vi.fn().mockResolvedValue([]) })} />);
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
      />,
    );
    expect((await screen.findAllByText("PETR4")).length).toBeGreaterThan(0);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("shows portfolio error", async () => {
    render(
      <App api={mockApi({ getPortfolio: vi.fn().mockRejectedValue(new Error("Failed to load portfolio")) })} />,
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

  it("loads demonstration portfolio from Carregar demonstração", async () => {
    const user = userEvent.setup();
    const resetDemo = vi.fn().mockResolvedValue({
      ok: true,
      tickers: ["PETR4", "VALE3", "ITUB4", "BBAS3", "HGLG11", "MXRF11"],
      modalities: ["DAY_TRADE", "SWING"],
      hasFii: true,
      hasProvento: true,
    });
    const getPortfolio = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          ticker: "PETR4",
          quantity: 200,
          averagePrice: { cents: 3000 },
          acquisitionCost: { cents: 600000 },
        },
        {
          ticker: "HGLG11",
          quantity: 20,
          averagePrice: { cents: 16500 },
          acquisitionCost: { cents: 330000 },
        },
      ]);
    render(<App api={mockApi({ resetDemo, getPortfolio })} />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Você ainda não possui posições. Importe suas operações para começar.",
    );
    await user.click(screen.getByRole("button", { name: "Carregar demonstração" }));
    await waitFor(() => {
      expect(resetDemo).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("Carteira de demonstração carregada.")).toBeInTheDocument();
    expect((await screen.findAllByText("PETR4")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("HGLG11")).length).toBeGreaterThan(0);
  });
});
