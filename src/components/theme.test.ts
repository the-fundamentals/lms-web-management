import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest serves this file from a non-file URL, so the stylesheet is read from the project root.
const stylesheet = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

function block(selector: ":root" | ".dark"): string {
  const start = stylesheet.indexOf(`${selector} {`);
  const open = stylesheet.indexOf("{", start);
  let depth = 0;

  for (let index = open; index < stylesheet.length; index += 1) {
    if (stylesheet[index] === "{") depth += 1;
    if (stylesheet[index] === "}") {
      depth -= 1;
      if (depth === 0) return stylesheet.slice(start, index + 1);
    }
  }

  throw new Error(`Missing ${selector} block`);
}

describe("theme stylesheet", () => {
  it("the light background and foreground values are in the stylesheet", () => {
    const light = block(":root");

    expect(light).toContain("--background: #F6F1E7;");
    expect(light).toContain("--foreground: #1F1A14;");
  });

  it("the light primary value is in the stylesheet", () => {
    expect(block(":root")).toContain("--primary: #0E6B62;");
  });

  it("the dark background and foreground values are in the stylesheet", () => {
    const dark = block(".dark");

    expect(dark).toContain("--background: #1A1714;");
    expect(dark).toContain("--foreground: #F6F1E7;");
  });

  it("the dark primary value is in the stylesheet", () => {
    expect(block(".dark")).toContain("--primary: #3DADA3;");
  });

  it("the stylesheet names Figtree, Newsreader, and an 8px radius", () => {
    expect(stylesheet).toContain("Figtree");
    expect(stylesheet).toContain("Newsreader");
    expect(stylesheet).toContain("--radius: 8px;");
  });
});
