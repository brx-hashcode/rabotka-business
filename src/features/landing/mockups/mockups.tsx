import {
  IconBriefcase,
  IconCalendarEvent,
  IconCheck,
  IconFileText,
  IconMapPin,
  IconMessageCircle,
  IconPhone,
  IconSparkles,
  IconVideo,
  IconWand,
} from "@tabler/icons-react";

import { ProviderTile } from "#/components/mail-provider-logos";
import { CriterionBar, ScoreRing, VerdictChip } from "#/features/cv-screening/components/cv-bits";
import { cn } from "#/lib/utils";
import type { MockupKey } from "../content";
import { FloatCard, MockupFrame } from "./frame";

/*
 * Example data only: fictional people, illustrative scores. Nothing here is a
 * statistic about Rabotka.
 */

const RANKED = [
  { name: "Grâce Loubaki", job: "Caissière · 4 ans", score: 88 },
  { name: "Jean-Baptiste Kiminou", job: "Vendeur · 3 ans", score: 74 },
  { name: "Awa Mbemba", job: "Hôtesse d'accueil · 2 ans", score: 61 },
  { name: "Prince Nganga", job: "Magasinier · 1 an", score: 38 },
];

function Initials({ name, className }: Readonly<{ name: string; className?: string }>) {
  const parts = name.split(/[\s-]+/);
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-page font-semibold text-[11px] text-muted-foreground",
        className,
      )}
    >
      {(parts[0][0] + parts[parts.length - 1][0]).toUpperCase()}
    </span>
  );
}

function RankedRow({ r, i }: Readonly<{ r: (typeof RANKED)[number]; i: number }>) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-page p-2.5">
      <span className="w-4 text-center font-semibold text-muted-foreground text-xs">{i + 1}</span>
      <ScoreRing score={r.score} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{r.name}</p>
        <p className="truncate text-muted-foreground text-xs">{r.job}</p>
      </div>
      <span className="hidden sm:inline">
        <VerdictChip score={r.score} />
      </span>
    </div>
  );
}

/** The hero: the ranked CVs, the mailbox they came from, an interview confirmed. */
export function HeroMockup() {
  return (
    <div className="relative pt-6 pb-8 sm:pr-10">
      <MockupFrame label="Aperçu : une analyse de CV classe quatre candidats pour un poste de caissier, du plus adapté au moins adapté." title="Analyse de CV · Caissier en supermarché">
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1">
            <p className="font-semibold">Caissier en supermarché</p>
            <span className="rounded-full bg-chip-green px-2.5 py-1 font-medium text-chip-green-foreground text-xs">4 CV classés</span>
          </div>
          {RANKED.map((r, i) => (
            <RankedRow key={r.name} r={r} i={i} />
          ))}
        </div>
      </MockupFrame>
      <FloatCard className="-bottom-1 left-4 hidden items-center gap-3 sm:flex">
        <ProviderTile provider="gmail" className="size-9" />
        <div>
          <p className="font-medium text-xs">2 CV importés de Gmail</p>
          <p className="text-[11px] text-muted-foreground">recrutement@monentreprise.cg</p>
        </div>
      </FloatCard>
      <FloatCard className="-top-5 right-0 hidden items-center gap-2.5 md:flex">
        <span className="flex size-8 items-center justify-center rounded-full bg-chip-green text-chip-green-foreground">
          <IconCheck className="size-4" />
        </span>
        <div>
          <p className="font-medium text-xs">Entretien confirmé</p>
          <p className="text-[11px] text-muted-foreground">Grâce · jeudi 10 h</p>
        </div>
      </FloatCard>
    </div>
  );
}

