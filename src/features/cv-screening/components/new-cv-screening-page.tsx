"use client";

import { useTranslations } from "next-intl";
import { useWhyNot } from "#/lib/use-why-not";
import { trialLocks } from "#/features/subscription/trial-lock";
import { cvOutOfReach } from "#/features/subscription/packs";
import { usePackOnSale } from "#/features/subscription/use-packs";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconBell, IconClock, IconFileText, IconShieldLock } from "@tabler/icons-react";
import { toast } from "sonner";

import { FormPageSkeleton } from "#/components/page-skeletons";
import { BackLink } from "#/components/back-link";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Combobox } from "#/features/sign-up/components/combobox";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { addCvScreeningFiles, createCvScreening, cvScreeningsKey } from "#/lib/api/cv-screening-controller";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { listOffers, offersKey } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import type { MailPick } from "../mail-picks";
import { CHUNK_MAX_FILES, chunkCvBatch, mailRefs, sendRest } from "../send-cv-batch";
import { CvLocked, CvUsedUp } from "./cv-bits";
import { CvPicker } from "./cv-picker";

/**
 * A new « Analyse de CV »: the job (an offer, or one described here), then the
 * CVs, within what the plan covers. The analysis runs in the background; the
 * page it opens fills in as each CV is read.
 */
