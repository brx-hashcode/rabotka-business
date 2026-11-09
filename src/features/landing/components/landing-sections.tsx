import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import type { BusinessCountryName } from "#/lib/api/catalog-server";
import { AUDIENCE_PHOTO, AUDIENCES, FAQ, SIGN_UP_HREF, TRUST } from "../content";
import { FaqExplorer } from "./faq-explorer";
import { SectionHeading } from "./section-heading";

/** What happens to the business's papers, the CVs and its mailbox. */
export function TrustSection() {
  return (
    <section id="confiance" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <SectionHeading
          kicker="Sécurité et confidentialité"
          title="Vos données et celles des candidats, protégées"
          text="Recruter avec Rabotka, c'est aussi savoir ce qui est lu, gardé et supprimé."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ title, text, icon: Icon }) => (
            <div key={title} className="space-y-3 rounded-3xl bg-card p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-chip-green text-chip-green-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Which organisations it is for — the question the menu's « Secteurs » answers. */
export function AudiencesSection() {
  return (
    <section id="secteurs" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div className="space-y-8">
          <SectionHeading
            kicker="Secteurs"
            title="Pour chaque type d'organisation"
            text="Du statut juridique aux pièces justificatives, Rabotka s'adapte à la nature de votre structure."
          />
          <div className="relative hidden aspect-4/3 overflow-hidden rounded-3xl bg-card lg:block">
            <Image src={AUDIENCE_PHOTO} alt="" fill sizes="40vw" className="object-cover" />
          </div>
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {AUDIENCES.map(({ title, text, icon: Icon }) => (
            <div key={title} className="space-y-3 rounded-3xl bg-card p-6">
              <span className="flex size-11 items-center justify-center rounded-full bg-page">
                <Icon className="size-5" />
              </span>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
          ))}
          <Link href={SIGN_UP_HREF} className="group flex flex-col justify-between gap-6 rounded-3xl bg-ink p-6 text-white">
            <p className="font-semibold text-lg">Votre secteur n&apos;apparaît pas ?</p>
            <span className="inline-flex items-center gap-1.5 font-medium text-sm">
              Ouvrez votre compte, nous vous accompagnons
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The first question a visitor outside one country asks, from the backend's list. */
export function countriesAnswer(countries: BusinessCountryName[]) {
  const names = countries.map((c) => c.name);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} et ${names.at(-1)}` : (names[0] ?? "");
  return {
    q: "Dans quels pays Rabotka Business est-il disponible ?",
    a: `Aujourd'hui : ${list}. Les pièces demandées, les villes proposées et la diffusion de vos offres sont celles de votre pays ; les abonnements se règlent par mobile money, dans la monnaie de votre pays.`,
  };
}

/** Questions to browse: a list and its answer side by side, an accordion on a phone. */
export function FaqSection({ countries }: Readonly<{ countries: BusinessCountryName[] }>) {
  return <FaqBlock items={[countriesAnswer(countries), ...FAQ]} />;
}

/** The FAQ block with any questions: a feature page's, or the whole list. */
export function FaqBlock({
  items,
  title = "Tout savoir avant de commencer",
  text = "Les pays, l'analyse de CV, vos données et votre compte : l'essentiel en quelques réponses.",
}: Readonly<{ items: { q: string; a: string }[]; title?: string; text?: string }>) {
  return (
    <section id="faq" className="scroll-mt-20 bg-card py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <SectionHeading kicker="Questions fréquentes" title={title} text={text} />
        <FaqExplorer items={items} />
      </div>
    </section>
  );
}
