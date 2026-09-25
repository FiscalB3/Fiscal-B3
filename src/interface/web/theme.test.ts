import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ocean theme tokens", () => {
  it("DESIGN.md documents blue and teal brand tokens without purple", () => {
    const design = readFileSync(resolve(process.cwd(), "DESIGN.md"), "utf8");
    expect(design).toContain('brand: "#0B4F6C"');
    expect(design).toContain('money: "#14B8A6"');
    expect(design.toLowerCase()).not.toContain("#820ad1");
    expect(design).toContain("purple brand tokens");
  });

  it("styles.css uses ocean CSS variables", () => {
    const css = readFileSync(resolve(process.cwd(), "src/interface/web/styles.css"), "utf8");
    expect(css).toContain("--brand: #0b4f6c");
    expect(css).toContain("--money: #14b8a6");
    expect(css).not.toMatch(/#820ad1/i);
  });
});
