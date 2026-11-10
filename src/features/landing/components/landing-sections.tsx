import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import type { BusinessCountryName } from "#/lib/api/catalog-server";
import { AUDIENCE_PHOTO, AUDIENCES, FAQ, FAQ_SHOWN, SIGN_UP_HREF, TRUST } from "../content";
import { DemoButton } from "./demo-button";
import { FaqAccordion } from "./faq-accordion";
import { SectionHeading } from "./section-heading";
import { IconTile } from "./icon-tile";

/** What happens to the business's papers, the CVs and its mailbox. */
export function TrustSection() {
  return (
    <section id="confiance" className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <SectionHeading
          kicker="Sécurité et confidentialité"
          title="Vos données et celles des candidats, protégées"
          text="Recruter avec Rabotka, c'est aussi savoir ce qui est lu, gardé et supprimé."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ title, text, icon }) => (
            <div key={title} className="space-y-3 rounded-3xl bg-card p-6">
              <IconTile icon={icon} />
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Which organisations it is for: one card per sector with the posts it often
 * fills, and a last card on a photo for those not listed. Six even cells.
 */
export function AudiencesSection() {
  return (
    <section id="secteurs" className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            kicker="Secteurs"
            title="Pour chaque type d'organisation"
            text="Du statut juridique aux pièces justificatives, Rabotka s'adapte à la nature de votre structure."
          />
          <DemoButton className="self-start lg:self-auto" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map(({ title, text, icon, roles }) => (
            <article key={title} className="flex flex-col gap-5 rounded-3xl bg-card p-6 sm:p-7">
              <IconTile icon={icon} size="lg" />
              <div className="space-y-2">
                <h3 className="font-semibold text-xl tracking-tight">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{text}</p>
              </div>
              <div className="mt-auto space-y-2.5 pt-1">
                <p className="font-medium text-muted-foreground text-xs">Postes souvent recrutés</p>
                <ul className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <li key={r} className="rounded-full bg-page px-3 py-1 font-medium text-xs">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
          <Link
            href={SIGN_UP_HREF}
            className="group relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-7"
          >
            <Image
              src={AUDIENCE_PHOTO}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/70 to-ink/10" />
            <p className="font-semibold text-xl tracking-tight">Votre secteur n&apos;apparaît pas ?</p>
            <p className="mt-2 text-sm text-white/80">
              Startups, coopératives, GIE, associations, fondations : ouvrez votre compte, nous vous accompagnons.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full bg-white px-4 py-2 font-medium text-ink text-sm">
              Ouvrir un compte
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

/** The FAQ: the few questions a business asks before it starts. */
export function FaqSection({ countries }: Readonly<{ countries: BusinessCountryName[] }>) {
  const all = [countriesAnswer(countries), ...FAQ];
  const items = FAQ_SHOWN.map((q) => all.find((f) => f.q === q)).filter((f) => f !== undefined);
  return <FaqAccordion items={items} />;
}
