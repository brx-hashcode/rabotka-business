import Image from "next/image";
import Link from "next/link";
import { IconArrowRight, IconCheck, IconChevronDown } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { AUDIENCES, FAQ, SIGN_UP_HREF, SOLUTIONS, STEPS } from "../content";

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

/** One row per solution, photo and text alternating sides. */
export function SolutionsSection() {
  return (
    <section id="solutions" className="scroll-mt-20 bg-card py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-16 px-4 sm:px-6 md:space-y-24">
        <SectionHeading
          kicker="Nos solutions"
          title="Une plateforme complète pour piloter vos recrutements"
          text="De la diffusion de l'offre à la prise de contact avec le candidat retenu."
        />

        {SOLUTIONS.map((solution, i) => {
          return (
            <div
              key={solution.id}
              id={solution.id}
              className="grid scroll-mt-24 items-center gap-8 md:grid-cols-2 md:gap-16"
            >
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-3xl bg-page", i % 2 === 1 && "md:order-2")}>
                <Image
                  src={solution.photo}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-5">
                <span className="inline-flex rounded-full bg-chip-green px-3 py-1 font-medium text-chip-green-foreground text-xs">
                  {solution.kicker}
                </span>
                <h3 className="font-semibold text-2xl tracking-tight sm:text-3xl">{solution.title}</h3>
                <p className="text-muted-foreground">{solution.text}</p>
                <ul className="space-y-2.5">
                  {solution.points.map((point) => (
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
          );
        })}
      </div>
    </section>
  );
}

/** Three numbered steps, from sign-up to the first hire. */
export function StepsSection() {
  return (
    <section id="demarche" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <SectionHeading kicker="Notre démarche" title="Trois étapes pour démarrer vos recrutements" center />
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="space-y-4 rounded-3xl bg-card p-6 sm:p-8">
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
    <section id="secteurs" className="scroll-mt-20 bg-card py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
        <SectionHeading
          kicker="Secteurs"
          title="Une solution adaptée à chaque type d'organisation"
          text="Du statut juridique aux pièces justificatives, Rabotka s'adapte à la nature de votre structure."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map(({ title, text, icon: Icon }) => (
            <div key={title} className="space-y-3 rounded-3xl bg-page p-6">
              <span className="flex size-11 items-center justify-center rounded-full bg-card">
                <Icon className="size-5" />
              </span>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
          ))}
          <Link
            href={SIGN_UP_HREF}
            className="group flex flex-col justify-between gap-6 rounded-3xl bg-ink p-6 text-white"
          >
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
    <section id="faq" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto w-full max-w-3xl space-y-10 px-4 sm:px-6">
        <SectionHeading kicker="Questions fréquentes" title="Tout savoir avant de commencer" center />
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl bg-card px-5 py-4 open:pb-5">
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
