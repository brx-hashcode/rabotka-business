/** Where an outside candidate came from, in words. */
const LABEL: Record<string, string> = {
  rabotka: "Rabotka",
  agent: "Agents Rabotka",
  carrieres: "Page carrières",
  direct: "Lien direct",
  google: "Google",
  bing: "Bing",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  whatsapp: "WhatsApp",
  qr: "Affiche (QR code)",
  jooble: "Jooble",
  careerjet: "Careerjet",
  indeed: "Indeed",
  fuzu: "Fuzu",
  talent: "Talent.com",
  jora: "Jora",
};

/** Session storage key: the offer page notes the source, the form sends it. */
export const SOURCE_KEY = "careers-source";

export function sourceLabel(source: string): string {
  return LABEL[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
}

const REFERRERS: [RegExp, string][] = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "x"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)jooble\./, "jooble"],
  [/(^|\.)careerjet\./, "careerjet"],
  [/(^|\.)indeed\./, "indeed"],
  [/(^|\.)fuzu\.com$/, "fuzu"],
];

/**
 * `?source=` when the link says it (feeds, shares, the poster), else the site
 * that sent the visitor, else « direct ». Always a clean key for the backend.
 */
export function candidateSource(param: string | null, referrer: string, ownHost: string): string {
  if (param && /^[a-z0-9-]{1,30}$/.test(param)) return param;
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  if (!host || host === ownHost) return "direct";
  return REFERRERS.find(([re]) => re.test(host))?.[1] ?? "direct";
}
