"use client";

import { useTradeName } from "#/lib/api/use-trade-name";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { trialLocks } from "#/features/subscription/trial-lock";
import { offerWriterOutOfReach, PACKS_HREF } from "#/features/subscription/packs";
import { usePackOnSale } from "#/features/subscription/use-packs";
import { getJobCategories, type EmploymentType, type Offer, type OfferInput, type PaymentFlow } from "#/lib/api/offer-controller";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import { contentLocale } from "#/i18n/content";
import type { Translator } from "#/i18n/translator";
import { cn } from "#/lib/utils";
import { AVAILABLE_EMPLOYMENT_TYPES, EMPLOYMENT_TYPES, isDatedMission, PAYMENT_FLOWS } from "../offer-labels";
import { cleanQuestions, questionProblem } from "../offer-questions";
import { OfferAiDialog } from "./offer-ai-dialog";
import { OfferQuestionsField } from "./offer-questions-field";
import { OfferSummary } from "./offer-summary";

/**
 * Mirrors the server (and the client app): a new date only has to be still to
 * come. It is when applications close, and an urgent mission may start within
 * the hour.
 */
const MIN_HOURS_AHEAD = 0;
const END_OF_DAY = "23:59";

/** The server's bounds (trimmed length), shown under the field as it is typed. */
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 2500;
/** The offer's fields, with the reader's sentences (offers.form.v.*). */
const offerSchema = (t: Translator<"offers.form.v">, locale: Locale) => {
  const range = t("description", {
    min: DESCRIPTION_MIN.toLocaleString(INTL_LOCALE[locale]),
    max: DESCRIPTION_MAX.toLocaleString(INTL_LOCALE[locale]),
  });
  return z
  .object({
    title: z.string().trim().min(5, t("title")).max(100, t("title")),
    description: z.string().trim().min(DESCRIPTION_MIN, range).max(DESCRIPTION_MAX, range),
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
      .refine((v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 100, t("quantity")),
    amount: z.string().trim(),
    paymentFlow: z.string(),
    categoryId: z.string().min(1, t("category")),
    note: z.string().trim().max(500, t("note")),
    questions: z.array(
      z.object({
        kind: z.enum(["YES_NO", "CHOICE", "SHORT_TEXT", "LONG_TEXT", "NUMBER", "DATE", "FILE"]),
        label: z.string(),
        options: z.array(z.string()),
        required: z.boolean(),
        knockout: z.boolean(),
        accepted: z.array(z.string()),
      }),
    ),
  })
  .superRefine((d, ctx) => {
    if (!d.scheduledDate && isDatedMission(d.employmentType as EmploymentType)) {
      ctx.addIssue({ code: "custom", path: ["scheduledDate"], message: t("date") });
    }
    if (d.address && d.address.length < 10) {
      ctx.addIssue({ code: "custom", path: ["address"], message: t("address") });
    }
    if (!d.isRemote) {
      if (!d.countryCode) ctx.addIssue({ code: "custom", path: ["countryCode"], message: t("country") });
      if (!d.city) ctx.addIssue({ code: "custom", path: ["city"], message: t("city") });
    }
    if (d.questions.some((q) => questionProblem(q) !== null)) {
      ctx.addIssue({ code: "custom", path: ["questions"], message: t("questions") });
    }
    if (d.amount) {
      const n = Number(d.amount);
      if (!Number.isFinite(n) || n < 1000 || n > 1_000_000) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: t("amount") });
      }
      if (!d.paymentFlow) ctx.addIssue({ code: "custom", path: ["paymentFlow"], message: t("flow") });
    }
  });
};

export type OfferFormValues = z.infer<ReturnType<typeof offerSchema>>;

const pad = (n: number) => String(n).padStart(2, "0");
const toDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * The form's values for an existing offer (edit), or a blank form placed
 * where the organisation is (`home`): Rabotka Business is open in several
 * countries, so no country is assumed.
 */
export function offerFormValues(offer?: Offer, home?: { countryCode?: string | null; city?: string | null }): OfferFormValues {
  const at = offer?.scheduledAt ? new Date(offer.scheduledAt) : null;
  const time = at ? toTime(at) : "";
  return {
    title: offer?.title ?? "",
    description: offer?.description ?? "",
    employmentType: offer?.employmentType ?? "MISSION",
    scheduledDate: at ? toDate(at) : "",
    scheduledTime: time === END_OF_DAY ? "" : time,
    isRemote: offer?.isRemote ?? false,
    countryCode: offer?.countryCode ?? home?.countryCode ?? "",
    city: offer?.city ?? (offer ? "" : (home?.city ?? "")),
    address: offer?.address ?? "",
    quantity: String(offer?.quantity ?? 1),
    amount: offer?.amount ? String(offer.amount) : "",
    paymentFlow: offer?.paymentFlow ?? "",
    categoryId: offer?.categoryId ?? "",
    note: offer?.note ?? "",
    questions: offer?.questions ?? [],
  };
}

