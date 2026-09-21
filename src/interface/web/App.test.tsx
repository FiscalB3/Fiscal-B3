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
    ...overrides,
  };
}

describe("Web UI", () => {
  it("shows empty portfolio state", async () => {
    render(<App api={mockApi({ getPortfolio: vi.fn().mockResolvedValue([]) })} />);
    expect(await screen.findByRole("status")).toHaveTextContent("Nenhuma posição encontrada");
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
    expect(await screen.findByText("PETR4")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("shows portfolio error", async () => {
    render(
      <App api={mockApi({ getPortfolio: vi.fn().mockRejectedValue(new Error("Failed to load portfolio")) })} />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load portfolio");
  });

  it("shows upload success", async () => {
    const user = userEvent.setup();
    const importFile = vi.fn().mockResolvedValue({ ok: true });
    render(<App api={mockApi({ importFile })} initialTab="upload" />);
    const file = new File(["ticker,qty\n"], "ops.csv", { type: "text/csv" });
    await user.upload(screen.getByLabelText("Arquivo"), file);
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Importação concluída");
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
});
