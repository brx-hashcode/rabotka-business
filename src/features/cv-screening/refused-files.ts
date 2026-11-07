/**
 * What was not added, readable when a whole folder was dropped: those over
 * the analysis's limit in one line, the others by name (8 at most).
 */
export function refusedLines(refused: { name: string; reason: string }[]): { key: string; name?: string; text: string }[] {
  const over = refused.filter((r) => r.reason.includes("CV au plus"));
  const others = refused.filter((r) => !r.reason.includes("CV au plus"));
  const lines: { key: string; name?: string; text: string }[] = others.slice(0, 8).map((r) => ({ key: `n:${r.name}`, name: r.name, text: ` non ajouté : ${r.reason}.` }));
  if (others.length > 8) lines.push({ key: "more", text: `Et ${others.length - 8} autres fichiers non pris en charge ou trop lourds.` });
  if (over.length > 0) {
    lines.push({
      key: "over",
      text: `${over.length === 1 ? "1 fichier non ajouté" : `${over.length} fichiers non ajoutés`} : ${over[0].reason}.`,
    });
  }
  return lines;
}