export function NewCvScreeningPage() {
  const router = useRouter();
  const t = useTranslations("cv.new");
  const whyNot = useWhyNot();
  const friendlyError = useFriendlyError();
  const queryClient = useQueryClient();
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const offers = useQuery({ queryKey: [...offersKey, "cv-picker"], queryFn: () => listOffers({ pageSize: 100 }) });

  const [source, setSource] = useState<"offer" | "custom">("offer");
  const [offerId, setOfferId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobText, setJobText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [mails, setMails] = useState<MailPick[]>([]);

  const e = subscription.data?.entitlements;
  const packOnSale = usePackOnSale("CV");
  const room = e ? Math.min(e.cvBatchMax, e.cvRemaining ?? Number.POSITIVE_INFINITY) : 0;
  const count = files.length + mails.length;

  const offerOptions = useMemo(() => (offers.data?.items ?? []).map((o) => ({ value: o.id, label: o.title })), [offers.data]);
  const offerTitle = offers.data?.items.find((o) => o.id === offerId)?.title;
  const jobReady = source === "offer" ? !!offerId : jobTitle.trim().length >= 3 && jobText.trim().length >= 30;

  // CVs sent so far: a large batch goes in several requests (send-cv-batch.ts).
  const [sent, setSent] = useState(0);
  const start = useMutation({
    mutationFn: async () => {
      const [first, ...rest] = chunkCvBatch(files, mails);
      setSent(0);
      const screening = await createCvScreening(
        first.files,
        source === "offer" ? { offerId } : { jobTitle: jobTitle.trim(), jobText: jobText.trim() },
        mailRefs(first.mails),
      );
      setSent(first.files.length + first.mails.length);
      const failed = await sendRest(
        rest,
        (c) => addCvScreeningFiles(screening.id, c.files, mailRefs(c.mails)),
        (n) => setSent((s) => s + n),
      );
      return { screening, failed: failed.reduce((n, c) => n + c.files.length + c.mails.length, 0) };
    },
    onSuccess: ({ screening, failed }) => {
      void queryClient.invalidateQueries({ queryKey: cvScreeningsKey });
      void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
      if (failed > 0) {
        toast.error(t("sendFailed", { count: failed }));
      }
      router.push(`/espace/analyse-cv/${screening.id}`);
    },
    onError: (err) => toast.error(friendlyError(err, t("startFailed"))),
  });

  if (subscription.isLoading) return <FormPageSkeleton back />;

  return (
    <div className="w-full space-y-6 pt-2">
      <BackLink href="/espace/analyse-cv" label={t("back")} current={t("title")} />
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </div>

      {!e || cvOutOfReach(e) ? (
        <CvLocked trial={trialLocks(e, "cvAnalysis")} packOnSale={packOnSale} />
      ) : e.cvRemaining === 0 ? (
        // An empty form with room for none read as broken.
        <CvUsedUp until={e.countersResetAt ?? e.endsAt} packOnSale={packOnSale} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              if (jobReady && count > 0) start.mutate();
            }}
            className="min-w-0 space-y-8 rounded-3xl bg-card p-5 sm:p-8"
          >
            <Section title={t("role")}>
              <div role="radiogroup" aria-label={t("roleLabel")} className="inline-flex rounded-full bg-page p-1">
                {(
                  [
                    ["offer", t("myOffer")],
                    ["custom", t("other")],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={source === key}
                    onClick={() => setSource(key)}
                    className={cn(
                      "rounded-full px-4 py-1.5 font-medium text-sm",
                      source === key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {source === "offer" ? (
                <div className="space-y-2">
                  <label className="font-medium text-sm" htmlFor="cv-offer">
                    {t("offer")}
                  </label>
                  <Combobox
                    value={offerId}
                    onChange={setOfferId}
                    options={offerOptions}
                    placeholder={offers.isLoading ? t("loading") : t("chooseOffer")}
                    searchPlaceholder={t("searchOffer")}
                    emptyText={t("noOffer")}
                    disabled={offers.isLoading}
                    title={whyNot([offers.isLoading, "loading"])}
                  />
                  <p className="text-muted-foreground text-xs">{t("offerHint")}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="font-medium text-sm" htmlFor="cv-title">
                      {t("jobTitle")}
                    </label>
                    <Input
                      id="cv-title"
                      value={jobTitle}
                      onChange={(ev) => setJobTitle(ev.target.value)}
                      maxLength={120}
                      placeholder={t("jobTitlePlaceholder")}
                      className="h-12 rounded-xl border-0 bg-page px-4 text-base shadow-none md:text-[15px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-medium text-sm" htmlFor="cv-text">
                      {t("jobText")}
                    </label>
                    <Textarea
                      id="cv-text"
                      value={jobText}
                      onChange={(ev) => setJobText(ev.target.value)}
                      rows={6}
                      maxLength={8000}
                      placeholder={t("jobTextPlaceholder")}
                      className="min-h-36 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
                    />
                    <p className="text-muted-foreground text-xs">{t("jobTextHint")}</p>
                  </div>
                </div>
              )}
            </Section>

            <Section title={t("cvs")}>
              <CvPicker
                files={files}
                mails={mails}
                room={room === Number.POSITIVE_INFINITY ? e.cvBatchMax : room}
                maxMb={e.cvFileMaxMb}
                disabled={start.isPending}
                title={whyNot([start.isPending, "wait"])}
                onFiles={setFiles}
                onMails={setMails}
              />
            </Section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link href="/espace/analyse-cv" className="inline-flex h-12 items-center justify-center rounded-full bg-page px-6 font-medium hover:bg-page/70">
                {t("cancel")}
              </Link>
              <button
                type="submit"
                disabled={!jobReady || count === 0 || start.isPending}
                title={whyNot([start.isPending, "wait"], [!jobReady, "complete"], [count === 0, { say: t("addCv") }])}
                className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 font-medium text-white hover:bg-ink/90 disabled:opacity-40"
              >
                {start.isPending
                  ? count > CHUNK_MAX_FILES
                    ? t("sendingCount", { sent, count })
                    : t("sending")
                  : t("start", { count: count ? String(count) : "none" })}
              </button>
            </div>
          </form>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <section className="space-y-4 rounded-3xl bg-card p-6">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{t("yours")}</p>
              <h2 className={cn("break-words font-semibold text-xl leading-snug", !(offerTitle || jobTitle.trim()) && "text-muted-foreground")}>
                {(source === "offer" ? offerTitle : jobTitle.trim()) || t("toChoose")}
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-page p-3">
                  <dt className="text-muted-foreground text-xs">{t("added")}</dt>
                  <dd className="font-semibold text-xl tabular-nums">{count}</dd>
                </div>
                <div className="rounded-2xl bg-page p-3">
                  <dt className="text-muted-foreground text-xs">{t("left")}</dt>
                  <dd className="font-semibold text-xl tabular-nums">{e.cvRemaining === null ? t("unlimited") : Math.max(0, e.cvRemaining - count)}</dd>
                </div>
              </dl>
            </section>
            <section className="space-y-3 rounded-3xl bg-card p-6">
              <p className="font-medium text-sm">{t("next")}</p>
              <ul className="space-y-2.5 text-muted-foreground text-sm">
                <Step icon={IconClock}>{t("step1")}</Step>
                <Step icon={IconBell}>{t("step2")}</Step>
                <Step icon={IconFileText}>{t("step3")}</Step>
                <Step icon={IconShieldLock}>{t("step4")}</Step>
              </ul>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="shrink-0 font-semibold text-base">{title}</h2>
        <span aria-hidden className="h-px flex-1 bg-page" />
      </div>
      {children}
    </section>
  );
}

function Step({ icon: Icon, children }: Readonly<{ icon: typeof IconClock; children: React.ReactNode }>) {
  return (
    <li className="flex gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
