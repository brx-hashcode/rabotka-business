import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

/** The custom properties of the first block opened by `selector {`. */
function block(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("\n}", start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const light = block(":root");
const themes = { light, dark: { ...light, ...block(".dark") } };

/** #rrggbb and grey-ish oklch(L …): enough for the pairs below. */
function luminance(color: string): number {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (hex) {
    const [r, g, b] = hex.slice(1).map((h) => {
      const c = parseInt(h, 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const oklch = /^oklch\(([\d.]+)/.exec(color);
  if (oklch) return Number(oklch[1]) ** 3;
  throw new Error(`Unread colour: ${color}`);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe.each(Object.entries(themes))("%s theme", (_, t) => {
  it.each([
    ["header-foreground", "header"],
    ["header-muted", "header"],
    ["brand-lime-foreground", "brand-lime"],
    ["cta-foreground", "cta"],
    ["cta-soft-foreground", "cta-soft"],
    ["foreground", "page"],
    ["card-foreground", "card"],
    ["muted-foreground", "card"],
  ])("%s reads on %s", (text, fill) => {
    expect(contrast(t[text], t[fill])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["ink", "footer"])("white reads on %s", (fill) => {
    expect(contrast("#ffffff", t[fill])).toBeGreaterThanOrEqual(4.5);
  });
});
