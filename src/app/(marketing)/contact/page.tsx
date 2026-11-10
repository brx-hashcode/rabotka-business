import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight, IconHelpCircle, IconPresentation } from "@tabler/icons-react";

import { ContactCards } from "#/features/landing/components/landing-footer";
import { PageHero } from "#/features/landing/components/page-hero";
import { DEMO_HREF, SIGN_IN_HREF } from "#/features/landing/content";
import { marketingMetadata } from "#/lib/seo/marketing";

export function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    title: "Contact",
    description: "Contactez l'équipe Rabotka Business : une démo, une question sur votre compte ou sur vos recrutements.",
    path: "/contact",
  });
}

const WAYS = [
  {
    icon: IconPresentation,
    title: "Vous découvrez Rabotka Business",
    text: "Demandez une démo de 30 minutes : nous vous recontactons sous 24 h ouvrées pour vous montrer Rabotka sur vos postes.",
    href: DEMO_HREF,
    cta: "Demander une démo",
    primary: true,
  },
  {
    icon: IconHelpCircle,
    title: "Vous avez déjà un compte",
    text: "Connectez-vous et ouvrez « Aide » dans votre espace : votre demande arrive directement à nos équipes, avec son suivi.",
    href: SIGN_IN_HREF,
    cta: "Se connecter",
    primary: false,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Parlons de vos recrutements"
        text="Une démo, une question sur votre compte ou sur la mise en place : nos équipes vous répondent."
        actions={false}
      />
      <section className="px-4 py-20 sm:px-6 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {WAYS.map(({ icon: Icon, ...w }) => (
              <div key={w.title} className="flex flex-col gap-4 rounded-3xl bg-card p-6 sm:p-8">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-chip-green text-chip-green-foreground">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-semibold text-2xl tracking-tight">{w.title}</h2>
                <p className="flex-1 text-muted-foreground">{w.text}</p>
                <Link
                  href={w.href}
                  className={
                    w.primary
                      ? "inline-flex h-12 w-fit items-center gap-2 rounded-full bg-ink px-6 font-medium text-white hover:bg-ink/90"
                      : "inline-flex h-12 w-fit items-center gap-2 rounded-full bg-page px-6 font-medium hover:bg-page/70"
                  }
                >
                  {w.cta}
                  <IconArrowRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>
          <ContactCards title="Nous joindre directement" text="Par e-mail, par téléphone ou dans nos bureaux." />
        </div>
      </section>
    </>
  );
}
