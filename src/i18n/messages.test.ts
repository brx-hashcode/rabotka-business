import { describe, expect, it } from "vitest";

import { LOCALES } from "./config";
import { MESSAGES } from "./messages";

type Tree = { [key: string]: string | Tree };

/** Every leaf as `path → message`. */
function leaves(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [p, v] of leaves(value, path)) out.set(p, v);
  }
  return out;
}

/** The ICU arguments a message takes: `{count}`, `{name}`… (plural/select branches included). */
function argumentsOf(message: string): string[] {
  return [...new Set([...message.matchAll(/\{\s*([A-Za-z_][\w]*)\s*[,}]/g)].map((m) => m[1]))].sort();
}

const source = leaves(MESSAGES.fr as unknown as Tree);

describe("messages", () => {
  for (const locale of LOCALES.filter((l) => l !== "fr")) {
    const target = leaves(MESSAGES[locale] as unknown as Tree);

    it(`${locale} has every French key and no other`, () => {
      expect([...target.keys()].sort()).toEqual([...source.keys()].sort());
    });

    it(`${locale} takes the same arguments as French`, () => {
      for (const [key, message] of source) {
        expect({ key, args: argumentsOf(target.get(key) ?? "") }).toEqual({ key, args: argumentsOf(message) });
      }
    });

    it(`${locale} leaves no message empty`, () => {
      for (const [key, message] of target) expect({ key, empty: message.trim() === "" }).toEqual({ key, empty: false });
    });
  }
});
