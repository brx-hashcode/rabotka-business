"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowLeft,
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
import { Textarea } from "#/components/ui/textarea";
import { Combobox } from "#/features/sign-up/components/combobox";
import { FieldLabel, StepActions, TextField } from "#/features/sign-up/components/form-bits";
import { claimsKey, createClaim, uploadClaimImages } from "#/lib/api/claim-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { listOffers, listReceivedApplications, offersKey } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import { ImagePicker } from "./claim-bits";

/** What the request is about: the team reads it first, in the title. */
const TOPICS = [
  { value: "candidate", label: "Candidat ou mission", hint: "Absence, retard, travail mal fait…" },
  { value: "payment", label: "Paiement ou facture", hint: "Montant, prélèvement, facture…" },
  { value: "plan", label: "Abonnement", hint: "Formule, contacts inclus…" },
  { value: "account", label: "Compte et documents", hint: "Vérification, informations…" },
  { value: "bug", label: "Problème technique", hint: "Une page ou une action qui ne marche pas" },
  { value: "other", label: "Autre", hint: "Une question, une idée…" },
] as const;
type Topic = (typeof TOPICS)[number]["value"];

/** The client app's rules, plus the subject and what it concerns. */
const schema = z.object({
  topic: z.string().min(1, "Choisissez un sujet"),
  offerId: z.string(),
  applicationId: z.string(),
  title: z.string().trim().min(1, "Objet requis").max(160, "Objet trop long"),
  description: z.string().trim().min(10, "10 caractères au moins").max(1800, "1 800 caractères au plus"),
});
type Values = z.infer<typeof schema>;

const NONE = "none";
const topicLabel = (t: string) => TOPICS.find((x) => x.value === t)?.label;

