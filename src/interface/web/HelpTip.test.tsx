import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HelpTip } from "./HelpTip";

describe("HelpTip", () => {
  it("shows explanation on click", async () => {
    const user = userEvent.setup();
    render(<HelpTip label="DARF" text="Guia de pagamento do IR." />);

    const button = screen.getByRole("button", { name: "O que é: DARF" });
    expect(screen.getByRole("tooltip")).toHaveTextContent("Guia de pagamento do IR.");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
