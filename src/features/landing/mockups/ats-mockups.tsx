import { IconCheck, IconFileText, IconMessageCircle, IconNote, IconQuestionMark, IconVideo, IconX } from "@tabler/icons-react";

import { useLocale } from "next-intl";

import { ScoreRing } from "#/features/cv-screening/components/cv-bits";
import { siteCopy } from "../copy";
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

/** The board's columns, in order; their titles are mockups.pipeline.columns. "careers": the careers page. */
const COLUMNS: Person[][] = [
  [
    { name: "Didier Ondongo", source: "LinkedIn", score: 71 },
    { name: "Mireille Tchibota", source: "careers", score: 64 },
  ],
  [
    { name: "Grâce Loubaki", source: "Rabotka", score: 88, dragging: true },
    { name: "Patrick Mavoungou", source: "QR code", score: 76 },
  ],
  [
    { name: "Jean-Baptiste Kiminou", source: "Rabotka", score: 79, extra: "report" },
    { name: "Sandra Ebolo", source: "careers", score: 73, extra: "visio" },
  ],
  [{ name: "Awa Mbemba", source: "careers", score: 91 }],
];

function useCopy() {
  return siteCopy(useLocale() as "fr" | "en").mockups;
}

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
  const m = useCopy().pipeline;
  const columns = COLUMNS.map((people, i) => ({ title: m.columns[i], people }));
  return (
    <div className="relative">
      <MockupFrame label={m.label} title={m.title}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title} className="min-w-0 space-y-2.5 rounded-2xl bg-page p-2.5">
              <p className="flex items-center justify-between gap-1 px-1 pt-0.5 font-medium text-[10px] leading-tight">
                <span className="whitespace-nowrap">{col.title}</span>
                <span className="rounded-full bg-card px-1.5 text-[10px] text-muted-foreground tabular-nums">{col.people.length}</span>
              </p>
              {col.people.map((p) => (
                <div
                  key={p.name}
                  className={cn("space-y-1.5 rounded-xl bg-card p-2.5", p.dragging && "-rotate-3 translate-x-1 shadow-soft ring-2 ring-whatsapp/40")}
                >
                  <p className="truncate font-medium text-[11px]">{shortName(p.name)}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ScoreRing score={p.score} size={20} />
                    <span className="whitespace-nowrap rounded-full bg-page px-1.5 py-0.5 text-[9.5px] text-muted-foreground">{p.source === "careers" ? m.careersPage : p.source}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 empty:hidden">
                    {p.extra === "visio" && (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-chip-sky px-1.5 py-0.5 text-[9.5px] text-chip-sky-foreground">
                        <IconVideo className="size-2.5" />
                        {m.visio}
                      </span>
                    )}
                    {p.extra === "report" && (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-chip-green px-1.5 py-0.5 text-[9.5px] text-chip-green-foreground">
                        <IconFileText className="size-2.5" />
                        {m.report}
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
        <span className="font-medium text-xs">{m.reportReady}</span>
      </FloatCard>
      <FloatCard className="-bottom-5 left-4 hidden items-center gap-2 sm:flex">
        <span className="flex size-6 items-center justify-center rounded-full bg-whatsapp text-white">
          <IconCheck className="size-3.5" strokeWidth={3} />
        </span>
        <span className="font-medium text-xs">{m.hired}</span>
      </FloatCard>
    </div>
  );
}

/** Each opinion's verdict, beside mockups.team.opinions in order. */
const OPINION_VERDICTS = ["yes", "maybe", "yes"] as const;

const VERDICT = {
  yes: { icon: IconCheck, className: "bg-chip-green text-chip-green-foreground" },
  maybe: { icon: IconQuestionMark, className: "bg-chip-amber text-chip-amber-foreground" },
  no: { icon: IconX, className: "bg-chip-violet text-chip-violet-foreground" },
} as const;

/** A candidate as the team sees it: everyone's opinion, a private note, the history. */
export function TeamMockup() {
  const m = useCopy().team;
  const OPINIONS = m.opinions.map((who, i) => ({ who, verdict: OPINION_VERDICTS[i] }));
  return (
    <div className="relative">
      <MockupFrame label={m.label} title={m.title}>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 rounded-2xl bg-page p-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-card font-semibold text-[11px] text-muted-foreground">
              {initials("Grâce Loubaki")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">Grâce Loubaki</p>
              <p className="truncate text-muted-foreground text-xs">{m.candidate}</p>
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
                  {m.verdict[o.verdict]}
                </span>
              </div>
            );
          })}
          <div className="flex gap-2 rounded-2xl bg-page p-3 text-xs">
            <IconNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p>{m.note}</p>
          </div>
        </div>
      </MockupFrame>
      <FloatCard className="-right-2 -bottom-4 hidden items-center gap-2 md:flex">
        <IconMessageCircle className="size-4 text-whatsapp-dark" />
        <span className="text-xs">{m.gaveOpinion}</span>
      </FloatCard>
    </div>
  );
}