export function NewClaimPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
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
    () => [{ value: NONE, label: "Aucune en particulier" }, ...(offers.data?.items ?? []).map((o) => ({ value: o.id, label: o.title }))],
    [offers.data],
  );
  const candidateOptions = useMemo(() => {
    const seen = new Set<string>();
    const rows = (applications.data?.items ?? []).filter((a) => offerId === NONE || a.offer.id === offerId);
    const options = [{ value: NONE, label: "Aucun en particulier" }];
    for (const a of rows) {
      if (seen.has(a.applicationId)) continue;
      seen.add(a.applicationId);
      const name = `${a.worker.firstName} ${a.worker.lastName}`.trim();
      options.push({ value: a.applicationId, label: offerId === NONE ? `${name} · ${a.offer.title}` : name });
    }
    return options;
  }, [applications.data, offerId]);

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
        title: `${topicLabel(v.topic)} — ${v.title}`,
        description: context.length ? `${v.description}\n\n${context.join("\n")}` : v.description,
        attachment_urls,
      });
    },
    onSuccess: (claim) => {
      void queryClient.invalidateQueries({ queryKey: claimsKey });
      toast.success("Demande envoyée. L'équipe Rabotka vous répond ici.");
      router.push(`/espace/reclamations/${claim.id}`);
    },
    onError: (err) => toast.error(friendlyError(err, "La demande n'a pas pu être envoyée.")),
  });

  return (
    <div className="w-full space-y-6 pt-2">
      <Link href="/espace/reclamations" className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground">
        <IconArrowLeft className="size-4" />
        Aide
      </Link>
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Nouvelle demande</h1>
        <p className="text-muted-foreground">Dites-nous ce qui ne va pas : l&apos;équipe Rabotka vous répond dans votre espace.</p>
      </div>

      <Form {...form}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
          <form onSubmit={form.handleSubmit((v) => send.mutate(v))} noValidate className="space-y-8 rounded-3xl bg-card p-5 sm:p-8">
            <Section title="Le sujet">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <div role="radiogroup" aria-label="Sujet" className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                      {TOPICS.map((t) => {
                        const active = field.value === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => field.onChange(t.value)}
                            className={cn(
                              "flex flex-col items-start gap-0.5 rounded-2xl px-4 py-3 text-left transition-colors",
                              active ? "bg-ink text-white" : "bg-page hover:bg-page/70",
                            )}
                          >
                            <span className="font-medium text-sm">{t.label}</span>
                            <span className={cn("text-xs", active ? "text-white/70" : "text-muted-foreground")}>{t.hint}</span>
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
              <Section title="Ce que la demande concerne">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="offerId"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel optional>Offre</FieldLabel>
                        <Combobox
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v);
                            form.setValue("applicationId", NONE);
                          }}
                          options={offerOptions}
                          placeholder="Choisir une offre"
                          searchPlaceholder="Rechercher une offre…"
                          disabled={offers.isLoading}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicationId"
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel optional>Candidat</FieldLabel>
                        <Combobox
                          value={field.value}
                          onChange={field.onChange}
                          options={candidateOptions}
                          placeholder="Choisir un candidat"
                          searchPlaceholder="Rechercher un candidat…"
                          emptyText="Aucun candidat."
                          disabled={applications.isLoading}
                        />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>
            )}

            <Section title="Votre demande">
              <TextField control={form.control} name="title" label="Objet" placeholder="Ex. : candidat absent le jour de la mission" />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>Description</FieldLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={6}
                        placeholder="Ce qui s'est passé, quand, ce que vous attendez de nous…"
                        className="min-h-36 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FieldLabel optional>Photos</FieldLabel>
                <ImagePicker files={files} onChange={setFiles} disabled={send.isPending} />
                <p className="text-muted-foreground text-xs">Jusqu&apos;à 3 photos, JPG, PNG ou WEBP, 5 Mo chacune.</p>
              </div>
            </Section>

            <StepActions onBack={() => router.push("/espace/reclamations")} continueLabel="Envoyer" pending={send.isPending} />
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
  const v = useWatch({ control }) as Values;
  const topic = topicLabel(v.topic);
  const checks = [
    { label: "Sujet", done: !!v.topic },
    { label: "Objet", done: v.title.trim().length > 0 },
    { label: "Description (10 caractères au moins)", done: v.description.trim().length >= 10 },
  ];
  const done = checks.filter((c) => c.done).length;

  return (
    <section className="space-y-5 rounded-3xl bg-card p-6">
      <div className="space-y-3">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Aperçu de la demande</p>
        <h2 className={cn("break-words font-semibold text-xl leading-snug", !v.title.trim() && "text-muted-foreground")}>
          {v.title.trim() || "Objet de la demande"}
        </h2>
        {topic && (
          <span className="inline-flex rounded-full bg-brand-lime px-2.5 py-1 font-medium text-[#0f2414] text-xs">{topic}</span>
        )}
      </div>

      <dl className="space-y-3 text-sm">
        {concerns && (
          <>
            <Row icon={IconBriefcase} label="Offre" value={v.offerId !== NONE ? (offerTitle(v.offerId) ?? null) : null} />
            <Row icon={IconUser} label="Candidat" value={v.applicationId !== NONE ? (candidate(v.applicationId) ?? null) : null} />
          </>
        )}
        <Row icon={IconPhoto} label="Photos" value={photos ? `${photos} photo${photos > 1 ? "s" : ""}` : null} empty="Aucune" />
      </dl>

      <div className="space-y-3 rounded-2xl bg-page p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium text-sm">{done === checks.length ? "Prête à envoyer" : "À compléter"}</p>
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
  return (
    <section className="space-y-3 rounded-3xl bg-card p-6">
      <p className="font-medium text-sm">Et ensuite</p>
      <ul className="space-y-2.5 text-muted-foreground text-sm">
        <li className="flex gap-2.5">
          <IconMessageCircle className="mt-0.5 size-4 shrink-0" />
          L&apos;équipe Rabotka vous répond dans la demande, depuis Aide.
        </li>
        <li className="flex gap-2.5">
          <IconBell className="mt-0.5 size-4 shrink-0" />
          Une notification vous prévient à chaque réponse.
        </li>
      </ul>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  empty = "Non renseigné",
}: Readonly<{ icon: TablerIcon; label: string; value: string | null; empty?: string }>) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-page">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className={cn("break-words font-medium", !value && "text-muted-foreground")}>{value ?? empty}</dd>
      </div>
    </div>
  );
}
