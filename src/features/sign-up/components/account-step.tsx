"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Form } from "#/components/ui/form";
import { friendlyError } from "#/lib/api/friendly-error";
import { FormError, StepActions, StepHeading, TextField } from "./form-bits";

const schema = z.object({
  firstName: z.string().trim().min(1, "Indiquez votre prénom").max(100),
  lastName: z.string().trim().min(1, "Indiquez votre nom").max(100),
  email: z.email("Saisissez une adresse email valide").trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s.-]{8,20}$/, "Saisissez un numéro de téléphone valide"),
});

export type AccountValues = z.infer<typeof schema>;

/**
 * Who holds the account, and the professional email it signs in with. The
 * wizard sends the code on submit (or not, when the email was already
 * verified); the phone is kept for the profile, unverified.
 */
export function AccountStep({
  defaultValues,
  onDone,
}: Readonly<{
  defaultValues?: AccountValues;
  onDone: (values: AccountValues) => Promise<void>;
}>) {
  const form = useForm<AccountValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { firstName: "", lastName: "", email: "", phone: "" },
  });
  const [error, setError] = useState<string | null>(null);

  async function submit(values: AccountValues) {
    setError(null);
    try {
      await onDone(values);
    } catch (err) {
      setError(friendlyError(err, "Impossible d'envoyer le code. Réessayez."));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-8">
        <StepHeading
          title="Créez votre compte entreprise"
          text="Commencez par le responsable du compte. Un code de vérification sera envoyé à son adresse professionnelle."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="firstName" label="Prénom" autoComplete="given-name" autoFocus />
          <TextField control={form.control} name="lastName" label="Nom" autoComplete="family-name" />
          <TextField
            control={form.control}
            name="email"
            label="Adresse email professionnelle"
            type="email"
            autoComplete="email"
            placeholder="prenom.nom@organisation.cg"
            className="sm:col-span-2"
          />
          <TextField
            control={form.control}
            name="phone"
            label="Téléphone"
            type="tel"
            autoComplete="tel"
            prefix="+242"
            placeholder="06 123 45 67"
            className="sm:col-span-2"
          />
        </div>
        <FormError message={error} />
        <StepActions continueLabel="Recevoir le code" pending={form.formState.isSubmitting} />
      </form>
    </Form>
  );
}
