import type { BusinessCountryName } from "#/lib/api/catalog-server";
import { flagUrl, PLACES, REGIONS } from "../globe/country-places";
import { LazyGlobe } from "../globe/globe-lazy";

/**
 * Where Rabotka Business is open, from the backend's list: a globe with each
 * country's flag, and the same countries by region beside it. Dark in both
 * themes, the globe's own colours.
 */
export function CountriesSection({ countries }: Readonly<{ countries: BusinessCountryName[] }>) {
  const byRegion = REGIONS.map((region) => ({
    region,
    countries: countries.filter((c) => PLACES[c.code]?.region === region),
  }));
  const elsewhere = countries.filter((c) => !PLACES[c.code]);
  const groups = [...byRegion, { region: "Ailleurs", countries: elsewhere }].filter((g) => g.countries.length > 0);

  return (
    <section id="pays" className="scroll-mt-20 overflow-hidden bg-[#0f2414] py-20 text-white md:py-28">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="relative mx-auto w-full max-w-[560px]">
          {/* A soft halo behind the globe. */}
          <div
            aria-hidden
            className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(203,255,165,0.18),transparent_68%)] blur-2xl"
          />
          <LazyGlobe countries={countries} />
        </div>

        <div className="space-y-8">
          <div className="max-w-xl space-y-3">
            <p className="font-medium text-[#cbffa5] text-sm">Où nous sommes</p>
            <h2 className="font-semibold text-3xl tracking-tight sm:text-4xl">
              Disponible dans {countries.length} pays d&apos;Afrique
            </h2>
            <p className="text-lg text-white/70">
              Chaque organisation recrute dans son pays : ses pièces, ses villes, et un abonnement réglé par mobile money
              dans sa monnaie.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {groups.map((g) => (
              <div key={g.region} className="space-y-3">
                <p className="font-medium text-white/50 text-xs uppercase tracking-wider">{g.region}</p>
                <ul className="space-y-2">
                  {g.countries.map((c) => (
                    <li key={c.code} className="flex items-center gap-2.5 text-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={flagUrl(c.code)} alt="" className="h-3.5 w-5 rounded-[3px] object-cover" loading="lazy" />
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
