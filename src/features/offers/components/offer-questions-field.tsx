"use client";

import { IconCheck, IconPlus, IconTrash } from "@tabler/icons-react";

import { Input } from "#/components/ui/input";
import type { OfferQuestion, QuestionKind } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import { blankQuestion, KIND_LABEL, MAX_QUESTIONS, questionProblem, SUGGESTIONS, withKind } from "../offer-questions";

const KINDS: QuestionKind[] = ["YES_NO", "CHOICE", "SHORT_TEXT"];
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
        on ? "bg-selected text-selected-foreground" : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {on && <IconCheck className="size-3.5" />}
      {children}
    </button>
  );
}

/**
 * « Questions aux candidats »: up to five short questions asked when someone
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
          <div key={i} className="space-y-3 rounded-2xl bg-page p-4">
            <div className="flex items-start gap-2">
              <span className="mt-2.5 w-5 shrink-0 font-semibold text-muted-foreground text-sm">{i + 1}.</span>
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

            <div className="flex flex-wrap gap-1.5 pl-7">
              {KINDS.map((k) => (
                <Pill key={k} on={q.kind === k} onClick={() => set(i, withKind(q, k))}>
                  {KIND_LABEL[k]}
                </Pill>
              ))}
            </div>

            {q.kind === "CHOICE" && (
              <div className="space-y-2 pl-7">
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
                        onClick={() => set(i, { ...q, options: q.options.filter((_, j) => j !== oi), accepted: q.accepted.filter((a) => a !== o) })}
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

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pl-7">
              <Toggle
                on={q.knockout ? true : q.required}
                disabled={q.knockout}
                label="Obligatoire"
                hint={q.knockout ? "Une question éliminatoire est toujours posée" : undefined}
                onChange={(required) => set(i, { ...q, required })}
              />
              {q.kind !== "SHORT_TEXT" && (
                <Toggle
                  on={q.knockout}
                  label="Éliminatoire"
                  onChange={(knockout) => set(i, { ...q, knockout, required: knockout ? true : q.required, accepted: [] })}
                />
              )}
            </div>

            {q.knockout && (
              <div className="space-y-2 rounded-xl bg-card p-3 pl-7">
                <p className="font-medium text-sm">{q.kind === "YES_NO" ? "Réponse attendue" : "Réponses acceptées"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {q.kind === "YES_NO"
                    ? (
                        [
                          ["yes", "Oui"],
                          ["no", "Non"],
                        ] as const
                      ).map(([v, l]) => (
                        <Pill key={v} on={q.accepted[0] === v} onClick={() => set(i, { ...q, accepted: [v] })}>
                          {l}
                        </Pill>
                      ))
                    : q.options
                        .map((o) => o.trim())
                        .filter(Boolean)
                        .map((o) => (
                          <Pill
                            key={o}
                            on={q.accepted.includes(o)}
                            onClick={() =>
                              set(i, { ...q, accepted: q.accepted.includes(o) ? q.accepted.filter((a) => a !== o) : [...q.accepted, o] })
                            }
                          >
                            {o}
                          </Pill>
                        ))}
                </div>
              </div>
            )}

            {problem && <p className="pl-7 text-destructive text-sm">{problem}</p>}
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
              {unused.slice(0, 4).map((s) => (
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
