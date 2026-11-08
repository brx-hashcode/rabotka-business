/** The build's commit and date, set in next.config.ts. */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
const BUILT_AT = process.env.NEXT_PUBLIC_APP_BUILT_AT;

/** « Version 8 nov. 2026 · a79d169 »: what support asks for. */
export function versionLabel(builtAt: string | undefined = BUILT_AT, commit: string = APP_VERSION): string {
  const date = builtAt ? new Date(builtAt) : null;
  const day =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
      : null;
  return ["Version", day, day ? `· ${commit}` : commit].filter(Boolean).join(" ");
}

/** The full build time, for the tooltip. */
export function builtAtTitle(builtAt: string | undefined = BUILT_AT): string | undefined {
  return builtAt ? `Compilée le ${new Date(builtAt).toLocaleString("fr-FR", { timeZone: "UTC" })} UTC` : undefined;
}
