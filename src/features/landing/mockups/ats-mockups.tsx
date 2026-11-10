import { IconCheck, IconMessageCircle, IconNote, IconQuestionMark, IconX } from "@tabler/icons-react";

import { ScoreRing } from "#/features/cv-screening/components/cv-bits";
import { cn } from "#/lib/utils";
import { FloatCard, MockupFrame } from "./frame";

/*
 * Example data only: fictional people, illustrative scores. Nothing here is a
 * statistic about Rabotka.
 */

const COLUMNS = [
  {
    title: "Reçues",
    people: [
      { name: "Grâce Loubaki", source: "Rabotka", score: 88 },
      { name: "Didier Ondongo", source: "LinkedIn", score: 71 },
      { name: "Mireille Tchibota", source: "Page carrières", score: 64 },
    ],
  },
  {
    title: "Entretien",
    people: [
      { name: "Jean-Baptiste Kiminou", source: "Rabotka", score: 79 },
      { name: "Sandra Ebolo", source: "QR code", score: 73 },
    ],
  },
  {
    title: "Retenue",
    people: [{ name: "Awa Mbemba", source: "Page carrières", score: 91 }],
  },
] as const;

function initials(name: string) {
  const parts = name.split(/[\s-]+/);
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** The ATS board: candidates by stage, each with its score and where it came from. */
export function PipelineMockup() {
  return (
    <div className="relative">
      <MockupFrame
        label="Aperçu : les candidats d'une offre rangés par étape, chacun avec sa note et sa provenance."
        title="Caissier — Supermarché du Plateau"
      >
        <div className="grid grid-cols-3 gap-2.5">
          {COLUMNS.map((col) => (
            <div key={col.title} className="min-w-0 space-y-2 rounded-2xl bg-page p-2.5">
              <p className="flex items-center justify-between px-1 font-medium text-xs">
                {col.title}
                <span className="rounded-full bg-card px-1.5 text-[10px] text-muted-foreground tabular-nums">
                  {col.people.length}
                </span>
              </p>
              {col.people.map((p) => (
                <div key={p.name} className="space-y-2 rounded-xl bg-card p-2.5">
                  <div className="flex items-center gap-2">
                    <ScoreRing score={p.score} size={30} />
                    <p className="min-w-0 truncate font-medium text-[11px]">{p.name}</p>
                  </div>
                  <span className="inline-block rounded-full bg-page px-2 py-0.5 text-[10px] text-muted-foreground">
                    {p.source}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </MockupFrame>
      <FloatCard className="-bottom-5 left-4 hidden items-center gap-2 sm:flex">
        <span className="flex size-6 items-center justify-center rounded-full bg-whatsapp text-white">
          <IconCheck className="size-3.5" strokeWidth={3} />
        </span>
        <span className="font-medium text-xs">Awa Mbemba retenue · contrat prêt</span>
      </FloatCard>
    </div>
  );
}

const OPINIONS = [
  { who: "Fabrice · Recruteur", verdict: "yes" },
  { who: "Nadège · Évaluatrice", verdict: "maybe" },
  { who: "Steve · Évaluateur", verdict: "yes" },
] as const;

const VERDICT = {
  yes: { label: "Oui", icon: IconCheck, className: "bg-chip-green text-chip-green-foreground" },
  maybe: { label: "Peut-être", icon: IconQuestionMark, className: "bg-chip-amber text-chip-amber-foreground" },
  no: { label: "Non", icon: IconX, className: "bg-chip-violet text-chip-violet-foreground" },
} as const;

/** A candidate as the team sees it: everyone's opinion, a private note, the history. */
export function TeamMockup() {
  return (
    <div className="relative">
      <MockupFrame label="Aperçu : les avis de l'équipe et une note sur un candidat." title="Avis de l'équipe">
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 rounded-2xl bg-page p-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-card font-semibold text-[11px] text-muted-foreground">
              {initials("Grâce Loubaki")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">Grâce Loubaki</p>
              <p className="truncate text-muted-foreground text-xs">Caissière · 4 ans · Brazzaville</p>
            </div>
            <ScoreRing score={88} size={40} />
          </div>
          {OPINIONS.map((o) => {
            const v = VERDICT[o.verdict];
            return (
              <div key={o.who} className="flex items-center justify-between gap-3 rounded-2xl bg-page px-3 py-2.5">
                <span className="truncate text-xs">{o.who}</span>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[11px]", v.className)}>
                  <v.icon className="size-3" strokeWidth={3} />
                  {v.label}
                </span>
              </div>
            );
          })}
          <div className="flex gap-2 rounded-2xl bg-page p-3 text-xs">
            <IconNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>Très à l&apos;aise avec la caisse et les clients. À revoir : disponibilité le dimanche.</p>
          </div>
        </div>
      </MockupFrame>
      <FloatCard className="-right-2 -bottom-4 hidden items-center gap-2 md:flex">
        <IconMessageCircle className="size-4 text-whatsapp-dark" />
        <span className="text-xs">Nadège a donné son avis</span>
      </FloatCard>
    </div>
  );
}
