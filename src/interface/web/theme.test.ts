import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ocean theme tokens", () => {
  it("DESIGN.md documents teal/green brand tokens without purple", () => {
    const design = readFileSync(resolve(process.cwd(), "DESIGN.md"), "utf8");
    expect(design).toContain('brand: "#0F766E"');
    expect(design).toContain('money: "#0D9488"');
    expect(design.toLowerCase()).not.toContain("#820ad1");
    expect(design).toContain("purple brand tokens");
  });

  it("styles.css uses teal/green CSS variables", () => {
    const css = readFileSync(resolve(process.cwd(), "src/interface/web/styles.css"), "utf8");
    expect(css).toContain("--brand: #0f766e");
    expect(css).toContain("--money: #0d9488");
    expect(css).not.toMatch(/#820ad1/i);
  });
});
