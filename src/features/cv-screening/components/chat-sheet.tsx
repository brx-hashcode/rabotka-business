"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { IconArrowUp, IconFileTypePdf, IconInfoCircle, IconPlayerStopFilled, IconX } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { toast } from "sonner";

import Link from "next/link";

import { Bone } from "#/components/page-skeletons";
import { trialLocks } from "#/features/subscription/trial-lock";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import type { AskResult } from "#/lib/api/cv-screening-controller";
import { downloadFile } from "#/lib/api/download";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import type { CvChat, CvChatMessage } from "#/lib/api/types";
import { AnswerMarkdown } from "./answer-markdown";

export type ChatAsk = (
  question: string,
  opts: { signal: AbortSignal; onText: (text: string) => void },
) => Promise<AskResult>;

/** A question refused as outside the recruitment: shown here only, never saved. */
type Refused = { id: string; question: string; answer: string; at: string };

/**
 * A conversation with the AI about CVs, in a drawer: questions on the right,
 * the answers on the left, written as they arrive. What it is about (one CV,
 * several compared) comes from the caller: how to load it, how to ask, what
 * to suggest, what the header shows.
 */
export function ChatSheet({
  open,
  onOpenChange,
  queryKey,
  load,
  ask: send,
  title,
  subtitle,
  lead,
  meta,
  intro,
  suggestions,
  placeholder,
  usedUp,
  gone,
  pdfUrl,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryKey: QueryKey;
  load: () => Promise<CvChat>;
  ask: ChatAsk;
  title: string;
  subtitle: string;
  /** Beside the title: a score ring, or several. */
  lead?: ReactNode;
  /** Under the title: the candidates, a verdict. */
  meta?: ReactNode;
  intro: { title: string; text: string };
  suggestions: string[];
  placeholder: string;
  usedUp: (limit: number) => string;
  /** What is said when a CV is missing, at the top; null when they are all there. */
  gone: (data: CvChat) => ReactNode;
  /** The conversation as a PDF; null while it can't be known yet. */
  pdfUrl?: () => string | null;
}>) {
  const queryClient = useQueryClient();
  const t = useTranslations("cv.sheet");
  const tCommon = useTranslations("common");
  const friendlyError = useFriendlyError();
  const key = queryKey;
  const chat = useQuery({ queryKey: key, queryFn: load, enabled: open });
  // No question at all on this plan: why, and where to change it.
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription, enabled: open });
  const chatTrialLocked = trialLocks(subscription.data?.entitlements, "cvChat");

  const [draft, setDraft] = useState("");
  // The question being answered and the answer so far, until the saved
  // conversation is read back.
  const [live, setLive] = useState<{ question: string; answer: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refused, setRefused] = useState<Refused[]>([]);
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const data = chat.data;
  // The saved conversation, with the refused questions where they were asked.
  const thread: (CvChatMessage & { note?: boolean })[] = [
    ...(data?.messages ?? []),
    ...refused.flatMap((r) => [
      { id: `${r.id}-q`, role: "user" as const, content: r.question, createdAt: r.at },
      { id: `${r.id}-a`, role: "assistant" as const, content: r.answer, createdAt: r.at, note: true },
    ]),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const remaining = data ? data.remaining - (live ? 1 : 0) : 0;
  const notice = data ? gone(data) : null;
  const canAsk = !!data && data.available && remaining > 0 && !live;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [data?.messages.length, live?.answer, live?.question]);

  // Leaving stops the answer; what was written so far is kept by the server.
  useEffect(() => {
    if (!open) abort.current?.abort();
  }, [open]);
  useEffect(() => () => abort.current?.abort(), []);

  async function exportPdf() {
    const url = pdfUrl?.();
    if (!url || exporting) return;
    setExporting(true);
    try {
      await downloadFile(url, "conversation.pdf");
    } catch (err) {
      toast.error(friendlyError(err, t("pdfFailed")));
    } finally {
      setExporting(false);
    }
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || !canAsk) return;
    setDraft("");
    setError(null);
    setLive({ question: q, answer: "" });
    const controller = new AbortController();
    abort.current = controller;
    try {
      const result = await send(q, {
        signal: controller.signal,
        onText: (text) => setLive((l) => (l ? { ...l, answer: l.answer + text } : l)),
      });
      const offTopic = result.offTopic;
      if (offTopic) {
        setRefused((r) => [...r, { id: `refused-${Date.now()}`, question: q, answer: offTopic, at: new Date().toISOString() }]);
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(friendlyError(err, t("answerFailed")));
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
          className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-card shadow-soft outline-none data-[state=closed]:duration-300 data-[state=open]:duration-500 sm:w-[min(48rem,92vw)]"
        >
          <header className="flex items-start gap-3.5 px-5 pt-5 pb-4 sm:px-6">
            {lead}
            <div className="min-w-0 flex-1 space-y-1">
              <SheetPrimitive.Title className="truncate font-semibold text-lg leading-tight">{title}</SheetPrimitive.Title>
              <p className="truncate text-muted-foreground text-sm">{subtitle}</p>
              {meta && <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>}
            </div>
            {pdfUrl && (
              <button
                type="button"
                onClick={() => void exportPdf()}
                // Nothing to print before the first question, nor while an answer is being written.
                disabled={exporting || !!live || !data?.messages.length}
                title={t("pdfTitle")}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-page px-3.5 font-medium text-sm hover:bg-page/70 disabled:opacity-40"
              >
                {exporting ? <Loader className="size-4 animate-spin" /> : <IconFileTypePdf className="size-4" />}
                <span className="hidden sm:inline">{exporting ? t("preparing") : "PDF"}</span>
                <span className="sr-only sm:hidden">{t("pdfShort")}</span>
              </button>
            )}
            <SheetPrimitive.Close
              aria-label={tCommon("close")}
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
              <p className="text-muted-foreground text-sm">{friendlyError(chat.error, t("loadFailed"))}</p>
            ) : (
              <div className="space-y-4">
                {notice && (
                  <div role="status" className="flex gap-2.5 rounded-2xl bg-chip-amber p-4 text-chip-amber-foreground text-sm leading-relaxed">
                    <IconInfoCircle className="mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0 space-y-1">{notice}</div>
                  </div>
                )}
                {thread.length === 0 && !live && data.available && <Intro intro={intro} suggestions={suggestions} onPick={(q) => void ask(q)} disabled={!canAsk} />}
                {thread.map((m) => (
                  <Bubble key={m.id} role={m.role} text={m.content} note={m.note} />
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
                {data.messages.length > 0 ? t("readOnly") : t("closed")}
              </p>
            ) : data && data.limit === 0 ? (
              <p className="rounded-2xl bg-page px-4 py-3 text-muted-foreground text-sm">
                {chatTrialLocked
                  ? t("trialLocked")
                  : t("notInPlan")}{" "}
                <Link href="/espace/abonnement" className="font-medium text-foreground underline underline-offset-2">
                  {t("seePlans")}
                </Link>
              </p>
            ) : data && data.remaining === 0 ? (
              <p className="rounded-2xl bg-page px-4 py-3 text-muted-foreground text-sm">
                {usedUp(data.limit)}
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
                  placeholder={placeholder}
                  aria-label={t("questionLabel")}
                  disabled={!data}
                  className="field-sizing-content max-h-36 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-muted-foreground"
                />
                {live ? (
                  <button
                    type="button"
                    onClick={() => abort.current?.abort()}
                    aria-label={t("stop")}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-white hover:bg-ink/90"
                  >
                    <IconPlayerStopFilled className="size-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    aria-label={t("send")}
                    disabled={!canAsk || !draft.trim()}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-white hover:bg-ink/90 disabled:opacity-30"
                  >
                    <IconArrowUp className="size-5" />
                  </button>
                )}
              </form>
            )}
            <p className="px-2 text-center text-muted-foreground text-xs">
              {data && data.available && data.limit > 0 && (
                <span className="font-medium text-foreground/70 tabular-nums">
                  {t("remaining", { count: remaining, limit: data.limit })} ·{" "}
                </span>
              )}
              {t("disclaimer")}
            </p>
          </footer>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}

function Intro({
  intro,
  suggestions,
  disabled,
  onPick,
}: Readonly<{
  intro: { title: string; text: string };
  suggestions: string[];
  disabled: boolean;
  onPick: (q: string) => void;
}>) {
  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="space-y-1">
          <p className="font-semibold">{intro.title}</p>
          <p className="mx-auto max-w-sm text-muted-foreground text-sm">{intro.text}</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
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
    </div>
  );
}

function Bubble({ role, text, writing, note }: Readonly<{ role: "user" | "assistant"; text: string; writing?: boolean; note?: boolean }>) {
  if (note) {
    // A refusal, not an answer: said plainly, in the assistant's place.
    return (
      <div className="flex">
        <p className="flex max-w-[90%] gap-2 rounded-3xl rounded-tl-lg bg-card px-4 py-3 text-muted-foreground text-sm leading-relaxed">
          <IconInfoCircle className="mt-0.5 size-4 shrink-0" />
          {text}
        </p>
      </div>
    );
  }
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[15px] text-white">{text}</p>
      </div>
    );
  }
  return (
    <div className="flex">
      <div className="min-w-0 max-w-[90%] overflow-hidden rounded-3xl rounded-tl-lg bg-card px-4 py-3 text-[15px] leading-relaxed [overflow-wrap:anywhere]">
        <AnswerMarkdown text={text} />
        {writing && <span aria-hidden className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-foreground/40" />}
      </div>
    </div>
  );
}

/** While the first words are on their way. */
function Thinking() {
  const t = useTranslations("cv.sheet");
  return (
    <div className="flex" aria-live="polite">
      <div className="flex items-center gap-1.5 rounded-3xl rounded-tl-lg bg-card px-4 py-3.5">
        <span className="sr-only">{t("reading")}</span>
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}
