export type BusinessCountryName = { code: string; name: string };

/** The backend's list (business-catalog.ts) as of this writing: shown when it cannot be read. */
const KNOWN: BusinessCountryName[] = [
  { code: "CG", name: "Congo-Brazzaville" },
  { code: "CD", name: "Congo-Kinshasa (RDC)" },
  { code: "CM", name: "Cameroun" },
  { code: "GA", name: "Gabon" },
  { code: "TD", name: "Tchad" },
  { code: "CF", name: "République centrafricaine" },
  { code: "GQ", name: "Guinée équatoriale" },
];

/**
 * The countries an organisation can sign up in, read from the server for the
 * landing: a country the backend opens shows up within the hour, no release.
 */
export async function businessCountriesServer(): Promise<BusinessCountryName[]> {
  const backend = process.env.BACKEND_URL;
  if (!backend) return KNOWN;
  try {
    const res = await fetch(new URL("/api/v1/public/business/catalog", backend), { next: { revalidate: 3600 } });
    if (!res.ok) return KNOWN;
    const { countries } = (await res.json()) as { countries?: BusinessCountryName[] };
    return countries?.length ? countries : KNOWN;
  } catch {
    return KNOWN;
  }
}
