import { describe, expect, it } from "vitest";

import { LOCALES } from "./config";
import { MESSAGES } from "./messages";

type Tree = { [key: string]: unknown };

/** Every leaf as `path → value`: messages, and the numbers some lists carry (siteCopy.faqShown). */
function leaves(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else if (typeof value === "number") out.set(path, `#${value}`);
    else if (value && typeof value === "object") for (const [p, v] of leaves(value as Tree, path)) out.set(p, v);
  }
  return out;
}

/**
 * The ICU arguments a message takes — `{count}`, `{n, plural, …}`, and those
 * inside plural/select branches — never the branches' own words.
 */
export function argumentsOf(message: string): string[] {
  const found = new Set<string>();
  let i = 0;

  // Text until the closing brace of the current level (or the end).
  function text() {
    while (i < message.length && message[i] !== "}") {
      if (message[i] === "'" && /['{}#]/.test(message[i + 1] ?? "")) {
        // ICU quoting: '' is a quote, '{…' a literal up to the next quote.
        // Any other apostrophe (« jusqu'au ») is plain text.
        const end = message[i + 1] === "'" ? i + 1 : message.indexOf("'", i + 1);
        i = end === -1 ? message.length : end + 1;
      } else if (message[i] === "{") {
        i++;
        argument();
      } else i++;
    }
  }

  // After an opening brace: name, then optional type and options.
  function argument() {
    const head = /^\s*([A-Za-z_]\w*)\s*(?:,\s*(\w+)\s*)?/.exec(message.slice(i));
    if (!head) return skipTo();
    found.add(head[1]);
    i += head[0].length;
    const type = head[2];
    if (message[i] === "}") return void i++;
    if (type === "plural" || type === "select" || type === "selectordinal") {
      i++; // the comma before the options
      // key {branch} key {branch} …, the branches being text again.
      while (i < message.length && message[i] !== "}") {
        if (message[i] === "{") {
          i++;
          text();
          i++; // its closing brace
        } else i++;
      }
      i++;
      return;
    }
    skipTo();
  }

  // A number/date argument's format: up to the matching brace.
  function skipTo() {
    let depth = 1;
    while (i < message.length && depth > 0) {
      if (message[i] === "{") depth++;
      if (message[i] === "}") depth--;
      i++;
    }
  }

  while (i < message.length) {
    text();
    i++;
  }
  return [...found].sort();
}

/** Arguments only French grammar needs (« d' » before a vowel): English may leave them out. */
const FRENCH_ONLY = new Set(["elision"]);

const source = leaves(MESSAGES.fr as unknown as Tree);

describe("argumentsOf", () => {
  it("finds arguments, nested ones too, and never branch words", () => {
    expect(argumentsOf("{firstName, select, none {Voici} other {Bonjour {firstName}}} {days} jours")).toEqual(["days", "firstName"]);
    expect(argumentsOf("{count, plural, one {# offre} other {# offres}} en {n, number}")).toEqual(["count", "n"]);
    expect(argumentsOf("Jusqu'au <strong>{date}</strong>")).toEqual(["date"]);
  });
});

describe("messages", () => {
  for (const locale of LOCALES.filter((l) => l !== "fr")) {
    const target = leaves(MESSAGES[locale] as unknown as Tree);

    it(`${locale} has every French key and no other, list for list`, () => {
      expect([...target.keys()].sort()).toEqual([...source.keys()].sort());
    });

    it(`${locale} takes the same arguments as French`, () => {
      for (const [key, message] of source) {
        const expected = argumentsOf(message).filter((a) => !FRENCH_ONLY.has(a));
        expect({ key, args: argumentsOf(target.get(key) ?? "") }).toEqual({ key, args: expected });
      }
    });

    it(`${locale} leaves no message empty`, () => {
      for (const [key, message] of target) expect({ key, empty: message.trim() === "" }).toEqual({ key, empty: false });
    });

    it(`${locale} keeps the same numbers`, () => {
      for (const [key, value] of source) {
        if (value.startsWith("#")) expect({ key, value: target.get(key) }).toEqual({ key, value });
      }
    });
  }
});
