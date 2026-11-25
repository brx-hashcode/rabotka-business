"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconBell,
  IconBriefcase,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconMessageCircle,
  IconPhoto,
  IconUser,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormMessage } from "#/components/ui/form";
import { BackLink } from "#/components/back-link";
import { Textarea } from "#/components/ui/textarea";
import { Combobox } from "#/features/sign-up/components/combobox";
import { FieldLabel, StepActions, TextField } from "#/features/sign-up/components/form-bits";
import { claimsKey, createClaim, uploadClaimImages } from "#/lib/api/claim-controller";
import type { Translator } from "#/i18n/translator";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { listOffers, listReceivedApplications, offersKey } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import { useWhyNot } from "#/lib/use-why-not";
import { ImagePicker, TOPICS, type Topic } from "./claim-bits";


/** The client app's rules, plus the subject and what it concerns. */
const claimSchema = (t: Translator<"claims.form">) =>
  z.object({
    topic: z.string().min(1, t("errors.topic")),
    offerId: z.string(),
    applicationId: z.string(),
    title: z.string().trim().min(1, t("errors.titleRequired")).max(160, t("errors.titleTooLong")),
    description: z.string().trim().min(10, t("errors.descriptionMin")).max(1800, t("errors.descriptionMax")),
  });
type Values = z.infer<ReturnType<typeof claimSchema>>;

const NONE = "none";
/** The topic as the title is written with it: French, for the team (see TOPICS). */
const topicInTitle = (topic: string) => TOPICS.find((x) => x.value === topic)?.inTitle;
const isTopic = (topic: string): topic is Topic => TOPICS.some((x) => x.value === topic);

