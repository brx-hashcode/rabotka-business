"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconCheck, IconCircleCheck } from "@tabler/icons-react";
import { Loader } from "lucide-react";

import { Button } from "#/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "#/components/ui/form";
import { Textarea } from "#/components/ui/textarea";
import { Combobox } from "#/features/sign-up/components/combobox";
import { FIELD_CLASS, FieldLabel, TextField } from "#/features/sign-up/components/form-bits";
import type { BusinessCountryName } from "#/lib/api/catalog-server";
import { friendlyError } from "#/lib/api/friendly-error";
import { requestDemo } from "#/lib/api/public-controller";
import { dialCode } from "#/lib/phone";
import { cn } from "#/lib/utils";
import { DEMO_INTERESTS, DEMO_SIZES } from "../demo-options";

const required = (message: string, max = 120) => z.string().trim().min(1, message).max(max);

const schema = z.object({
  firstName: required("Indiquez votre prénom.", 80),
  lastName: required("Indiquez votre nom.", 80),
  email: z.string().trim().email("Cet e-mail ne semble pas valide."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9 ().-]{6,20}$/, "Ce numéro ne semble pas valide."),
  company: required("Indiquez le nom de votre entreprise."),
  jobTitle: required("Indiquez votre fonction."),
  country: z.string().length(2, "Choisissez votre pays."),
  companySize: z
    .string()
    .refine((v) => (DEMO_SIZES as readonly string[]).includes(v), "Choisissez la taille de votre entreprise."),
  interests: z.array(z.string()),
  message: z.string().trim().max(2000, "Votre message est trop long (2 000 caractères au plus)."),
  website: z.string(),
});

type DemoValues = z.input<typeof schema>;

/**
 * « Demander une démo »: who they are, their company, what they want to see.
 * Sent once, then replaced by the confirmation — never back to an empty form.
 */
export function DemoForm({ countries }: Readonly<{ countries: BusinessCountryName[] }>) {
  const [sent, setSent] = useState<{ firstName: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DemoValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      country: countries[0]?.code ?? "CG",
      companySize: "",
      interests: [],
      message: "",
      website: "",
    },
  });
  const country = useWatch({ control: form.control, name: "country" });
  const pending = form.formState.isSubmitting;

  async function onSubmit(values: DemoValues) {
    setError(null);
    try {
      const v = schema.parse(values);
      await requestDemo({
        ...v,
        phone: `${dialCode(v.country)} ${v.phone}`,
        message: v.message || undefined,
        website: v.website || undefined,
      });
      setSent({ firstName: v.firstName, email: v.email });
    } catch (err) {
      setError(friendlyError(err, "Votre demande n'a pas pu être envoyée. Réessayez dans un instant."));
    }
  }

  if (sent) return <DemoSent firstName={sent.firstName} email={sent.email} />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative space-y-5 rounded-3xl bg-card p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="firstName" label="Prénom" autoComplete="given-name" />
          <TextField control={form.control} name="lastName" label="Nom" autoComplete="family-name" />
        </div>
        <TextField
          control={form.control}
          name="email"
          label="E-mail professionnel"
          type="email"
          autoComplete="email"
          placeholder="prenom.nom@entreprise.com"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="company" label="Entreprise" autoComplete="organization" />
          <TextField control={form.control} name="jobTitle" label="Fonction" autoComplete="organization-title" placeholder="Responsable RH, gérant…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="country"
            render={({ field, fieldState }) => (
              <FormItem>
                <FieldLabel>Pays</FieldLabel>
                <Combobox
                  value={field.value}
                  onChange={field.onChange}
                  options={countries.map((c) => ({ value: c.code, label: c.name }))}
                  placeholder="Choisissez votre pays"
                  invalid={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <TextField
            control={form.control}
            name="phone"
            label="Téléphone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            prefix={dialCode(country)}
          />
        </div>

        <FormField
          control={form.control}
          name="companySize"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>Taille de l&apos;entreprise</FieldLabel>
              <div role="radiogroup" aria-label="Taille de l'entreprise" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DEMO_SIZES.map((size) => {
                  const active = field.value === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(size)}
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interests"
          render={({ field }) => (
            <FormItem>
              <FieldLabel optional>Ce qui vous intéresse</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {DEMO_INTERESTS.map((interest) => {
                  const active = field.value.includes(interest.value);
                  return (
                    <button
                      key={interest.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        field.onChange(
                          active ? field.value.filter((v) => v !== interest.value) : [...field.value, interest.value],
                        )
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors",
                        active ? "bg-ink text-white" : "bg-page hover:bg-page/70",
                      )}
                    >
                      {active && <IconCheck className="size-3.5" strokeWidth={3} />}
                      {interest.label}
                    </button>
                  );
                })}
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FieldLabel optional>Message</FieldLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  maxLength={2000}
                  placeholder="Les postes à pourvoir, le nombre de recrutements par an, vos outils actuels…"
                  className={cn(FIELD_CLASS, "h-auto min-h-28 py-3")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hidden from people: only a bot fills it. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Site web
            <input type="text" tabIndex={-1} autoComplete="off" {...form.register("website")} />
          </label>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-destructive text-sm">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <Button
            type="submit"
            variant="ghost"
            disabled={pending}
            aria-busy={pending || undefined}
            className="h-12 w-full rounded-full bg-ink text-[15px] text-white hover:bg-ink/90 disabled:opacity-100 sm:h-12 sm:text-[15px]"
          >
            {pending ? <Loader aria-label="Envoi" className="size-5 animate-spin text-white" /> : "Demander ma démo"}
          </Button>
          <p className="text-center text-muted-foreground text-xs">
            Vos informations servent uniquement à vous recontacter au sujet de Rabotka Business. Voir notre{" "}
            <a href="https://www.rabotka.work/privacy" className="underline underline-offset-2">
              politique de confidentialité
            </a>
            .
          </p>
        </div>
      </form>
    </Form>
  );
}

function DemoSent({ firstName, email }: Readonly<{ firstName: string; email: string }>) {
  return (
    <div role="status" className="space-y-5 rounded-3xl bg-card p-6 text-center sm:p-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-chip-green text-chip-green-foreground">
        <IconCircleCheck className="size-7" />
      </span>
      <h2 className="font-semibold text-2xl tracking-tight">Merci {firstName}, votre demande est envoyée</h2>
      <p className="text-muted-foreground">
        Un membre de notre équipe vous recontacte sous 24 h ouvrées pour convenir d&apos;un créneau. Une confirmation
        vient de partir à <span className="font-medium text-foreground">{email}</span>.
      </p>
      <Button
        variant="ghost"
        render={<Link href="/fonctionnalites" />}
        className="h-11 rounded-full bg-page px-5 hover:bg-page/70"
      >
        Découvrir les fonctionnalités en attendant
      </Button>
    </div>
  );
}
