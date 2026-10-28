import Image from "next/image";
import Link from "next/link";
import { IconArrowRight, IconCheck, IconChevronDown } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { AUDIENCE_PHOTO, AUDIENCES, FAQ, FEATURES, SIGN_UP_HREF, STEPS, TRUST } from "../content";
import { FeatureMockup } from "../mockups/mockups";

function SectionHeading({
  kicker,
  title,
  text,
  center = false,
}: Readonly<{ kicker: string; title: string; text?: string; center?: boolean }>) {
  return (
    <div className={cn("max-w-2xl space-y-3", center && "mx-auto text-center")}>
      <p className="font-medium text-sm text-whatsapp-dark">{kicker}</p>
      <h2 className="font-semibold text-3xl tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="text-lg text-muted-foreground">{text}</p>}
    </div>
  );
}

/**
 * The product, one feature per row: what it does beside the screen that does
 * it, sides alternating. The page's backbone; the header menu links here.
 */
export function FeaturesSection() {
  return (
    <section className="bg-card py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-20 px-4 sm:px-6 md:space-y-32">
        <SectionHeading
          kicker="Tout votre recrutement"
          title="Un seul espace, de l'offre au candidat retenu"
          text="Chaque étape a son outil, et chaque outil fait gagner du temps à l'étape suivante."
          center
        />

        {FEATURES.map((feature, i) => (
          <div
            key={feature.id}
            id={feature.href.slice(1)}
            className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16"
          >
            <div className={cn("min-w-0 rounded-[2rem] bg-page p-4 sm:p-8", i % 2 === 1 && "lg:order-2")}>
              <FeatureMockup id={feature.id} />
            </div>
            <div className="space-y-5">
              <h3 className="font-semibold text-2xl tracking-tight sm:text-3xl">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.text}</p>
              <ul className="space-y-2.5">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white">
                      <IconCheck className="size-3" strokeWidth={3} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                render={<Link href={SIGN_UP_HREF} />}
                className="-ml-3 rounded-full px-3 font-medium hover:bg-page"
              >
                Ouvrir un compte entreprise
                <IconArrowRight />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

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

/** Three numbered steps, from sign-up to the first hire. */
export function StepsSection() {
  return (
    <section id="demarche" className="scroll-mt-20 bg-card py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <SectionHeading kicker="Notre démarche" title="Trois étapes pour démarrer vos recrutements" center />
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="space-y-4 rounded-3xl bg-page p-6 sm:p-8">
              <span className="flex size-10 items-center justify-center rounded-full bg-header font-semibold text-header-foreground">
                {i + 1}
              </span>
              <h3 className="font-semibold text-xl">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.text}</p>
            </li>
          ))}
        </ol>
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

/** Questions, answered in place (native details/summary, no script). */
export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-card py-20 md:py-28">
      <div className="mx-auto w-full max-w-3xl space-y-10 px-4 sm:px-6">
        <SectionHeading kicker="Questions fréquentes" title="Tout savoir avant de commencer" center />
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl bg-page px-5 py-4 open:pb-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <IconChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-muted-foreground text-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
