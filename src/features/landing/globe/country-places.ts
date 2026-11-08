/**
 * Where each country's flag sits on the globe, and the region it is listed
 * under. Roughly the country's middle, nudged so neighbours' flags (Congo and
 * Gabon, Rwanda and Uganda) don't cover each other. A country missing here
 * still shows in the list, without a flag on the globe.
 */
export type Region = "Afrique centrale" | "Afrique de l'Ouest" | "Afrique de l'Est et australe";

export const REGIONS: readonly Region[] = ["Afrique centrale", "Afrique de l'Ouest", "Afrique de l'Est et australe"];

export const PLACES: Record<string, { lat: number; lng: number; region: Region }> = {
  CG: { lat: -1.6, lng: 15.9, region: "Afrique centrale" },
  CD: { lat: -3.6, lng: 23.6, region: "Afrique centrale" },
  CM: { lat: 5.6, lng: 12.4, region: "Afrique centrale" },
  GA: { lat: 0.2, lng: 10.9, region: "Afrique centrale" },
  TD: { lat: 15.4, lng: 18.7, region: "Afrique centrale" },
  CF: { lat: 6.6, lng: 20.9, region: "Afrique centrale" },
  GQ: { lat: 1.6, lng: 10.4, region: "Afrique centrale" },
  BJ: { lat: 9.6, lng: 2.3, region: "Afrique de l'Ouest" },
  CI: { lat: 7.6, lng: -5.6, region: "Afrique de l'Ouest" },
  SN: { lat: 14.5, lng: -14.6, region: "Afrique de l'Ouest" },
  SL: { lat: 8.6, lng: -11.8, region: "Afrique de l'Ouest" },
  KE: { lat: -0.6, lng: 38.4, region: "Afrique de l'Est et australe" },
  UG: { lat: 2.9, lng: 32.2, region: "Afrique de l'Est et australe" },
  RW: { lat: -2.6, lng: 29.6, region: "Afrique de l'Est et australe" },
  ZM: { lat: -13.4, lng: 27.8, region: "Afrique de l'Est et australe" },
  MZ: { lat: -17.9, lng: 35.3, region: "Afrique de l'Est et australe" },
};

/** A small PNG of the country's flag (flagcdn, public, cached). */
export function flagUrl(code: string, width: 40 | 80 = 40): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}
