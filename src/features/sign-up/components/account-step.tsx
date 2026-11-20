"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { Form } from "#/components/ui/form";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { FormError, StepActions, StepHeading, TextField } from "./form-bits";

/** The account holder's fields, with the reader's sentences (signUp.account.*). */
const accountSchema = (t: (key: "firstNameRequired" | "lastNameRequired" | "emailInvalid" | "phoneInvalid") => string) =>
  z.object({
    firstName: z.string().trim().min(1, t("firstNameRequired")).max(100),
    lastName: z.string().trim().min(1, t("lastNameRequired")).max(100),
    email: z.email(t("emailInvalid")).trim().toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s.-]{8,20}$/, t("phoneInvalid")),
  });

export type AccountValues = z.infer<ReturnType<typeof accountSchema>>;

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
  const t = useTranslations("signUp.account");
  const friendlyError = useFriendlyError();
  const schema = useMemo(() => accountSchema(t), [t]);
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
      setError(friendlyError(err, t("sendFailed")));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-8">
        <StepHeading
          title={t("title")}
          text={t("text")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField control={form.control} name="firstName" label={t("firstName")} autoComplete="given-name" placeholder={t("firstNamePlaceholder")} autoFocus />
          <TextField control={form.control} name="lastName" label={t("lastName")} autoComplete="family-name" placeholder={t("lastNamePlaceholder")} />
          <TextField
            control={form.control}
            name="email"
            label={t("email")}
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className="sm:col-span-2"
          />
          <TextField
            control={form.control}
            name="phone"
            label={t("phone")}
            type="tel"
            autoComplete="tel"
            // The organisation's country, chosen next, gives the prefix.
            placeholder={t("phonePlaceholder")}
            className="sm:col-span-2"
          />
        </div>
        <FormError message={error} />
        <StepActions continueLabel={t("submit")} pending={form.formState.isSubmitting} />
      </form>
    </Form>
  );
}
