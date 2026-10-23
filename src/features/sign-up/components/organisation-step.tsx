"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Skeleton } from "#/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormMessage } from "#/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { useCities } from "#/hooks/use-geo";
import type { BusinessCatalog } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { FIELD_CLASS, FieldLabel, StepActions, StepHeading, TextField } from "./form-bits";

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
  city: "",
  website: "",
  description: "",
};

/**
 * The organisation itself. Categories and the legal forms each one takes come
 * from the catalog the server checks against; choosing a category narrows the
 * legal forms, and clears one that no longer fits.
 */
export function OrganisationStep({
  catalog,
  defaultValues,
  onBack,
  onDone,
}: Readonly<{
  catalog: BusinessCatalog | undefined;
  defaultValues?: OrganisationValues;
  onBack: () => void;
  onDone: (values: OrganisationValues) => void;
}>) {
  const form = useForm<OrganisationValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? EMPTY,
  });
  const category = useWatch({ control: form.control, name: "category" });
  const legalForm = useWatch({ control: form.control, name: "legalForm" });
  const { data: cities } = useCities("CG");

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

  const formLabel = new Map(catalog.legalForms.map((f) => [f.value, f.label]));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onDone)} noValidate className="space-y-8">
        <StepHeading
          title="Votre organisation"
          text="Ces informations apparaissent sur votre profil entreprise et servent à sa vérification."
        />

        <section className="space-y-5">
          <TextField control={form.control} name="name" label="Raison sociale" autoComplete="organization" autoFocus />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              control={form.control}
              name="category"
              label="Type d'organisation"
              placeholder="Choisir…"
              options={catalog.categories.map((c) => ({ value: c.value, label: c.label }))}
              className="sm:col-span-2"
            />
            <SelectField
              control={form.control}
              name="legalForm"
              label="Forme juridique"
              optional
              placeholder={category ? "Choisir…" : "Choisissez d'abord le type"}
              disabled={!category}
              options={allowedForms.map((value) => ({ value, label: formLabel.get(value) ?? value }))}
            />
            <SelectField
              control={form.control}
              name="size"
              label="Effectif"
              optional
              placeholder="Choisir…"
              options={catalog.sizes.map((s) => ({ value: s, label: `${s} salariés` }))}
            />
          </div>
        </section>

        <section className="space-y-5">
          <p className="font-semibold text-sm">
            Identifiants officiels <span className="font-normal text-muted-foreground">(facultatif)</span>
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField control={form.control} name="registrationNumber" label="N° RCCM" placeholder="CG-BZV-…" />
            <TextField control={form.control} name="taxId" label="NIU" />
            <TextField control={form.control} name="statisticalId" label="SCIEN / SCIET" />
          </div>
        </section>

        <section className="space-y-5">
          <p className="font-semibold text-sm">Siège et présentation</p>
          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            <TextField control={form.control} name="address" label="Adresse" autoComplete="street-address" placeholder="Rue, quartier, arrondissement" />
            <SelectField
              control={form.control}
              name="city"
              label="Ville"
              placeholder="Choisir…"
              options={(cities ?? []).map((c) => ({ value: c, label: c }))}
            />
          </div>
          <TextField control={form.control} name="website" label="Site web" optional type="url" placeholder="https://" />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FieldLabel optional>Présentation</FieldLabel>
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
        </section>

        <StepActions onBack={onBack} />
      </form>
    </Form>
  );
}

function SelectField({
  control,
  name,
  label,
  placeholder,
  options,
  optional: isOptional,
  disabled,
  className,
}: Readonly<{
  control: Control<OrganisationValues>;
  name: FieldPath<OrganisationValues>;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  optional?: boolean;
  disabled?: boolean;
  className?: string;
}>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel optional={isOptional}>{label}</FieldLabel>
          <Select value={field.value || ""} onValueChange={field.onChange} disabled={disabled}>
            <FormControl>
              <SelectTrigger className={cn(FIELD_CLASS, "w-full data-[size=default]:h-12")}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-80 rounded-xl border-0 shadow-soft">
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value} className="rounded-lg py-2">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
