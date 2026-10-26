"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useForm, useWatch, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Skeleton } from "#/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormMessage } from "#/components/ui/form";
import { Textarea } from "#/components/ui/textarea";
import { useCities, useCountries } from "#/hooks/use-geo";
import type { BusinessCatalog } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { Combobox, type ComboboxOption } from "./combobox";
import { FieldLabel, StepActions, StepHeading, TextField } from "./form-bits";

const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const schema = z.object({
  name: z.string().trim().min(2, "Indiquez la raison sociale").max(200),
  category: z.string().min(1, "Choisissez le type d'organisation"),
  legalForm: optional(40),
  size: optional(10),
  registrationNumber: optional(100),
  taxId: optional(100),
  statisticalId: optional(100),
  address: z.string().trim().min(3, "Indiquez l'adresse").max(500),
  country: z.string().length(2, "Choisissez le pays"),
  city: z.string().min(1, "Choisissez la ville"),
  website: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\/\S+\.\S+/.test(v), "Adresse web complète, avec https://")
    .optional(),
  description: optional(2000),
});

export type OrganisationValues = z.infer<typeof schema>;

const EMPTY: OrganisationValues = {
  name: "",
  category: "",
  legalForm: "",
  size: "",
  registrationNumber: "",
  taxId: "",
  statisticalId: "",
  address: "",
  // Congo-Brazzaville first: the catalog's types and papers are Congo's.
  country: "CG",
  city: "",
  website: "",
  description: "",
};

/**
 * How the type list is grouped in the picker. Presentation only: the values
 * and labels come from the catalog, and a value missing here lands in
 * « Autres » rather than disappearing.
 */
const CATEGORY_GROUPS: Record<string, string> = {
  INDIVIDUAL_BUSINESS: "Entreprises",
  TPE: "Entreprises",
  PME: "Entreprises",
  LARGE_COMPANY: "Entreprises",
  STARTUP: "Entreprises",
  COOPERATIVE: "Entreprises",
  GIE: "Entreprises",
  ASSOCIATION: "Associations et ONG",
  NGO: "Associations et ONG",
  INTERNATIONAL_NGO: "Associations et ONG",
  FOUNDATION: "Associations et ONG",
  RELIGIOUS: "Associations et ONG",
  SCHOOL: "Enseignement et formation",
  HIGHER_EDUCATION: "Enseignement et formation",
  TRAINING_CENTER: "Enseignement et formation",
  HEALTH: "Santé",
  PUBLIC_ADMINISTRATION: "Secteur public et international",
  PUBLIC_ENTERPRISE: "Secteur public et international",
  INTERNATIONAL_ORG: "Secteur public et international",
};

/**
 * The organisation itself. Types and the legal forms each takes come from
 * the catalog the server checks against; choosing a type narrows the legal
 * forms, and clears one that no longer fits.
 *
 * Also the dashboard's edit form (/espace/organisation): no heading, no
 * back button, its own submit label.
 */
export function OrganisationStep({
  catalog,
  defaultValues,
  onBack,
  onDone,
  heading = true,
  submitLabel,
  pending,
  lockIdentity,
}: Readonly<{
  catalog: BusinessCatalog | undefined;
  defaultValues?: OrganisationValues;
  onBack?: () => void;
  onDone: (values: OrganisationValues) => void;
  heading?: boolean;
  submitLabel?: string;
  pending?: boolean;
  /** Verified: what the review checked shows, but no longer changes here. */
  lockIdentity?: boolean;
}>) {
  const form = useForm<OrganisationValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? EMPTY,
  });
  const category = useWatch({ control: form.control, name: "category" });
  const legalForm = useWatch({ control: form.control, name: "legalForm" });
  const country = useWatch({ control: form.control, name: "country" });
  // Both lists from the backend's public geo API (as the agent app's picker).
  const { data: countries } = useCountries();
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
    group: CATEGORY_GROUPS[c.value] ?? "Autres",
  }));
  const formLabel = new Map(catalog.legalForms.map((f) => [f.value, f.label]));
  const legalFormOptions = allowedForms.map((value) => ({ value, label: formLabel.get(value) ?? value }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onDone)} noValidate className="space-y-10">
        {heading && <StepHeading
          title="Votre organisation"
          text="Ces informations apparaissent sur votre profil entreprise et servent à sa vérification."
        />}

        <Section title="Identité" note={lockIdentity ? "vérifiée" : undefined}>
          <TextField
            control={form.control}
            name="name"
            label="Raison sociale"
            autoComplete="organization"
            autoFocus={heading}
            disabled={lockIdentity}
          />
          <ComboboxField
            control={form.control}
            name="category"
            label="Type d'organisation"
            placeholder="Choisir le type d'organisation"
            searchPlaceholder="Rechercher : PME, école, ONG…"
            options={categoryOptions}
            disabled={lockIdentity}
          />
          <ComboboxField
            control={form.control}
            name="legalForm"
            label="Forme juridique"
            optional
            placeholder={category ? "Choisir la forme juridique" : "Choisissez d'abord le type"}
            disabled={lockIdentity || !category}
            options={legalFormOptions}
          />
          <SizeField control={form.control} sizes={catalog.sizes} />
        </Section>

        <Section
          title="Identifiants officiels"
          note={lockIdentity ? "vérifiés" : "facultatif"}
          text={lockIdentity ? undefined : "Ils facilitent la vérification de votre organisation."}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="registrationNumber"
              label="N° RCCM"
              placeholder={lockIdentity ? "Non renseigné" : "CG-BZV-01-2024-B12-00123"}
              disabled={lockIdentity}
            />
            <TextField
              control={form.control}
              name="taxId"
              label="NIU"
              placeholder={lockIdentity ? "Non renseigné" : "M2024000123456A"}
              disabled={lockIdentity}
            />
            <TextField
              control={form.control}
              name="statisticalId"
              label="SCIEN / SCIET"
              className="sm:col-span-2"
              placeholder={lockIdentity ? "Non renseigné" : undefined}
              disabled={lockIdentity}
            />
          </div>
        </Section>

        <Section title="Siège">
          <TextField control={form.control} name="address" label="Adresse" autoComplete="street-address" placeholder="Rue, quartier, arrondissement" />
          <div className="grid gap-5 sm:grid-cols-2">
            <ComboboxField
              control={form.control}
              name="country"
              label="Pays"
              placeholder="Choisir le pays"
              searchPlaceholder="Rechercher un pays"
              options={(countries ?? []).map((c) => ({ value: c.code, label: c.name }))}
            />
            <ComboboxField
              control={form.control}
              name="city"
              label="Ville"
              placeholder={country ? "Choisir la ville" : "Choisissez d'abord le pays"}
              searchPlaceholder="Rechercher une ville"
              disabled={!country}
              options={(cities ?? []).map((c) => ({ value: c, label: c }))}
            />
          </div>
        </Section>

        <Section title="Présentation" note="facultatif">
          <TextField control={form.control} name="website" label="Site web" type="url" placeholder="https://" />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Présentation de l&apos;organisation</FieldLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="Activité, missions, valeurs : ce que les candidats doivent savoir de vous."
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
          <Combobox value={field.value ?? ""} onChange={field.onChange} invalid={!!fieldState.error} {...combobox} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** The headcount brackets as a row of choices: four options need no list. */
function SizeField({ control, sizes }: Readonly<{ control: Control<OrganisationValues>; sizes: string[] }>) {
  return (
    <FormField
      control={control}
      name="size"
      render={({ field }) => (
        <FormItem>
          <FieldLabel optional>Effectif</FieldLabel>
          <div role="radiogroup" aria-label="Effectif" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                    salariés
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