function CvMockup() {
  return (
    <div className="relative pb-6 md:pr-16">
      <MockupFrame label="Aperçu : la fiche d'un CV analysé, avec sa note, ses critères, ses points forts et son parcours." title="Analyse de CV">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ScoreRing score={86} size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">Grâce Loubaki</p>
                <VerdictChip score={86} />
              </div>
              <p className="text-muted-foreground text-xs">Caissière principale · 4 ans et 2 mois en lien avec le poste</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
            <div className="space-y-2 text-xs">
              <p className="font-medium text-sm">Points forts</p>
              {["Tenue de caisse et inventaires", "Encadrement d'une équipe de 3", "Disponible immédiatement"].map((p) => (
                <p key={p} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-whatsapp-dark" />
                  {p}
                </p>
              ))}
            </div>
            <div className="space-y-2 rounded-2xl bg-page p-3">
              <CriterionBar label="Compétences" value={90} />
              <CriterionBar label="Expérience" value={85} />
              <CriterionBar label="Lieu" value={100} />
            </div>
          </div>
          <div className="space-y-1.5 rounded-2xl bg-page p-3 text-xs">
            <p className="font-medium text-sm">Parcours</p>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2">
              <span className="truncate">Caissière principale · Supermarché Mayaka</span>
              <span className="shrink-0 rounded-full bg-chip-green px-2 py-0.5 text-chip-green-foreground">Temps plein</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2">
              <span className="truncate">Vendeuse · Boutique Les Palmiers</span>
              <span className="shrink-0 rounded-full bg-page px-2 py-0.5">Temps partiel</span>
            </div>
          </div>
        </div>
      </MockupFrame>
      <FloatCard className="right-0 bottom-0 hidden w-52 space-y-2 md:block">
        <p className="font-medium text-xs">Depuis votre messagerie</p>
        {(
          [
            ["gmail", "CV_Grace_Loubaki.pdf"],
            ["outlook", "CV Kiminou.docx"],
          ] as const
        ).map(([p, f]) => (
          <div key={f} className="flex items-center gap-2 rounded-xl bg-page p-2">
            <ProviderTile provider={p} className="size-7 rounded-lg [&>svg]:size-4" />
            <span className="truncate text-[11px]">{f}</span>
            <IconCheck className="ml-auto size-3.5 shrink-0 text-whatsapp-dark" />
          </div>
        ))}
      </FloatCard>
    </div>
  );
}

function OfferMockup() {
  return (
    <MockupFrame label="Aperçu : quelques mots décrivant un besoin deviennent une offre rédigée, avec son intitulé, sa description et son métier." title="Rédiger avec l'IA">
      <div className="space-y-3">
        <div className="rounded-2xl bg-page px-4 py-3 text-sm">
          2 serveurs pour un mariage samedi soir à Pointe-Noire
        </div>
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-chip-violet px-3 py-1 font-medium text-chip-violet-foreground text-xs">
            <IconWand className="size-3.5" />
            Offre rédigée
          </span>
        </div>
        <div className="space-y-2 rounded-2xl bg-page p-4">
          <p className="font-semibold">Serveurs pour une réception de mariage</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Nous recherchons deux serveurs pour assurer le service d&apos;une réception de mariage, samedi soir à Pointe-Noire :
            accueil des invités, service à table et au buffet, débarrassage.
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Expérience en restauration appréciée ; présentation soignée et sens du service attendus.
          </p>
          <p className="pt-1 text-[11px] text-muted-foreground">
            Métier proposé : <span className="font-medium text-foreground">Serveur</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span className="h-9 flex-1 rounded-full bg-page" />
          <span className="flex h-9 flex-[2] items-center justify-center rounded-full bg-ink font-medium text-white text-xs">
            Utiliser cette offre
          </span>
        </div>
      </div>
    </MockupFrame>
  );
}

