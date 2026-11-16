"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useForm, useWatch, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";

import { Skeleton } from "#/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormMessage } from "#/components/ui/form";
import { Textarea } from "#/components/ui/textarea";
import { useBusinessCatalog } from "#/hooks/use-business-catalog";
import { useCities } from "#/hooks/use-geo";
import type { Locale } from "#/i18n/config";
import { cn } from "#/lib/utils";
import { IDENTIFIER_KEYS, officialIdentifiers } from "../required-documents";
import { Combobox, type ComboboxOption } from "./combobox";
import { FieldLabel, StepActions, StepHeading, TextField } from "./form-bits";

const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

type SchemaMessage = "nameRequired" | "categoryRequired" | "countryRequired" | "websiteInvalid";

/** The organisation's fields, with the reader's sentences (signUp.organisation.*). */
const organisationSchema = (t: (key: SchemaMessage) => string) => z.object({
  name: z.string().trim().min(2, t("nameRequired")).max(200),
  category: z.string().min(1, t("categoryRequired")),
  legalForm: optional(40),
  size: optional(10),
  registrationNumber: optional(100),
  taxId: optional(100),
  statisticalId: optional(100),
  // An organisation that works online has no address, and may have no city;
  // it still has a country.
  address: optional(500),
  country: z.string().length(2, t("countryRequired")),
  city: optional(120),
  website: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\/\S+\.\S+/.test(v), t("websiteInvalid"))
    .optional(),
  description: optional(2000),
});

export type OrganisationValues = z.infer<ReturnType<typeof organisationSchema>>;

/**
 * The countries to choose from, plus the organisation's own when sign-up has
 * closed there since (Chad…): it still reads, under its name in `locale`.
 */
export function countryOptions(
  open: readonly { code: string; name: string }[],
  current: string | null | undefined,
  locale: Locale = "fr",
): ComboboxOption[] {
  const options = open.map((c) => ({ value: c.code, label: c.name }));
  const code = current?.toUpperCase();
  if (!code || options.some((o) => o.value === code)) return options;
  let label = code;
  try {
    label = new Intl.DisplayNames(locale, { type: "region" }).of(code) ?? code;
  } catch {
    // An engine without region names: the code.
  }
  return [...options, { value: code, label }];
}

/** A blank organisation in the visitor's country, when Business is open there. */
export function emptyOrganisation(country: string | null | undefined, open: readonly { code: string }[] | undefined) {
  const code = country?.toUpperCase();
  return code && open?.some((c) => c.code === code) ? { ...EMPTY_ORGANISATION, country: code } : EMPTY_ORGANISATION;
}

export const EMPTY_ORGANISATION: OrganisationValues = {
  name: "",
  category: "",
  legalForm: "",
  size: "",
  registrationNumber: "",
  taxId: "",
  statisticalId: "",
  address: "",
  // The sign-up suggests the visitor's own (`emptyOrganisation`); this one
  // only when it cannot tell.
  country: "CG",
  city: "",
  website: "",
  description: "",
};

type CategoryGroup = "companies" | "associations" | "education" | "health" | "public" | "other";

/**
 * How the type list is grouped in the picker (signUp.organisation.groups.*).
 * Presentation only: the values and labels come from the catalog, and a
 * value missing here lands in « Autres » rather than disappearing.
 */
const CATEGORY_GROUPS: Record<string, CategoryGroup> = {
  INDIVIDUAL_BUSINESS: "companies",
  TPE: "companies",
  PME: "companies",
  LARGE_COMPANY: "companies",
  STARTUP: "companies",
  COOPERATIVE: "companies",
  GIE: "companies",
  ASSOCIATION: "associations",
  NGO: "associations",
  INTERNATIONAL_NGO: "associations",
  FOUNDATION: "associations",
  RELIGIOUS: "associations",
  SCHOOL: "education",
  HIGHER_EDUCATION: "education",
  TRAINING_CENTER: "education",
  HEALTH: "health",
  PUBLIC_ADMINISTRATION: "public",
  PUBLIC_ENTERPRISE: "public",
  INTERNATIONAL_ORG: "public",
};

/**
 * The organisation itself. Types and the legal forms each takes come from
 * the catalog the server checks against; choosing a type narrows the legal
 * forms, and clears one that no longer fits. The country (one of those the
 * catalog lists, where the organisation can pay) is required, and names the
 * official identifiers.
 *
 * Also the dashboard's edit form (/espace/organisation): no heading, no
 * back button, its own submit label.
 */
