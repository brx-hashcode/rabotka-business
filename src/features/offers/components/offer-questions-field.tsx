"use client";

import {
  IconAlignLeft,
  IconCalendar,
  IconCheck,
  IconCircleCheck,
  IconFileText,
  IconHash,
  IconListCheck,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { Input } from "#/components/ui/input";
import type { OfferQuestion, QuestionKind } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import {
  blankQuestion,
  CAN_KNOCK_OUT,
  KIND_HINT,
  KIND_LABEL,
  MAX_QUESTIONS,
  questionProblem,
  SUGGESTIONS,
  withKind,
} from "../offer-questions";

const KINDS: { kind: QuestionKind; icon: typeof IconCheck }[] = [
  { kind: "YES_NO", icon: IconCircleCheck },
  { kind: "CHOICE", icon: IconListCheck },
  { kind: "SHORT_TEXT", icon: IconAlignLeft },
  { kind: "LONG_TEXT", icon: IconFileText },
  { kind: "NUMBER", icon: IconHash },
  { kind: "DATE", icon: IconCalendar },
];
const INPUT = "h-11 rounded-xl border-0 bg-card px-4 text-base shadow-none md:text-[15px]";

function Toggle({
  on,
  label,
  hint,
  disabled,
  onChange,
}: Readonly<{ on: boolean; label: string; hint?: string; disabled?: boolean; onChange: (on: boolean) => void }>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      title={hint}
      className="inline-flex items-center gap-2 text-sm disabled:opacity-50"
    >
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-whatsapp-dark" : "bg-foreground/15")}>
        <span className={cn("absolute top-0.5 left-0 size-4 rounded-full bg-white transition-transform", on ? "translate-x-4.5" : "translate-x-0.5")} />
      </span>
      {label}
    </button>
  );
}

function Pill({ on, children, onClick }: Readonly<{ on: boolean; children: React.ReactNode; onClick: () => void }>) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium text-sm",
        on ? "bg-selected text-selected-foreground" : "bg-page text-muted-foreground hover:text-foreground",
      )}
    >
      {on && <IconCheck className="size-3.5" />}
      {children}
    </button>
  );
}