function ApplicantsMockup() {
  return (
    <div className="relative pb-10">
      <MockupFrame label="Aperçu : les candidatures d'une offre classées par note, avec le détail d'une note et des réponses groupées." title="Offre · Vendeur en boutique">
        <div className="space-y-2">
          {RANKED.slice(0, 3).map((r, i) => (
            <div key={r.name} className={cn("rounded-2xl bg-page p-2.5", i === 0 && "space-y-2.5")}>
              <div className="flex items-center gap-3">
                <span className={cn("size-4 shrink-0 rounded-md", i > 0 ? "bg-whatsapp-dark" : "bg-card")}>
                  {i > 0 && <IconCheck className="size-4 p-0.5 text-white" />}
                </span>
                <ScoreRing score={r.score} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{r.name}</p>
                  <p className="truncate text-muted-foreground text-xs">{r.job}</p>
                </div>
                <VerdictChip score={r.score} />
              </div>
              {i === 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-card p-3">
                  <CriterionBar label="Métier" value={95} />
                  <CriterionBar label="Expérience" value={80} />
                  <CriterionBar label="Lieu" value={90} />
                  <CriterionBar label="Fiabilité" value={85} />
                </div>
              )}
            </div>
          ))}
        </div>
      </MockupFrame>
      <FloatCard className="right-4 -bottom-1 left-4 flex items-center gap-2 bg-ink text-white sm:left-auto">
        <span className="text-xs">2 sélectionnés</span>
        <span className="rounded-full bg-white/15 px-3 py-1.5 font-medium text-xs">Refuser avec un message</span>
      </FloatCard>
    </div>
  );
}

function InterviewsMockup() {
  return (
    <div className="relative pb-8 md:pr-20">
      <MockupFrame label="Aperçu : une invitation à un entretien confirmée par le candidat, et les agendas où elle apparaît." title="Entretiens">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-page p-3">
            <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-card">
              <span className="text-[10px] text-muted-foreground uppercase">jeu.</span>
              <span className="font-semibold text-sm leading-none">14</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">Grâce Loubaki · Caissière</p>
              <p className="flex items-center gap-1 text-muted-foreground text-xs">
                <IconMapPin className="size-3.5" />
                10 h 00 · Sur place
              </p>
            </div>
            <span className="rounded-full bg-chip-green px-2.5 py-1 font-medium text-chip-green-foreground text-xs">Confirmé</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-page p-3">
            <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-card">
              <span className="text-[10px] text-muted-foreground uppercase">ven.</span>
              <span className="font-semibold text-sm leading-none">15</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">Jean-Baptiste Kiminou · Vendeur</p>
              <p className="flex items-center gap-1 text-muted-foreground text-xs">
                <IconVideo className="size-3.5" />
                15 h 30 · En visio
              </p>
            </div>
            <span className="rounded-full bg-chip-amber px-2.5 py-1 font-medium text-chip-amber-foreground text-xs">Autre créneau</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-page p-3">
            <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-card">
              <span className="text-[10px] text-muted-foreground uppercase">lun.</span>
              <span className="font-semibold text-sm leading-none">18</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">Awa Mbemba · Hôtesse d&apos;accueil</p>
              <p className="flex items-center gap-1 text-muted-foreground text-xs">
                <IconPhone className="size-3.5" />9 h 00 · Par téléphone
              </p>
            </div>
            <span className="rounded-full bg-page px-2.5 py-1 font-medium text-muted-foreground text-xs ring-1 ring-foreground/10">Envoyée</span>
          </div>
        </div>
      </MockupFrame>
      <FloatCard className="right-0 bottom-0 hidden space-y-2 md:block">
        <p className="flex items-center gap-1.5 font-medium text-xs">
          <IconCalendarEvent className="size-3.5" />
          Dans votre agenda
        </p>
        <div className="space-y-1.5">
          {["Google Agenda", "Outlook", "Apple Calendrier"].map((a) => (
            <p key={a} className="flex items-center gap-2 rounded-xl bg-page px-2.5 py-1.5 text-[11px]">
              <IconCheck className="size-3.5 text-whatsapp-dark" />
              {a}
            </p>
          ))}
        </div>
      </FloatCard>
    </div>
  );
}

