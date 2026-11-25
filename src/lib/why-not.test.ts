import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { firstReason } from "./use-why-not";

/** Those that hand `disabled` on: the control inside carries the title. */
const PASS_ON = new Set([
  "CodeInput",
  "MailImport",
  "ImagePicker",
  "StepActions",
  "Intro",
  "Slider",
]);

function untitled(file: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      const names = node.attributes.properties.flatMap((p) => (ts.isJsxAttribute(p) ? [p.name.getText(source)] : []));
      const canBeDisabled = names.includes("disabled") || names.includes("aria-disabled");
      if (canBeDisabled && !names.includes("title") && !PASS_ON.has(tag)) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
        found.push(`${file}:${line + 1} <${tag}>`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("what cannot be used says why", () => {
  it("gives the first reason that holds", () => {
    expect(firstReason([[false, "a"], ["", "b"], [1, "c"], [true, "d"]])).toBe("c");
    expect(firstReason([[false, "a"]])).toBeUndefined();
  });

  it("every control that can be disabled has a title (use-why-not)", () => {
    const files = globSync("src/**/*.tsx").filter((f) => !f.startsWith("src/components/ui/") && !f.includes(".test."));
    expect(files.length).toBeGreaterThan(100);
    expect(files.flatMap(untitled)).toEqual([]);
  });
});