/** The six kinds as tiles, the chosen one saying what the candidate will do. */
function KindPicker({ value, onChange }: Readonly<{ value: QuestionKind; onChange: (kind: QuestionKind) => void }>) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-muted-foreground text-xs">Type de réponse</p>
      <div role="radiogroup" aria-label="Type de réponse" className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {KINDS.map(({ kind, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            role="radio"
            aria-checked={value === kind}
            onClick={() => onChange(kind)}
            className={cn(
              "flex h-11 items-center gap-2 rounded-xl px-3 text-left font-medium text-sm transition-colors",
              value === kind ? "bg-selected text-selected-foreground" : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{KIND_LABEL[kind]}</span>
          </button>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">{KIND_HINT[value]}</p>
    </div>
  );
}

/** What an « éliminatoire » keeps: the expected answer, a minimum or a latest date. */
function Threshold({ q, onChange }: Readonly<{ q: OfferQuestion; onChange: (q: OfferQuestion) => void }>) {
  if (q.kind === "NUMBER" || q.kind === "DATE") {
    return (
      <label className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium">{q.kind === "NUMBER" ? "Au moins" : "Disponible au plus tard le"}</span>
        <Input
          type={q.kind === "NUMBER" ? "number" : "date"}
          min={0}
          inputMode={q.kind === "NUMBER" ? "decimal" : undefined}
          value={q.accepted[0] ?? ""}
          onChange={(e) => onChange({ ...q, accepted: e.target.value ? [e.target.value] : [] })}
          className={cn(INPUT, "w-44 bg-page")}
        />
      </label>
    );
  }
  const choices: [string, string][] =
    q.kind === "YES_NO"
      ? [
          ["yes", "Oui"],
          ["no", "Non"],
        ]
      : q.options
          .map((o) => o.trim())
          .filter(Boolean)
          .map((o) => [o, o]);
  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">{q.kind === "YES_NO" ? "Réponse attendue" : "Réponses acceptées"}</p>
      <div className="flex flex-wrap gap-1.5">
        {choices.map(([v, l]) => (
          <Pill
            key={v}
            on={q.accepted.includes(v)}
            onClick={() =>
              onChange({
                ...q,
                accepted: q.kind === "YES_NO" ? [v] : q.accepted.includes(v) ? q.accepted.filter((a) => a !== v) : [...q.accepted, v],
              })
            }
          >
            {l}
          </Pill>
        ))}
      </div>
    </div>
  );
}

/**
 * « Questions aux candidats »: up to five questions asked when someone
 * applies. An « éliminatoire » one sets aside (without refusing) the
 * applications that answer it otherwise than expected.
 */
export function OfferQuestionsField({
  value,
  onChange,
}: Readonly<{ value: OfferQuestion[]; onChange: (questions: OfferQuestion[]) => void }>) {
  const set = (i: number, q: OfferQuestion) => onChange(value.map((x, j) => (j === i ? q : x)));
  const unused = SUGGESTIONS.filter((s) => !value.some((q) => q.label.trim() === s.label));

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Les candidats y répondent en postulant. Une question <span className="font-medium text-foreground">éliminatoire</span>{" "}
        place à la fin de la liste ceux qui ne remplissent pas le critère, sans les refuser.
      </p>

      {value.map((q, i) => {
        const problem = questionProblem(q);
        return (
          <div key={i} className="space-y-4 rounded-2xl bg-page p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card font-semibold text-sm">
                {i + 1}
              </span>
              <Input
                value={q.label}
                onChange={(e) => set(i, { ...q, label: e.target.value })}
                maxLength={140}
                placeholder="Votre question"
                aria-label={`Question ${i + 1}`}
                className={INPUT}
              />
              <button
                type="button"
                aria-label={`Retirer la question ${i + 1}`}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-card hover:text-destructive"
              >
                <IconTrash className="size-4" />
              </button>
            </div>

            <div className="space-y-4 sm:pl-11">
              <KindPicker value={q.kind} onChange={(kind) => set(i, withKind(q, kind))} />

              {q.kind === "CHOICE" && (
                <div className="space-y-2">
                  <p className="font-medium text-muted-foreground text-xs">Réponses proposées</p>
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <Input
                        value={o}
                        onChange={(e) => {
                          const options = q.options.map((x, j) => (j === oi ? e.target.value : x));
                          set(i, { ...q, options, accepted: q.accepted.filter((a) => a !== o) });
                        }}
                        maxLength={60}
                        placeholder={`Réponse ${oi + 1}`}
                        className={INPUT}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          aria-label={`Retirer la réponse ${oi + 1}`}
                          onClick={() =>
                            set(i, { ...q, options: q.options.filter((_, j) => j !== oi), accepted: q.accepted.filter((a) => a !== o) })
                          }
                          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-card hover:text-foreground"
                        >
                          <IconTrash className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => set(i, { ...q, options: [...q.options, ""] })}
                      className="inline-flex items-center gap-1.5 font-medium text-sm text-whatsapp-dark hover:underline"
                    >
                      <IconPlus className="size-4" />
                      Ajouter une réponse
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <Toggle
                  on={q.knockout ? true : q.required}
                  disabled={q.knockout}
                  label="Obligatoire"
                  hint={q.knockout ? "Une question éliminatoire est toujours posée" : undefined}
                  onChange={(required) => set(i, { ...q, required })}
                />
                {CAN_KNOCK_OUT.includes(q.kind) && (
                  <Toggle
                    on={q.knockout}
                    label="Éliminatoire"
                    onChange={(knockout) => set(i, { ...q, knockout, required: knockout ? true : q.required, accepted: [] })}
                  />
                )}
              </div>

              {q.knockout && (
                <div className="rounded-xl bg-card p-3.5">
                  <Threshold q={q} onChange={(next) => set(i, next)} />
                </div>
              )}

              {problem && <p className="text-destructive text-sm">{problem}</p>}
            </div>
          </div>
        );
      })}

      {value.length < MAX_QUESTIONS && (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onChange([...value, blankQuestion()])}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
          >
            <IconPlus className="size-4" />
            Ajouter une question
          </button>
          {unused.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {unused.slice(0, 5).map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => onChange([...value, { ...s, options: [...s.options], accepted: [...s.accepted] }])}
                  className="rounded-full bg-page px-3 py-1.5 text-left text-muted-foreground text-xs hover:text-foreground"
                >
                  + {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
