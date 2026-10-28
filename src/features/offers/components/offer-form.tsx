"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useForm, useWatch, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconWand } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Combobox, type ComboboxOption } from "#/features/sign-up/components/combobox";
import { FIELD_CLASS, FieldLabel, StepActions, TextField } from "#/features/sign-up/components/form-bits";
import { useCities, useCountries } from "#/hooks/use-geo";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { getJobCategories, type EmploymentType, type Offer, type OfferInput, type PaymentFlow } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import { AVAILABLE_EMPLOYMENT_TYPES, EMPLOYMENT_TYPES, isDatedMission, PAYMENT_FLOWS } from "../offer-labels";
import { OfferAiDialog } from "./offer-ai-dialog";
import { OfferSummary } from "./offer-summary";

/** Mirrors the server (and the client app): a new date is at least 4 h ahead. */
const MIN_HOURS_AHEAD = 4;
const END_OF_DAY = "23:59";

const schema = z
  .object({
    title: z.string().trim().min(5, "Entre 5 et 100 caractères").max(100, "Entre 5 et 100 caractères"),
    description: z.string().trim().min(20, "Entre 20 et 1 000 caractères").max(1000, "Entre 20 et 1 000 caractères"),
    employmentType: z.enum(["MISSION", "CDD", "CDI", "STAGE"]),
    scheduledDate: z.string(),
    scheduledTime: z.string(),
    isRemote: z.boolean(),
    countryCode: z.string(),
    city: z.string(),
    address: z.string().trim(),
    quantity: z
      .string()
      .trim()
      .refine((v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 100, "Entre 1 et 100 personnes"),
    amount: z.string().trim(),
    paymentFlow: z.string(),
    categoryId: z.string().min(1, "Choisissez un métier"),
    note: z.string().trim().max(500, "500 caractères au plus"),
  })
  .superRefine((d, ctx) => {
    if (!d.scheduledDate) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledDate"],
        message: isDatedMission(d.employmentType as EmploymentType)
          ? "La date de la mission est requise"
          : "La date de clôture des candidatures est requise",
      });
    }
    if (d.address && d.address.length < 10) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "L'adresse doit contenir au moins 10 caractères" });
    }
    if (!d.isRemote) {
      if (!d.countryCode) ctx.addIssue({ code: "custom", path: ["countryCode"], message: "Choisissez le pays" });
      if (!d.city) ctx.addIssue({ code: "custom", path: ["city"], message: "Choisissez la ville" });
    }
    if (d.amount) {
      const n = Number(d.amount);
      if (!Number.isFinite(n) || n < 1000 || n > 1_000_000) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: "Entre 1 000 et 1 000 000 FCFA" });
      }
      if (!d.paymentFlow) ctx.addIssue({ code: "custom", path: ["paymentFlow"], message: "Précisez le rythme de paiement" });
    }
  });

export type OfferFormValues = z.infer<typeof schema>;

const pad = (n: number) => String(n).padStart(2, "0");
const toDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** The form's values for an existing offer (edit), or a blank form. */
export function offerFormValues(offer?: Offer): OfferFormValues {
  const at = offer?.scheduledAt ? new Date(offer.scheduledAt) : null;
  const time = at ? toTime(at) : "";
  return {
    title: offer?.title ?? "",
    description: offer?.description ?? "",
    employmentType: offer?.employmentType ?? "MISSION",
    scheduledDate: at ? toDate(at) : "",
    scheduledTime: time === END_OF_DAY ? "" : time,
    isRemote: offer?.isRemote ?? false,
    countryCode: offer?.countryCode ?? "CG",
    city: offer?.city ?? "",
    address: offer?.address ?? "",
    quantity: String(offer?.quantity ?? 1),
    amount: offer?.amount ? String(offer.amount) : "",
    paymentFlow: offer?.paymentFlow ?? "",
    categoryId: offer?.categoryId ?? "",
    note: offer?.note ?? "",
  };
}

/** A new date must be at least 4 h ahead (the server's rule). */
function isTooSoon(iso: string): boolean {
  return new Date(iso).getTime() < Date.now() + MIN_HOURS_AHEAD * 3600_000;
}

/** The local day + optional hour as an ISO instant (no hour: end of that day). */
export function scheduledIso(date: string, time: string): string {
  return new Date(`${date}T${time || END_OF_DAY}`).toISOString();
}

