import type { Metadata } from "next";
import { IconCheck } from "@tabler/icons-react";

import { DemoForm } from "#/features/demo/components/demo-form";
import { businessCountriesServer } from "#/lib/api/catalog-server";
import { marketingMetadata } from "#/lib/seo/marketing";

export function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    title: "Demander une démo",
    description:
      "30 minutes pour voir Rabotka Business sur vos vrais recrutements. Nous vous recontactons sous 24 h ouvrées.",
    path: "/demo",
  });
}

const YOU_WILL_SEE = [
  "Une offre rédigée et diffusée en quelques minutes",
  "Vos CV lus, notés et classés pour le poste",
  "Le pipeline de vos candidatures, de la réception au contrat",
  "Les entretiens et les avis de votre équipe, au même endroit",
];

export default async function DemoPage() {
  const countries = await businessCountriesServer();
  return (
    <section className="bg-header text-header-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 pt-10 pb-20 sm:px-6 md:pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <h1 className="font-semibold text-4xl leading-[1.08] tracking-tight sm:text-5xl">
            30 minutes pour voir Rabotka sur vos vrais recrutements
          </h1>
          <p className="text-header-muted text-lg">
            Un membre de notre équipe vous présente l&apos;ATS sur vos postes à pourvoir, et répond à vos questions.
            Nous vous répondons sous 24 h ouvrées.
          </p>
          <ul className="space-y-3">
            {YOU_WILL_SEE.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                  <IconCheck className="size-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 text-foreground">
          <DemoForm countries={countries} />
        </div>
      </div>
    </section>
  );
}