export function OrganisationStep({
  defaultValues,
  onBack,
  onDone,
  heading = true,
  submitLabel,
  pending,
  lockIdentity,
}: Readonly<{
  defaultValues?: OrganisationValues;
  onBack?: () => void;
  onDone: (values: OrganisationValues) => void;
  heading?: boolean;
  submitLabel?: string;
  pending?: boolean;
  /** Verified: what the review checked shows, but no longer changes here. */
  lockIdentity?: boolean;
}>) {
  const t = useTranslations("signUp.organisation");
  const tForm = useTranslations("signUp.form");
  const locale = useLocale();
  const schema = useMemo(() => organisationSchema(t), [t]);
  const form = useForm<OrganisationValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? EMPTY_ORGANISATION,
  });
  const category = useWatch({ control: form.control, name: "category" });
  const legalForm = useWatch({ control: form.control, name: "legalForm" });
  const country = useWatch({ control: form.control, name: "country" });
  // The countries and their papers from the catalog; the cities from the
  // backend's public geo API (as the agent app's picker).
  const catalog = useBusinessCatalog(country);
  const { data: cities } = useCities(country);
  const city = useWatch({ control: form.control, name: "city" });
  useEffect(() => {
    // A city from the previous country is not one of this country's.
    if (cities && city && !cities.includes(city)) form.setValue("city", "");
  }, [cities, city, form]);

  const allowedForms = useMemo(
    () => catalog?.categories.find((c) => c.value === category)?.legalForms ?? [],
    [catalog, category],
  );
  useEffect(() => {
    // Only once the catalog is here: before, every form looks disallowed.
    if (catalog && legalForm && !allowedForms.includes(legalForm)) form.setValue("legalForm", "");
  }, [catalog, allowedForms, legalForm, form]);

  const identifiers = catalog?.country === country ? catalog.identifiers : undefined;
  const statisticalId = useWatch({ control: form.control, name: "statisticalId" });
  useEffect(() => {
    // A country without the identifier: a number typed for another stays out.
    if (!lockIdentity && identifiers && !identifiers.statisticalId && statisticalId) form.setValue("statisticalId", "");
  }, [identifiers, statisticalId, lockIdentity, form]);

  if (!catalog) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-3/4 rounded-xl" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  const categoryOptions: ComboboxOption[] = catalog.categories.map((c) => ({
    value: c.value,
    label: c.label,
    group: t(`groups.${CATEGORY_GROUPS[c.value] ?? "other"}`),
  }));
  const formLabel = new Map(catalog.legalForms.map((f) => [f.value, f.label]));
  const legalFormOptions = allowedForms.map((value) => ({ value, label: formLabel.get(value) ?? value }));
  // The numbers its type carries (no N° RCCM for an association), required
  // with the papers it must send. Before a type is chosen: the country's all.
  const categoryDocuments = catalog.categories.find((c) => c.value === category)?.documents;
  const fieldsHere = identifiers ?? catalog.identifiers;
  const officialFields = categoryDocuments
    ? officialIdentifiers(categoryDocuments, legalForm, fieldsHere)
    : Object.fromEntries(IDENTIFIER_KEYS.map((k) => [k, fieldsHere[k] && { ...fieldsHere[k], required: false }]));
  // Shown while filled once verified, even where the type has none: it stays visible.
  const shownIdentifiers = IDENTIFIER_KEYS.filter((k) => officialFields[k] || (lockIdentity && form.getValues(k)));
  const anyRequired = !lockIdentity && shownIdentifiers.some((k) => officialFields[k]?.required);

  function submit(values: OrganisationValues) {
    if (!lockIdentity) {
      const missing = IDENTIFIER_KEYS.filter((k) => officialFields[k]?.required && !values[k]?.trim());
      for (const k of missing) {
        form.setError(k, { message: t("identifierRequired", { label: officialFields[k]?.label ?? "" }) }, { shouldFocus: k === missing[0] });
      }
      if (missing.length > 0) return;
    }
    onDone(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-10">
        {heading && <StepHeading
          title={t("title")}
          text={t("text")}
        />}

        <Section title={t("identity")} note={lockIdentity ? t("verified") : undefined}>
          <TextField
            control={form.control}
            name="name"
            label={t("name")}
            autoComplete="organization"
            autoFocus={heading}
            disabled={lockIdentity}
          />
          <ComboboxField
            control={form.control}
            name="category"
            label={t("category")}
            placeholder={t("categoryPlaceholder")}
            searchPlaceholder={t("categorySearch")}
            options={categoryOptions}
            disabled={lockIdentity}
          />
          <ComboboxField
            control={form.control}
            name="legalForm"
            label={t("legalForm")}
            optional
            placeholder={category ? t("legalFormPlaceholder") : t("legalFormFirst")}
            disabled={lockIdentity || !category}
            options={legalFormOptions}
          />
          <SizeField control={form.control} sizes={catalog.sizes} />
        </Section>

        {shownIdentifiers.length > 0 && (
          <Section
            title={t("identifiers")}
            note={lockIdentity ? t("verifiedPlural") : anyRequired ? undefined : tForm("optional")}
            text={lockIdentity ? undefined : anyRequired ? t("identifiersRequired") : t("identifiersOptional")}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {shownIdentifiers.map((name) => {
                const field = officialFields[name];
                return (
                  <TextField
                    key={name}
                    control={form.control}
                    name={name}
                    label={field?.label ?? t("statisticalId")}
                    // Facultatif beside required ones; all are when none is.
                    optional={!lockIdentity && anyRequired && !field?.required}
                    className={shownIdentifiers.length % 2 === 1 && name === shownIdentifiers.at(-1) ? "sm:col-span-2" : undefined}
                    placeholder={lockIdentity ? t("notProvided") : field?.placeholder}
                    disabled={lockIdentity}
                  />
                );
              })}
            </div>
          </Section>
        )}

        <Section title={t("headOffice")} text={t("headOfficeText")}>
          <TextField
            control={form.control}
            name="address"
            label={t("address")}
            optional
            autoComplete="street-address"
            placeholder={t("addressPlaceholder")}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <ComboboxField
              control={form.control}
              name="country"
              label={t("country")}
              placeholder={t("countryPlaceholder")}
              searchPlaceholder={t("countrySearch")}
              // Its papers are that country's: verified, it changes on request (Aide).
              disabled={lockIdentity}
              options={countryOptions(catalog.countries, defaultValues?.country, locale)}
            />
            <ComboboxField
              control={form.control}
              name="city"
              label={t("city")}
              optional
              placeholder={country ? t("cityPlaceholder") : t("cityFirst")}
              searchPlaceholder={t("citySearch")}
              disabled={!country}
              options={(cities ?? []).map((c) => ({ value: c, label: c }))}
            />
          </div>
        </Section>

        <Section title={t("presentation")} note={tForm("optional")}>
          <TextField control={form.control} name="website" label={t("website")} type="url" placeholder="https://" />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FieldLabel>{t("description")}</FieldLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder={t("descriptionPlaceholder")}
                    className="min-h-28 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px] focus-visible:ring-2 focus-visible:ring-whatsapp/40"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <StepActions onBack={onBack} continueLabel={submitLabel} pending={pending} />
      </form>
    </Form>
  );
}