function TrackingMockup() {
  return (
    <div className="relative pb-8 md:pr-16">
      <MockupFrame label="Aperçu : un tableau de bord de recrutement sur 30 jours et son rapport en PDF. Chiffres d'exemple." title="Tableau de bord · exemple">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Vos recrutements</p>
            <span className="inline-flex rounded-full bg-page p-0.5 text-[11px]">
              <span className="rounded-full px-2 py-1 text-muted-foreground">7 j</span>
              <span className="rounded-full bg-selected px-2 py-1 font-medium text-selected-foreground">30 j</span>
              <span className="rounded-full px-2 py-1 text-muted-foreground">90 j</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Candidatures", "24"],
              ["Entretiens", "9"],
              ["Retenus", "4"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-page p-3">
                <p className="truncate text-[11px] text-muted-foreground">{l}</p>
                <p className="font-semibold text-xl tabular-nums">{v}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-2xl bg-page p-3">
            {[
              ["Reçues", 100],
              ["Examinées", 80],
              ["Entretiens", 38],
              ["Retenues", 17],
            ].map(([l, w]) => (
              <div key={l} className="flex items-center gap-3 text-[11px]">
                <span className="w-16 shrink-0 text-muted-foreground">{l}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-card">
                  <span className="block h-full rounded-full bg-whatsapp-dark" style={{ width: `${w}%` }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </MockupFrame>
      <FloatCard className="right-0 bottom-0 hidden w-40 space-y-2 md:block">
        <span className="flex items-center gap-1.5 font-medium text-xs">
          <IconFileText className="size-4 text-destructive" />
          Rapport PDF
        </span>
        <div className="space-y-1 rounded-xl bg-white p-2.5">
          <span className="block h-1.5 w-1/2 rounded bg-[#1f8f4e]" />
          <span className="block h-1.5 w-full rounded bg-black/10" />
          <span className="block h-1.5 w-5/6 rounded bg-black/10" />
          <span className="block h-6 w-full rounded bg-black/5" />
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <IconBriefcase className="size-3.5" />
          Contrat de mission
        </span>
      </FloatCard>
    </div>
  );
}

function ProfilesMockup() {
  const PROFILES = [
    { name: "Fortuné Mabiala", job: "Électricien bâtiment", city: "Brazzaville", tags: ["Habilitation B1", "6 ans"] },
    { name: "Clarisse Ngoma", job: "Aide-soignante", city: "Pointe-Noire", tags: ["Diplômée", "Nuits"] },
    { name: "Herman Okemba", job: "Chauffeur-livreur", city: "Brazzaville", tags: ["Permis C", "Disponible"] },
  ];
  return (
    <MockupFrame label="Aperçu : une recherche de profils vérifiés par métier et par ville." title="Trouver des profils">
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 rounded-full bg-page px-4 py-2.5 text-muted-foreground text-sm">
          <IconSparkles className="size-4" />
          électricien à Brazzaville
        </div>
        {PROFILES.map((p) => (
          <div key={p.name} className="flex items-center gap-3 rounded-2xl bg-page p-3">
            <Initials name={p.name} className="size-10 bg-card" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate font-medium text-sm">
                {p.name}
                <span className="flex size-4 items-center justify-center rounded-full bg-whatsapp-dark text-white">
                  <IconCheck className="size-2.5" strokeWidth={3} />
                </span>
              </p>
              <p className="truncate text-muted-foreground text-xs">
                {p.job} · {p.city}
              </p>
              <div className="mt-1 flex gap-1">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full bg-card px-2 py-0.5 text-[10px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span className="hidden size-8 items-center justify-center rounded-full bg-card sm:flex">
              <IconMessageCircle className="size-4" />
            </span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

const MOCKUPS: Record<MockupKey, () => React.ReactNode> = {
  cv: CvMockup,
  offer: OfferMockup,
  applicants: ApplicantsMockup,
  interviews: InterviewsMockup,
  tracking: TrackingMockup,
  profiles: ProfilesMockup,
};

export function FeatureMockup({ id }: Readonly<{ id: MockupKey }>) {
  const Mockup = MOCKUPS[id];
  return <Mockup />;
}

