import Link from "next/link";
import type { ReactNode } from "react";

import { BusinessLockup } from "#/components/business-lockup";
import { PUBLIC_SITE, SIGN_IN_HREF, SIGN_UP_HREF } from "#/features/landing/content";
import { cn } from "#/lib/utils";

/**
 * The frame of the sign-in and sign-up pages, the same as rabotka-analytics'
 * import screen: on the left the form column (brand at the top, a small
 * footer at the bottom), on the right a wall of cards saying what the space
 * does.
 *
 * The cards state what Rabotka Business does today, in the landing's words
 * (features/landing/content.ts): no figures without a source, no
 * testimonials until a real customer gives one.
 *
 * `wide` gives the sign-up's forms (organisation, documents) the room they
 * need; sign-in keeps a narrow column.
 */
export type Spotlight = { label: string; title: string; text: string };

export function AuthShell({
  children,
  wide = false,
  footer,
  spotlight,
}: Readonly<{
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
  /** What the ink card says instead of its default — the sign-up's current step. */
  spotlight?: Spotlight;
}>) {
  return (
    <div className="grid min-h-svh bg-card lg:grid-cols-2">
      <section className="flex min-h-svh min-w-0 flex-col px-5 py-6 sm:px-10">
        <Link href="/" aria-label="Rabotka Business — accueil" className="self-start">
          <BusinessLockup compact />
        </Link>

        <div className={cn("mx-auto flex w-full flex-1 flex-col", wide ? "max-w-136" : "max-w-sm")}>
          {children}
        </div>

        <footer className="mt-6 flex flex-wrap gap-x-5 gap-y-1 font-mono text-muted-foreground text-xs">
          <span>© Rabotka {new Date().getFullYear()}</span>
          <a href={PUBLIC_SITE} className="no-underline hover:text-foreground">
            www.rabotka.work
          </a>
          <a
            href={`${PUBLIC_SITE}/privacy`}
            target="_blank"
            rel="noreferrer"
            className="no-underline hover:text-foreground"
          >
            Confidentialité
          </a>
          {footer}
        </footer>
      </section>

      <FeatureWall spotlight={spotlight} />
    </div>
  );
}

/** « Se connecter / Créer un compte », above the form's title. */
export function AuthTabs({ active }: Readonly<{ active: "sign-in" | "sign-up" }>) {
  const tabs = [
    { id: "sign-in", label: "Se connecter", href: SIGN_IN_HREF },
    { id: "sign-up", label: "Créer un compte", href: SIGN_UP_HREF },
  ] as const;
  return (
    <nav aria-label="Compte" className="inline-flex self-start rounded-full bg-page p-1">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={active === t.id ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium text-sm no-underline transition-colors",
            active === t.id ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** A few words underlined in lime, as with a highlighter; lime text on the ink card. */
function Mark({ children, onDark = false }: Readonly<{ children: ReactNode; onDark?: boolean }>) {
  return onDark ? (
    <span className="text-brand-lime">{children}</span>
  ) : (
    <span className="box-decoration-clone bg-[linear-gradient(transparent_58%,var(--brand-lime)_58%)]">
      {children}
    </span>
  );
}

function Statement({
  children,
  label,
  size = "md",
  dark = false,
}: Readonly<{ children: ReactNode; label: string; size?: "md" | "lg"; dark?: boolean }>) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "font-bold font-display leading-none",
          size === "lg" ? "text-4xl" : "text-2xl",
          dark ? "text-brand-lime" : "text-foreground/25",
        )}
      >
        “
      </span>
      <p className={cn("mt-3 tracking-tight", size === "lg" ? "text-[1.7rem] leading-snug" : "leading-relaxed")}>
        {children}
      </p>
      <p className={cn("mt-4 text-xs", dark ? "text-white/55" : "text-muted-foreground")}>{label}</p>
    </>
  );
}

/**
 * Two columns of cards in a grey frame: white ones, one lime (the figure),
 * one ink. Hidden below `lg`, where the form takes the whole screen.
 */
function FeatureWall({ spotlight }: Readonly<{ spotlight?: Spotlight }>) {
  const card = "flex flex-col justify-center rounded-3xl p-8";
  return (
    <aside aria-label="Rabotka Business en bref" className="hidden p-3 lg:sticky lg:top-0 lg:block lg:h-svh">
      <div className="grid h-full grid-cols-2 gap-3 rounded-[28px] bg-page p-3">
        <div className="flex min-h-0 flex-col gap-3">
          <div className={cn(card, "flex-[5] bg-card")}>
            <Statement label="Offres rédigées pour vous" size="lg">
              Décrivez votre besoin en quelques mots : <Mark>l&apos;offre complète est prête</Mark>.
            </Statement>
          </div>
          <div className={cn(card, "flex-[2.5] bg-ink text-white")}>
            {spotlight ? (
              // Keyed: each step's message fades in instead of swapping in place.
              <div
                key={spotlight.title}
                className="space-y-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
              >
                <p className="font-medium text-brand-lime text-sm">{spotlight.label}</p>
                <p className="font-semibold text-xl leading-snug tracking-tight">{spotlight.title}</p>
                <p className="text-sm text-white/70 leading-relaxed">{spotlight.text}</p>
              </div>
            ) : (
              <Statement label="Organisation vérifiée" dark>
                Votre compte est activé <Mark onDark>après vérification de vos pièces officielles</Mark> : un
                gage de sérieux pour les candidats.
              </Statement>
            )}
          </div>
          <div className={cn(card, "flex-[2.5] bg-card")}>
            <Statement label="Candidatures classées">
              <Mark>Les meilleurs candidats en tête de liste</Mark>, et pourquoi, critère par critère.
            </Statement>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div className={cn(card, "flex-[2.5] bg-brand-lime text-ink")}>
            <p className="font-bold font-display text-7xl leading-none">
              100
            </p>
            <p className="mt-4 max-w-56 text-sm">
              Chaque CV noté sur 100 par rapport au poste, avec ses points forts et ses points d&apos;attention.
            </p>
          </div>
          <div className={cn(card, "flex-[2.5] bg-card")}>
            <Statement label="Messagerie en lecture seule">
              Rabotka <Mark>ne lit que les pièces jointes que vous choisissez</Mark> et n&apos;envoie jamais rien
              depuis votre messagerie.
            </Statement>
          </div>
          <div className={cn(card, "flex-[5] bg-card")}>
            <Statement label="Entretiens" size="lg">
              Le candidat confirme, décline ou propose <Mark>un autre moment</Mark>, depuis l&apos;e-mail qu&apos;il
              reçoit.
            </Statement>
          </div>
        </div>
      </div>
    </aside>
  );
}
