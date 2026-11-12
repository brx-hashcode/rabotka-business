import { IconCheck, IconFileText, IconMessageCircle, IconNote, IconQuestionMark, IconVideo, IconX } from "@tabler/icons-react";

import { ScoreRing } from "#/features/cv-screening/components/cv-bits";
import { cn } from "#/lib/utils";
import { FloatCard, MockupFrame } from "./frame";

/*
 * Example data only: fictional people, illustrative scores. Nothing here is a
 * statistic about Rabotka.
 */

type Person = {
  name: string;
  source: string;
  score: number;
  /** What the board shows under the name: an interview planned, a compte rendu written. */
  extra?: "visio" | "report";
  /** Caught mid-drag, as on the real board. */
  dragging?: boolean;
};

const COLUMNS: { title: string; people: Person[] }[] = [
  {
    title: "À examiner",
    people: [
      { name: "Didier Ondongo", source: "LinkedIn", score: 71 },
      { name: "Mireille Tchibota", source: "Page carrières", score: 64 },
    ],
  },
  {
    title: "Présélectionnées",
    people: [
      { name: "Grâce Loubaki", source: "Rabotka", score: 88, dragging: true },
      { name: "Patrick Mavoungou", source: "QR code", score: 76 },
    ],
  },
  {
    title: "Entretien",
    people: [
      { name: "Jean-Baptiste Kiminou", source: "Rabotka", score: 79, extra: "report" },
      { name: "Sandra Ebolo", source: "Page carrières", score: 73, extra: "visio" },
    ],
  },
  {
    title: "Retenues",
    people: [{ name: "Awa Mbemba", source: "Page carrières", score: 91 }],
  },
];

/** « Grâce L. »: a board's card is narrow. */
function shortName(name: string) {
  const [first, ...rest] = name.split(" ");
  const last = rest.at(-1);
  return last ? `${first} ${last[0]}.` : first;
}

function initials(name: string) {
  const parts = name.split(/[\s-]+/);
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * The ATS board as it is: candidates by stage (shortlist included), one being
 * dragged, an interview in visio and a compte rendu written, then the hire.
 */
export function PipelineMockup() {
  return (
    <div className="relative">
      <MockupFrame
        label="Aperçu : le tableau d'une offre, candidats rangés par étape, avec leur note, leur provenance, la visio et le compte rendu."
        title="Caissier — Supermarché du Plateau"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title} className="min-w-0 space-y-2 rounded-2xl bg-page p-2">
              <p className="flex items-center justify-between gap-1 px-0.5 font-medium text-[10px] leading-tight">
                <span className="whitespace-nowrap">{col.title}</span>
                <span className="rounded-full bg-card px-1.5 text-[10px] text-muted-foreground tabular-nums">{col.people.length}</span>
              </p>
              {col.people.map((p) => (
                <div
                  key={p.name}
                  className={cn("space-y-1.5 rounded-xl bg-card p-2", p.dragging && "-rotate-3 translate-x-1 shadow-soft ring-2 ring-whatsapp/40")}
                >
                  <p className="truncate font-medium text-[11px]">{shortName(p.name)}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ScoreRing score={p.score} size={24} />
                    <span className="whitespace-nowrap rounded-full bg-page px-1.5 py-0.5 text-[9.5px] text-muted-foreground">{p.source}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 empty:hidden">
                    {p.extra === "visio" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-chip-sky px-1.5 py-0.5 text-[9.5px] text-chip-sky-foreground">
                        <IconVideo className="size-2.5" />
                        Visio · jeu. 10 h
                      </span>
                    )}
                    {p.extra === "report" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-chip-green px-1.5 py-0.5 text-[9.5px] text-chip-green-foreground">
                        <IconFileText className="size-2.5" />
                        Compte rendu
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </MockupFrame>
      <FloatCard className="-top-4 right-4 hidden items-center gap-2 sm:flex">
        <span className="flex size-6 items-center justify-center rounded-full bg-chip-green text-chip-green-foreground">
          <IconFileText className="size-3.5" />
        </span>
        <span className="font-medium text-xs">Compte rendu prêt · Jean-Baptiste</span>
      </FloatCard>
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
