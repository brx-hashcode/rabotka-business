"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconArrowUp, IconPlayerStopFilled, IconX } from "@tabler/icons-react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { Bone } from "#/components/page-skeletons";
import { askCvChat, cvScreeningsKey, getCvChat } from "#/lib/api/cv-screening-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { CvResume } from "#/lib/api/types";
import { ScoreRing, VerdictChip } from "./cv-bits";

const SUGGESTIONS = [
  "Résumez son parcours en quelques lignes.",
  "Quelles questions lui poser en entretien ?",
  "Quels points vérifier avant de le retenir ?",
  "Son expérience correspond-elle au niveau demandé ?",
];

/**
 * A conversation about one analysed CV, in a drawer: questions on the right,
 * the answers on the left, written as they arrive. Kept per CV; the plan
 * sets how many questions one CV allows.
 */
export function CvChatSheet({
  open,
  onOpenChange,
  screeningId,
  jobTitle,
  resume,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screeningId: string;
  jobTitle: string;
  resume: CvResume;
}>) {
  const queryClient = useQueryClient();
  const key = [...cvScreeningsKey, screeningId, resume.id, "chat"];
  const chat = useQuery({ queryKey: key, queryFn: () => getCvChat(screeningId, resume.id), enabled: open });

  const [draft, setDraft] = useState("");
  // The question being answered and the answer so far, until the saved
  // conversation is read back.
  const [live, setLive] = useState<{ question: string; answer: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const name = resume.candidate?.name ?? resume.fileName;
  const data = chat.data;
  const remaining = data ? data.remaining - (live ? 1 : 0) : 0;
  const canAsk = !!data && data.available && remaining > 0 && !live;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [data?.messages.length, live?.answer, live?.question]);

  // Leaving stops the answer; what was written so far is kept by the server.
  useEffect(() => {
    if (!open) abort.current?.abort();
  }, [open]);
  useEffect(() => () => abort.current?.abort(), []);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || !canAsk) return;
    setDraft("");
    setError(null);
    setLive({ question: q, answer: "" });
    const controller = new AbortController();
    abort.current = controller;
    try {
      await askCvChat(screeningId, resume.id, q, {
        signal: controller.signal,
        onText: (text) => setLive((l) => (l ? { ...l, answer: l.answer + text } : l)),
      });
    } catch (err) {
      if (!controller.signal.aborted) setError(friendlyError(err, "La réponse n'a pas pu être rédigée. Réessayez dans un instant."));
    } finally {
      await queryClient.invalidateQueries({ queryKey: key });
      setLive(null);
      abort.current = null;
    }
  }

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
        <SheetPrimitive.Content
          aria-describedby={undefined}
          className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-soft outline-none data-[state=closed]:duration-300 data-[state=open]:duration-500 sm:w-[min(36rem,92vw)]"
        >
          <header className="flex items-start gap-3.5 px-5 pt-5 pb-4 sm:px-6">
            {resume.score !== null && <ScoreRing score={resume.score} size={48} />}
            <div className="min-w-0 flex-1 space-y-1">
              <SheetPrimitive.Title className="truncate font-semibold text-lg leading-tight">{name}</SheetPrimitive.Title>
              <p className="truncate text-muted-foreground text-sm">{jobTitle}</p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {resume.score !== null && <VerdictChip score={resume.score} />}
                {data && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {remaining} question{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""} sur {data.limit}
                  </span>
                )}
              </div>
            </div>
            <SheetPrimitive.Close
              aria-label="Fermer"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-page hover:bg-page/70"
            >
              <IconX className="size-5" />
            </SheetPrimitive.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-page/60 px-5 py-5 sm:px-6">
            {chat.isLoading ? (
              <div className="space-y-4">
                <Bone className="ml-auto h-10 w-2/3 rounded-2xl" />
                <Bone className="h-24 w-5/6 rounded-2xl" />
              </div>
            ) : !data ? (
              <p className="text-muted-foreground text-sm">{friendlyError(chat.error, "La conversation est indisponible pour le moment.")}</p>
            ) : (
              <div className="space-y-4">
                {data.messages.length === 0 && !live && <Intro name={name} available={data.available} onPick={(q) => void ask(q)} disabled={!canAsk} />}
                {data.messages.map((m) => (
                  <Bubble key={m.id} role={m.role} text={m.content} />
                ))}
                {live && (
                  <>
                    <Bubble role="user" text={live.question} />
                    {live.answer ? <Bubble role="assistant" text={live.answer} writing /> : <Thinking />}
                  </>
                )}
                {error && <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-destructive text-sm">{error}</p>}
                <div ref={end} />
              </div>
            )}
          </div>

          <footer className="space-y-2 px-5 pt-3 pb-5 sm:px-6">
            {data && !data.available ? (
              <p className="rounded-2xl bg-page px-4 py-3 text-muted-foreground text-sm">
                Ce CV a été supprimé à la fin de sa durée de conservation : la conversation reste lisible, sans nouvelle question.
              </p>
            ) : data && data.remaining === 0 ? (
              <p className="rounded-2xl bg-page px-4 py-3 text-muted-foreground text-sm">
                Vous avez posé les {data.limit} questions prévues pour ce CV.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void ask(draft);
                }}
                className="flex items-end gap-2 rounded-3xl bg-page p-2 focus-within:ring-2 focus-within:ring-ink/10"
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void ask(draft);
                    }
                  }}
                  rows={1}
                  maxLength={1000}
                  placeholder={`Une question sur ${name.split(" ")[0]}…`}
                  aria-label="Votre question"
                  disabled={!data}
                  className="field-sizing-content max-h-36 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-muted-foreground"
                />
                {live ? (
                  <button
                    type="button"
                    onClick={() => abort.current?.abort()}
                    aria-label="Arrêter la réponse"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-white hover:bg-ink/90"
                  >
                    <IconPlayerStopFilled className="size-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    aria-label="Envoyer"
                    disabled={!canAsk || !draft.trim()}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-white hover:bg-ink/90 disabled:opacity-30"
                  >
                    <IconArrowUp className="size-5" />
                  </button>
                )}
              </form>
            )}
            <p className="px-2 text-center text-muted-foreground text-xs">
              Les réponses s&apos;appuient sur le CV et l&apos;offre ; vérifiez les points importants en entretien.
            </p>
          </footer>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