export function NewClaimPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("claims.form");
  const whyNot = useWhyNot();
  const tc = useTranslations("claims");
  const friendlyError = useFriendlyError();
  const [files, setFiles] = useState<File[]>([]);
  const schema = useMemo(() => claimSchema(t), [t]);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { topic: "", offerId: NONE, applicationId: NONE, title: "", description: "" },
  });

  // What the request may concern: the business's own offers and candidates.
  const offers = useQuery({ queryKey: [...offersKey, "claim-picker"], queryFn: () => listOffers({ pageSize: 100 }) });
  // Its own key: Candidatures keeps the paged (infinite) list under `received`.
  const applications = useQuery({ queryKey: [...offersKey, "received", "claim-picker"], queryFn: () => listReceivedApplications(0, 100) });
  const topic = useWatch({ control: form.control, name: "topic" }) as Topic | "";
  const offerId = useWatch({ control: form.control, name: "offerId" });
  const concerns = topic === "candidate" || topic === "payment";

  const offerOptions = useMemo(
    () => [{ value: NONE, label: t("noOffer") }, ...(offers.data?.items ?? []).map((o) => ({ value: o.id, label: o.title }))],
    [offers.data, t],
  );
  const candidateOptions = useMemo(() => {
    const seen = new Set<string>();
    const rows = (applications.data?.items ?? []).filter((a) => offerId === NONE || a.offer.id === offerId);
    const options = [{ value: NONE, label: t("noCandidate") }];
    for (const a of rows) {
      if (seen.has(a.applicationId)) continue;
      seen.add(a.applicationId);
      const name = `${a.worker.firstName} ${a.worker.lastName}`.trim();
      options.push({ value: a.applicationId, label: offerId === NONE ? `${name} · ${a.offer.title}` : name });
    }
    return options;
  }, [applications.data, offerId, t]);

  const offerTitle = (id: string) => offers.data?.items.find((o) => o.id === id)?.title;
  const application = (id: string) => applications.data?.items.find((a) => a.applicationId === id);

  const send = useMutation({
    mutationFn: async (v: Values) => {
      // Photos first: the claim references the urls the server wrote them to.
      const attachment_urls = files.length ? await uploadClaimImages(files) : undefined;
      // The claim has a title and a text only: the subject leads the title,
      // and what it concerns closes the text, where the team reads it.
      const app = concerns && v.applicationId !== NONE ? application(v.applicationId) : undefined;
      const offer = concerns ? (app?.offer.title ?? (v.offerId !== NONE ? offerTitle(v.offerId) : undefined)) : undefined;
      const context = [
        offer && `Offre : ${offer}`,
        app && `Candidat : ${`${app.worker.firstName} ${app.worker.lastName}`.trim()}`,
      ].filter(Boolean);
      return createClaim({
        title: `${topicInTitle(v.topic)} — ${v.title}`,
        description: context.length ? `${v.description}\n\n${context.join("\n")}` : v.description,
        attachment_urls,
      });
    },
    onSuccess: (claim) => {
      void queryClient.invalidateQueries({ queryKey: claimsKey });
      toast.success(t("sent"));
      router.push(`/espace/reclamations/${claim.id}`);
    },
    onError: (err) => toast.error(friendlyError(err, t("sendFailed"))),
  });

  return (
    <div className="w-full space-y-6 pt-2">
      <BackLink href="/espace/reclamations" label={tc("list.title")} current={t("title")} />
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </div>

      <Form {...form}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
          <form onSubmit={form.handleSubmit((v) => send.mutate(v))} noValidate className="space-y-8 rounded-3xl bg-card p-5 sm:p-8">
            <Section title={t("topicSection")}>
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <div role="radiogroup" aria-label={t("topic")} className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                      {TOPICS.map((x) => {
                        const active = field.value === x.value;
                        return (
                          <button
                            key={x.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => field.onChange(x.value)}
                            className={cn(
                              "flex flex-col items-start gap-0.5 rounded-2xl px-4 py-3 text-left transition-colors",
                              active ? "bg-ink text-white" : "bg-page hover:bg-page/70",
                            )}
                          >
                            <span className="font-medium text-sm">{tc(`topics.${x.value}.label`)}</span>
                            <span className={cn("text-xs", active ? "text-white/70" : "text-muted-foreground")}>{tc(`topics.${x.value}.hint`)}</span>
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            {concerns && (
              <Section title={t("concernsSection")}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="offerId"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel optional>{t("offer")}</FieldLabel>
                        <Combobox
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v);
                            form.setValue("applicationId", NONE);
                          }}
                          options={offerOptions}
                          placeholder={t("offerPlaceholder")}
                          searchPlaceholder={t("offerSearch")}
                          disabled={offers.isLoading}
                          title={whyNot([offers.isLoading, "loading"])}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicationId"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel optional>{t("candidate")}</FieldLabel>
                        <Combobox
                          value={field.value}
                          onChange={field.onChange}
                          options={candidateOptions}
                          placeholder={t("candidatePlaceholder")}
                          searchPlaceholder={t("candidateSearch")}
                          emptyText={t("candidateEmpty")}
                          disabled={applications.isLoading}
                          title={whyNot([applications.isLoading, "loading"])}
                        />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>
            )}

            <Section title={t("requestSection")}>
              <TextField control={form.control} name="title" label={t("subject")} placeholder={t("subjectPlaceholder")} />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>{t("description")}</FieldLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={6}
                        placeholder={t("descriptionPlaceholder")}
                        className="min-h-36 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FieldLabel optional>{t("photos")}</FieldLabel>
                <ImagePicker files={files} onChange={setFiles} disabled={send.isPending} />
                <p className="text-muted-foreground text-xs">{t("photosHint")}</p>
              </div>
            </Section>

            <StepActions onBack={() => router.push("/espace/reclamations")} continueLabel={t("send")} pending={send.isPending} />
          </form>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <ClaimSummary
              control={form.control}
              concerns={concerns}
              photos={files.length}
              offerTitle={offerTitle}
              candidate={(id) => {
                const a = application(id);
                return a ? `${a.worker.firstName} ${a.worker.lastName}`.trim() : undefined;
              }}
            />
            <NextSteps />
          </aside>
        </div>
      </Form>
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

/** The request as the team will read it, kept in step with the form, and what is still missing. */
function ClaimSummary({
  control,
  concerns,
  photos,
  offerTitle,
  candidate,
}: Readonly<{
  control: Control<Values>;
  concerns: boolean;
  photos: number;
  offerTitle: (id: string) => string | undefined;
  candidate: (id: string) => string | undefined;
}>) {
  const t = useTranslations("claims.form");
  const tc = useTranslations("claims");
  const v = useWatch({ control }) as Values;
  const topic = isTopic(v.topic) ? tc(`topics.${v.topic}.label`) : null;
  const checks = [
    { label: t("topic"), done: !!v.topic },
    { label: t("subject"), done: v.title.trim().length > 0 },
    { label: t("descriptionCheck"), done: v.description.trim().length >= 10 },
  ];
  const done = checks.filter((c) => c.done).length;

  return (
    <section className="space-y-5 rounded-3xl bg-card p-6">
      <div className="space-y-3">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{t("preview")}</p>
        <h2 className={cn("break-words font-semibold text-xl leading-snug", !v.title.trim() && "text-muted-foreground")}>
          {v.title.trim() || t("subjectEmpty")}
        </h2>
        {topic && (
          <span className="inline-flex rounded-full bg-brand-lime px-2.5 py-1 font-medium text-[#0f2414] text-xs">{topic}</span>
        )}
      </div>

      <dl className="space-y-3 text-sm">
        {concerns && (
          <>
            <Row icon={IconBriefcase} label={t("offer")} value={v.offerId !== NONE ? (offerTitle(v.offerId) ?? null) : null} />
            <Row icon={IconUser} label={t("candidate")} value={v.applicationId !== NONE ? (candidate(v.applicationId) ?? null) : null} />
          </>
        )}
        <Row icon={IconPhoto} label={t("photos")} value={photos ? t("photoCount", { count: photos }) : null} empty={t("noPhoto")} />
      </dl>

      <div className="space-y-3 rounded-2xl bg-page p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium text-sm">{done === checks.length ? t("ready") : t("toComplete")}</p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {done}/{checks.length}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-card">
          <div className="h-full rounded-full bg-whatsapp-dark transition-[width]" style={{ width: `${(done / checks.length) * 100}%` }} />
        </div>
        <ul className="space-y-1.5 text-sm">
          {checks.map((c) => (
            <li key={c.label} className={cn("flex items-center gap-2", c.done ? "text-foreground" : "text-muted-foreground")}>
              {c.done ? <IconCircleCheckFilled className="size-4 shrink-0 text-whatsapp-dark" /> : <IconCircleDashed className="size-4 shrink-0" />}
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function NextSteps() {
  const t = useTranslations("claims.form");
  return (
    <section className="space-y-3 rounded-3xl bg-card p-6">
      <p className="font-medium text-sm">{t("next")}</p>
      <ul className="space-y-2.5 text-muted-foreground text-sm">
        <li className="flex gap-2.5">
          <IconMessageCircle className="mt-0.5 size-4 shrink-0" />
          {t("next1")}
        </li>
        <li className="flex gap-2.5">
          <IconBell className="mt-0.5 size-4 shrink-0" />
          {t("next2")}
        </li>
      </ul>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  empty,
}: Readonly<{ icon: TablerIcon; label: string; value: string | null; empty?: string }>) {
  const t = useTranslations("claims.form");
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-page">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className={cn("break-words font-medium", !value && "text-muted-foreground")}>{value ?? empty ?? t("notFilled")}</dd>
      </div>
    </div>
  );
}