/** A titled group of fields, with a hairline running from its title. */
function Section({
  title,
  note,
  text,
  children,
}: Readonly<{ title: string; note?: string; text?: string; children: ReactNode }>) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="shrink-0 font-semibold text-base">
            {title}
            {note && <span className="font-normal text-muted-foreground"> ({note})</span>}
          </h2>
          <span aria-hidden className="h-px flex-1 bg-page" />
        </div>
        {text && <p className="text-muted-foreground text-sm">{text}</p>}
      </div>
      {children}
    </section>
  );
}

function ComboboxField({
  control,
  name,
  label,
  optional: isOptional,
  ...combobox
}: Readonly<{
  control: Control<OrganisationValues>;
  name: FieldPath<OrganisationValues>;
  label: string;
  optional?: boolean;
  placeholder: string;
  searchPlaceholder?: string;
  options: ComboboxOption[];
  disabled?: boolean;
}>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FieldLabel optional={isOptional}>{label}</FieldLabel>
          <Combobox
            value={field.value ?? ""}
            onChange={field.onChange}
            invalid={!!fieldState.error}
            clearable={isOptional}
            {...combobox}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** The headcount brackets as a row of choices: four options need no list. */
function SizeField({ control, sizes }: Readonly<{ control: Control<OrganisationValues>; sizes: string[] }>) {
  const t = useTranslations("signUp.organisation");
  return (
    <FormField
      control={control}
      name="size"
      render={({ field }) => (
        <FormItem>
          <FieldLabel optional>{t("size")}</FieldLabel>
          <div role="radiogroup" aria-label={t("size")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {sizes.map((size) => {
              const active = field.value === size;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => field.onChange(active ? "" : size)}
                  className={cn(
                    "flex h-12 flex-col items-center justify-center rounded-xl text-sm transition-colors",
                    active ? "bg-ink text-white" : "bg-page hover:bg-page/70",
                  )}
                >
                  <span className="font-semibold">{size}</span>
                  <span className={cn("text-[11px] leading-none", active ? "text-white/70" : "text-muted-foreground")}>
                    {t("employees")}
                  </span>
                </button>
              );
            })}
          </div>
        </FormItem>
      )}
    />
  );
}