function Intro({ name, available, disabled, onPick }: Readonly<{ name: string; available: boolean; disabled: boolean; onPick: (q: string) => void }>) {
  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="space-y-1">
          <p className="font-semibold">Interrogez le CV de {name}</p>
          <p className="mx-auto max-w-sm text-muted-foreground text-sm">
            Parcours, compétences, points à vérifier, questions d&apos;entretien : Rabotka répond d&apos;après le CV et l&apos;offre.
          </p>
        </div>
      </div>
      {available && (
        <div className="grid gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => onPick(s)}
              className="rounded-2xl bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-card/70 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Bubble({ role, text, writing }: Readonly<{ role: "user" | "assistant"; text: string; writing?: boolean }>) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[15px] text-white">{text}</p>
      </div>
    );
  }
  return (
    <div className="flex">
      <div className="min-w-0 max-w-[90%] rounded-3xl rounded-tl-lg bg-card px-4 py-3 text-[15px] leading-relaxed">
        <Answer text={text} />
        {writing && <span aria-hidden className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-foreground/40" />}
      </div>
    </div>
  );
}

/** While the first words are on their way. */
function Thinking() {
  return (
    <div className="flex" aria-live="polite">
      <div className="flex items-center gap-1.5 rounded-3xl rounded-tl-lg bg-card px-4 py-3.5">
        <span className="sr-only">Lecture du CV…</span>
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * An answer, lightly formatted: paragraphs, « - » lists and **bold**, the only
 * marks the assistant is asked to use. Plain text otherwise (React escapes it).
 */
function Answer({ text }: Readonly<{ text: string }>) {
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const item = /^\s*(?:[-*•]|\d+[.)])\s+/.exec(line);
    const last = blocks[blocks.length - 1];
    if (!line.trim()) {
      blocks.push({ list: false, lines: [] });
    } else if (item) {
      const content = line.slice(item[0].length);
      if (last?.list) last.lines.push(content);
      else blocks.push({ list: true, lines: [content] });
    } else if (last && !last.list && last.lines.length) {
      last.lines.push(line);
    } else {
      blocks.push({ list: false, lines: [line] });
    }
  }
  return (
    <div className="space-y-2">
      {blocks
        .filter((b) => b.lines.length)
        .map((b, i) =>
          b.list ? (
            <ul key={i} className="space-y-1.5">
              {b.lines.map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-whatsapp-dark" />
                  <span className="min-w-0">
                    <Inline text={l} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p key={i}>
              {b.lines.map((l, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  <Inline text={l} />
                </Fragment>
              ))}
            </p>
          ),
        )}
    </div>
  );
}

function Inline({ text }: Readonly<{ text: string }>) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

