export type DescriptionBlock =
  | { kind: "text"; text: string }
  | { kind: "list"; items: { label: string | null; text: string }[] };

const BULLET = /^\s*[-•*–]\s+/;

/**
 * An offer's description is plain text, usually a paragraph then « - Label :
 * détail » lines (the AI draft writes it so): lines become readable blocks.
 */
export function parseDescription(description: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  for (const raw of description.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (BULLET.test(raw)) {
      const item = line.replace(BULLET, "");
      const colon = item.indexOf(" : ");
      const labelled = colon > 0 && colon <= 40;
      const entry = labelled ? { label: item.slice(0, colon), text: item.slice(colon + 3) } : { label: null, text: item };
      const last = blocks.at(-1);
      if (last?.kind === "list") last.items.push(entry);
      else blocks.push({ kind: "list", items: [entry] });
    } else {
      blocks.push({ kind: "text", text: line });
    }
  }
  return blocks;
}