/** What the API takes, from the form. */
export function toOfferInput(v: OfferFormValues, countryName: string | undefined): OfferInput {
  return {
    title: v.title.trim(),
    description: v.description.trim(),
    scheduled_at: scheduledIso(v.scheduledDate, v.scheduledTime),
    employment_type: v.employmentType as EmploymentType,
    isRemote: v.isRemote,
    ...(v.isRemote ? {} : { countryCode: v.countryCode, countryName, city: v.city }),
    ...(v.address ? { address: v.address } : {}),
    quantity: Number(v.quantity),
    amount: v.amount ? Number(v.amount) : null,
    payment_flow: v.amount ? (v.paymentFlow as PaymentFlow) : null,
    ...(v.note ? { note: v.note } : {}),
    category_id: v.categoryId,
  };
}

/**
 * An offer, as the client app asks it: what, when (the day of a mission, or
 * when applications close), where (or remote), how many, the pay, the trade.
 * `keepSchedule` (edit) lets an unchanged date stay however close it now is.
 * Beside it, the offer as it will read and what the page adds (`aside`).
 */
export function OfferForm({
  defaultValues,
  submitLabel,
  pending,
  keepSchedule,
  aside,
  onSubmit,
  onCancel,
}: Readonly<{
  defaultValues: OfferFormValues;
  submitLabel: string;
  pending?: boolean;
  keepSchedule?: string;
  aside?: ReactNode;
  onSubmit: (values: OfferFormValues, countryName: string | undefined) => void;
  onCancel?: () => void;
}>) {
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const type = useWatch({ control: form.control, name: "employmentType" }) as EmploymentType;
  const remote = useWatch({ control: form.control, name: "isRemote" });
  const country = useWatch({ control: form.control, name: "countryCode" });
  const city = useWatch({ control: form.control, name: "city" });
  const amount = useWatch({ control: form.control, name: "amount" });
  const { data: countries } = useCountries();
  const { data: cities } = useCities(country);
  const { data: categories } = useQuery({ queryKey: ["job-categories"], queryFn: getJobCategories, staleTime: Infinity });
  const { data: subscription } = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const [writing, setWriting] = useState(false);
  // No AI writing in the plan: the button says where to find it instead.
  const aiIncluded = subscription?.entitlements.offerDraftsQuota !== 0;

  useEffect(() => {
    if (cities && city && !cities.includes(city)) form.setValue("city", "");
  }, [cities, city, form]);

  function submit(values: OfferFormValues) {
    const iso = scheduledIso(values.scheduledDate, values.scheduledTime);
    if (iso !== keepSchedule && isTooSoon(iso)) {
      form.setError(values.scheduledTime ? "scheduledTime" : "scheduledDate", {
        message: "La date doit être au moins 4 heures dans le futur",
      });
      return;
    }
    onSubmit(values, countries?.find((c) => c.code === values.countryCode)?.name);
  }

  const dated = isDatedMission(type);

  return (
    <Form {...form}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-10 rounded-3xl bg-card p-5 sm:p-8">
          <Section title="L'offre">
            {aiIncluded ? (
              <button
                type="button"
                onClick={() => setWriting(true)}
                className="flex w-full items-center gap-3 rounded-2xl bg-brand-lime/40 px-4 py-3 text-left transition-colors hover:bg-brand-lime/60"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime text-[#0f2414]">
                  <IconWand className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-sm">Rédiger avec l&apos;IA</span>
                  <span className="block text-muted-foreground text-xs">
                    Quelques mots suffisent : l&apos;intitulé, la description et le métier sont proposés.
                  </span>
                </span>
              </button>
            ) : (
              <Link
                href="/espace/abonnement"
                className="flex items-center gap-3 rounded-2xl bg-page px-4 py-3 text-muted-foreground text-sm hover:text-foreground"
              >
                <IconWand className="size-5 shrink-0" />
                La rédaction d&apos;offres par l&apos;IA est incluse dans les formules supérieures.
              </Link>
            )}
            <OfferAiDialog
              open={writing}
              onOpenChange={setWriting}
              context={{
                title: form.getValues("title") || undefined,
                employmentType: type,
                city: remote ? undefined : city || undefined,
                isRemote: remote,
                quantity: Number(form.getValues("quantity")) || undefined,
              }}
              onUse={(draft) => {
                const set = { shouldValidate: true, shouldDirty: true } as const;
                form.setValue("title", draft.title, set);
                form.setValue("description", draft.description, set);
                // The trade and the type only where the business has not chosen.
                if (draft.categoryId && !form.getValues("categoryId")) form.setValue("categoryId", draft.categoryId, set);
                if (
                  draft.employmentType &&
                  draft.employmentType !== type &&
                  AVAILABLE_EMPLOYMENT_TYPES.includes(draft.employmentType) &&
                  !form.formState.dirtyFields.employmentType
                ) {
                  form.setValue("employmentType", draft.employmentType, set);
                }
              }}
            />
            <TextField control={form.control} name="title" label="Intitulé" placeholder="Agent d'entretien pour nos bureaux" autoFocus />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>Description</FieldLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="Les tâches, le niveau attendu, les conditions de travail…"
                      className="min-h-32 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FieldLabel>Métier</FieldLabel>
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!fieldState.error}
                    options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
                    placeholder="Choisir le métier"
                    searchPlaceholder="Rechercher un métier"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          <Section title="Type et date">
            <Choice
              control={form.control}
              name="employmentType"
              label="Type d'offre"
              options={EMPLOYMENT_TYPES.map((t) => ({
                value: t.value,
                label: t.label,
                hint: t.hint,
                // An offer already of that type (made in the app) keeps it.
                disabled: !AVAILABLE_EMPLOYMENT_TYPES.includes(t.value) && t.value !== defaultValues.employmentType,
              }))}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>{dated ? "Date de la mission" : "Clôture des candidatures"}</FieldLabel>
                    <FormControl>
                      <Input {...field} type="date" min={toDate(new Date())} className={FIELD_CLASS} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel optional>Heure</FieldLabel>
                    <FormControl>
                      <Input {...field} type="time" className={FIELD_CLASS} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          <Section title="Lieu">
            <FormField
              control={form.control}
              name="isRemote"
              render={({ field }) => (
                <FormItem>
                  <div role="radiogroup" aria-label="Lieu" className="grid grid-cols-2 gap-2">
                    {[
                      { v: false, l: "Sur place" },
                      { v: true, l: "À distance" },
                    ].map((o) => (
                      <button
                        key={o.l}
                        type="button"
                        role="radio"
                        aria-checked={field.value === o.v}
                        onClick={() => field.onChange(o.v)}
                        className={cn(
                          "h-12 rounded-xl font-medium text-sm transition-colors",
                          field.value === o.v ? "bg-ink text-white" : "bg-page hover:bg-page/70",
                        )}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />
            {!remote && (
              <div className="grid gap-5 sm:grid-cols-2">
                <ComboField
                  control={form.control}
                  name="countryCode"
                  label="Pays"
                  placeholder="Choisir le pays"
                  options={(countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
                />
                <ComboField
                  control={form.control}
                  name="city"
                  label="Ville"
                  placeholder={country ? "Choisir la ville" : "Choisissez d'abord le pays"}
                  options={(cities ?? []).map((c) => ({ value: c, label: c }))}
                  disabled={!country}
                />
              </div>
            )}
            <TextField control={form.control} name="address" label="Adresse" optional placeholder="Quartier, rue, repère" />
          </Section>

          <Section title="Postes et rémunération">
            <TextField control={form.control} name="quantity" label="Nombre de personnes" type="number" min={1} max={100} />
            <TextField control={form.control} name="amount" label="Montant (FCFA)" optional type="number" min={1000} placeholder="15000" />
            {amount && (
              <Choice
                control={form.control}
                name="paymentFlow"
                label="Rythme de paiement"
                options={PAYMENT_FLOWS.map((f) => ({ value: f.value, label: f.label }))}
              />
            )}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel optional>Note pour les candidats</FieldLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Tenue, matériel à apporter, horaires…"
                      className="min-h-24 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          <StepActions onBack={onCancel} continueLabel={submitLabel} pending={pending} />
        </form>
        <aside className="space-y-6 lg:sticky lg:top-24">
          <OfferSummary
            control={form.control}
            categoryName={(id) => categories?.find((c) => c.id === id)?.name}
            countryName={(code) => countries?.find((c) => c.code === code)?.name}
          />
          {aside}
        </aside>
      </div>
    </Form>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
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

function ComboField({
  control,
  name,
  label,
  ...combobox
}: Readonly<{
  control: Control<OfferFormValues>;
  name: FieldPath<OfferFormValues>;
  label: string;
  placeholder: string;
  options: ComboboxOption[];
  disabled?: boolean;
}>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FieldLabel>{label}</FieldLabel>
          <Combobox value={String(field.value ?? "")} onChange={field.onChange} invalid={!!fieldState.error} {...combobox} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** A row of choices (type, payment rhythm): few options need no list. */
function Choice({
  control,
  name,
  label,
  options,
}: Readonly<{
  control: Control<OfferFormValues>;
  name: FieldPath<OfferFormValues>;
  label: string;
  options: { value: string; label: string; hint?: string; disabled?: boolean }[];
}>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel>{label}</FieldLabel>
          <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {options.map((o) => {
              const active = field.value === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={o.disabled}
                  title={o.disabled ? "Bientôt disponible" : o.hint}
                  onClick={() => field.onChange(o.value)}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-xl font-medium text-sm transition-colors",
                    active ? "bg-ink text-white" : "bg-page hover:bg-page/70",
                    o.disabled && "cursor-not-allowed opacity-50 hover:bg-page",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