/** A new date must still be to come (the server's rule). */
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
    // Only a mission has a day: the business closes the others itself.
    scheduled_at: isDatedMission(v.employmentType as EmploymentType) ? scheduledIso(v.scheduledDate, v.scheduledTime) : null,
    employment_type: v.employmentType as EmploymentType,
    isRemote: v.isRemote,
    ...(v.isRemote ? {} : { countryCode: v.countryCode, countryName, city: v.city }),
    ...(v.address ? { address: v.address } : {}),
    quantity: Number(v.quantity),
    amount: v.amount ? Number(v.amount) : null,
    payment_flow: v.amount ? (v.paymentFlow as PaymentFlow) : null,
    ...(v.note ? { note: v.note } : {}),
    category_id: v.categoryId,
    questions: cleanQuestions(v.questions),
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
  const tLabels = useTranslations("labels");
  const t = useTranslations("offers.form");
  const tv = useTranslations("offers.form.v");
  const locale = useLocale() as Locale;
  const schema = useMemo(() => offerSchema(tv, locale), [tv, locale]);
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const type = useWatch({ control: form.control, name: "employmentType" }) as EmploymentType;
  const remote = useWatch({ control: form.control, name: "isRemote" });
  const country = useWatch({ control: form.control, name: "countryCode" });
  const city = useWatch({ control: form.control, name: "city" });
  // What the offer is written in: its ready-made questions follow it.
  const title = useWatch({ control: form.control, name: "title" });
  const description = useWatch({ control: form.control, name: "description" });
  const amount = useWatch({ control: form.control, name: "amount" });
  const { data: countries } = useCountries();
  const { data: cities } = useCities(country);
  const { data: categories } = useQuery({ queryKey: ["job-categories"], queryFn: getJobCategories, staleTime: Infinity });
  const trade = useTradeName();
  const { data: subscription } = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const [writing, setWriting] = useState(false);
  // No AI writing in the plan nor in a pack: the button says where to find it instead.
  const aiIncluded = !subscription || !offerWriterOutOfReach(subscription.entitlements);
  const draftPackOnSale = usePackOnSale("OFFER_DRAFT");
  // Included, but none left this period: said before the dialog, not by a refusal after it.
  const draftsOut = aiIncluded && subscription?.entitlements.offerDraftsRemaining === 0;
  const draftsUntil = subscription?.entitlements.countersResetAt ?? subscription?.entitlements.endsAt;

  useEffect(() => {
    if (cities && city && !cities.includes(city)) form.setValue("city", "");
  }, [cities, city, form]);

  function submit(values: OfferFormValues) {
    if (isDatedMission(values.employmentType as EmploymentType)) {
      const iso = scheduledIso(values.scheduledDate, values.scheduledTime);
      if (iso !== keepSchedule && isTooSoon(iso)) {
        form.setError(values.scheduledTime ? "scheduledTime" : "scheduledDate", {
          message: tv("future"),
        });
        return;
      }
    }
    onSubmit(values, countries?.find((c) => c.code === values.countryCode)?.name);
  }

  const dated = isDatedMission(type);

  return (
    <Form {...form}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-10 rounded-3xl bg-card p-5 sm:p-8">
          <Section title={t("offer")}>
            {draftsOut ? (
              <Link
                href={draftPackOnSale ? PACKS_HREF : "/espace/abonnement"}
                className="flex items-center gap-3 rounded-2xl bg-page px-4 py-3 text-muted-foreground text-sm hover:text-foreground"
              >
                <IconWand className="size-5 shrink-0" />
                {t("noMoreDrafts", {
                  date: draftsUntil ? new Date(draftsUntil).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long" }) : "none",
                  pack: draftPackOnSale ? "yes" : "no",
                })}
              </Link>
            ) : aiIncluded ? (
              <button
                type="button"
                onClick={() => setWriting(true)}
                className="flex w-full items-center gap-3 rounded-2xl bg-brand-lime/40 px-4 py-3 text-left transition-colors hover:bg-brand-lime/60 dark:bg-brand-lime/[0.08] dark:hover:bg-brand-lime/[0.16]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime text-[#0f2414]">
                  <IconWand className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-sm">{t("aiTitle")}</span>
                  <span className="block text-muted-foreground text-xs">{t("aiText")}</span>
                </span>
              </button>
            ) : (
              <Link
                href="/espace/abonnement"
                className="flex items-center gap-3 rounded-2xl bg-page px-4 py-3 text-muted-foreground text-sm hover:text-foreground"
              >
                <IconWand className="size-5 shrink-0" />
                {trialLocks(subscription?.entitlements, "offerWriter")
                  ? t("aiAfterTrial")
                  : t("aiHigher")}
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
            <TextField control={form.control} name="title" label={t("title")} placeholder={t("titlePlaceholder")} autoFocus />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>{t("description")}</FieldLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder={t("descriptionPlaceholder")}
                      className="min-h-32 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
                    />
                  </FormControl>
                  <div className="flex items-start justify-between gap-3">
                    <FormMessage />
                    <CharacterCount length={field.value.trim().length} min={DESCRIPTION_MIN} max={DESCRIPTION_MAX} />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FieldLabel>{t("trade")}</FieldLabel>
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!fieldState.error}
                    options={(categories ?? []).map((c) => ({ value: c.id, label: trade(c.name) }))}
                    placeholder={t("tradePlaceholder")}
                    searchPlaceholder={t("tradeSearch")}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          <Section title={dated ? t("typeAndDate") : t("type")}>
            <Choice
              control={form.control}
              name="employmentType"
              label={t("offerType")}
              options={EMPLOYMENT_TYPES.map((value) => ({
                value,
                label: tLabels(`employmentType.${value}`),
                hint: tLabels(`employmentHint.${value}`),
                // An offer already of that type (made in the app) keeps it.
                disabled: !AVAILABLE_EMPLOYMENT_TYPES.includes(value) && value !== defaultValues.employmentType,
              }))}
            />
            {dated ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FieldLabel>{t("until")}</FieldLabel>
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
                      <FieldLabel optional>{t("time")}</FieldLabel>
                      <FormControl>
                        <Input {...field} type="time" className={FIELD_CLASS} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
            {dated ? (
              <p className="text-muted-foreground text-sm">{t("datedHint")}</p>
            ) : (
              <p className="text-muted-foreground text-sm">{t("openHint")}</p>
            )}
          </Section>

          <Section title={t("place")}>
            <FormField
              control={form.control}
              name="isRemote"
              render={({ field }) => (
                <FormItem>
                  <div role="radiogroup" aria-label={t("place")} className="grid grid-cols-2 gap-2">
                    {[
                      { v: false, l: t("onSite") },
                      { v: true, l: tLabels("offer.remote") },
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
                  label={t("country")}
                  placeholder={t("countryPlaceholder")}
                  options={(countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
                />
                <ComboField
                  control={form.control}
                  name="city"
                  label={t("city")}
                  placeholder={country ? t("cityPlaceholder") : t("cityFirst")}
                  options={(cities ?? []).map((c) => ({ value: c, label: c }))}
                  disabled={!country}
                />
              </div>
            )}
            <TextField control={form.control} name="address" label={t("address")} optional placeholder={t("addressPlaceholder")} />
          </Section>

          <Section title={t("positionsAndPay")}>
            <TextField control={form.control} name="quantity" label={t("quantity")} type="number" min={1} max={100} />
            <TextField control={form.control} name="amount" label={t("amount")} optional type="number" min={1000} placeholder="15000" />
            {amount && (
              <Choice
                control={form.control}
                name="paymentFlow"
                label={t("flow")}
                options={PAYMENT_FLOWS.map((value) => ({ value, label: tLabels(`paymentFlow.${value}`) }))}
              />
            )}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel optional>{t("note")}</FieldLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder={t("notePlaceholder")}
                      className="min-h-24 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          <Section title={t("questions")} optional>
            <FormField
              control={form.control}
              name="questions"
              render={({ field }) => (
                <FormItem>
                  <OfferQuestionsField value={field.value} onChange={field.onChange} language={contentLocale([description, title], locale)} />
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
            categoryName={(id) => {
              const name = categories?.find((c) => c.id === id)?.name;
              return name && trade(name);
            }}
            countryName={(code) => countries?.find((c) => c.code === code)?.name}
          />
          {aside}
        </aside>
      </div>
    </Form>
  );
}

function Section({ title, optional, children }: Readonly<{ title: string; optional?: boolean; children: ReactNode }>) {
  const t = useTranslations("offers.form");
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="shrink-0 font-semibold text-base">
          {title}
          {optional && <span className="font-normal text-muted-foreground"> ({t("optional")})</span>}
        </h2>
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
  const t = useTranslations("offers.form");
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
                  title={o.disabled ? t("soon") : o.hint}
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

/** « 1 234 / 2 500 caractères », red once past the limit. */
function CharacterCount({ length, min, max }: Readonly<{ length: number; min: number; max: number }>) {
  const t = useTranslations("offers.form");
  const locale = useLocale() as Locale;
  const fmt = (n: number) => n.toLocaleString(INTL_LOCALE[locale]);
  return (
    <p
      aria-live="polite"
      className={cn(
        "ml-auto shrink-0 text-muted-foreground text-xs tabular-nums",
        length > max && "font-medium text-destructive",
        length > 0 && length < min && "text-destructive",
      )}
    >
      {t("characters", { length: fmt(length), max: fmt(max) })}
    </p>
  );
}
