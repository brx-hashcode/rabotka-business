"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconCheck } from "@tabler/icons-react";
import { Loader } from "lucide-react";

import { Illustration } from "#/components/illustration";
import { LocalLink as Link } from "#/components/local-link";
import { Button } from "#/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "#/components/ui/form";
import { Textarea } from "#/components/ui/textarea";
import { Combobox } from "#/features/sign-up/components/combobox";
import { FIELD_CLASS, FieldLabel, TextField } from "#/features/sign-up/components/form-bits";
import type { BusinessCountryName } from "#/lib/api/catalog-server";
import { countryName } from "#/features/landing/country-name";
import type { Locale } from "#/i18n/config";
import type { Translator } from "#/i18n/translator";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { requestDemo } from "#/lib/api/public-controller";
import { dialCode } from "#/lib/phone";
import { cn } from "#/lib/utils";
import { DEMO_INTERESTS, DEMO_SIZES } from "../demo-options";

const required = (message: string, max = 120) => z.string().trim().min(1, message).max(max);

/** The demo request's fields, with the reader's sentences (site.demoForm.*). */
const demoSchema = (t: Translator<"site.demoForm">) =>
  z.object({
    lastName: required(t("lastNameRequired"), 80),
    firstName: required(t("firstNameRequired"), 80),
    email: z.string().trim().email(t("emailInvalid")),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9 ().-]{6,20}$/, t("phoneInvalid")),
    company: required(t("companyRequired")),
    jobTitle: required(t("jobTitleRequired")),
    country: z.string().length(2, t("countryRequired")),
    companySize: z.string().refine((v) => (DEMO_SIZES as readonly string[]).includes(v), t("sizeRequired")),
    interests: z.array(z.string()),
    message: z.string().trim().max(2000, t("messageTooLong")),
    website: z.string(),
  });

type DemoValues = z.input<ReturnType<typeof demoSchema>>;

/**
 * « Demander une démo »: who they are, their company, what they want to see.
 * Sent once, then replaced by the confirmation — never back to an empty form.
 */
export function DemoForm({ countries }: Readonly<{ countries: BusinessCountryName[] }>) {
  const [sent, setSent] = useState<{ firstName: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("site.demoForm");
  const locale = useLocale() as Locale;
  const friendlyError = useFriendlyError();
  const schema = useMemo(() => demoSchema(t), [t]);

  const form = useForm<DemoValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lastName: "",
      firstName: "",
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
      setError(friendlyError(err, t("failed")));
    }
  }

  if (sent) return <DemoSent firstName={sent.firstName} email={sent.email} />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative space-y-5 rounded-3xl bg-card p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="firstName" label={t("firstName")} autoComplete="given-name" placeholder={t("firstNamePlaceholder")} />
          <TextField control={form.control} name="lastName" label={t("lastName")} autoComplete="family-name" placeholder={t("lastNamePlaceholder")} />
        </div>
        <TextField
          control={form.control}
          name="email"
          label={t("email")}
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="company" label={t("company")} autoComplete="organization" placeholder={t("companyPlaceholder")} />
          <TextField control={form.control} name="jobTitle" label={t("jobTitle")} autoComplete="organization-title" placeholder={t("jobTitlePlaceholder")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="country"
            render={({ field, fieldState }) => (
              <FormItem>
                <FieldLabel>{t("country")}</FieldLabel>
                <Combobox
                  value={field.value}
                  onChange={field.onChange}
                  options={countries.map((c) => ({ value: c.code, label: countryName(c, locale) }))}
                  placeholder={t("countryPlaceholder")}
                  invalid={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <TextField
            control={form.control}
            name="phone"
            label={t("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            prefix={dialCode(country)}
            placeholder={t("phonePlaceholder")}
          />
        </div>

        <FormField
          control={form.control}
          name="companySize"
          render={({ field }) => (
            <FormItem>
              <FieldLabel>{t("size")}</FieldLabel>
              <div role="radiogroup" aria-label={t("size")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                        {t("employees")}
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
              <FieldLabel optional>{t("interests")}</FieldLabel>
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
                      {t(`interestOptions.${interest.value}`)}
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
              <FieldLabel optional>{t("message")}</FieldLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  maxLength={2000}
                  placeholder={t("messagePlaceholder")}
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
            {pending ? <Loader aria-label={t("sending")} className="size-5 animate-spin text-white" /> : t("submit")}
          </Button>
          <p className="text-center text-muted-foreground text-xs">
            {t.rich("privacy", {
              link: (chunks) => (
                <a href="https://www.rabotka.work/privacy" className="underline underline-offset-2">
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </form>
    </Form>
  );
}

function DemoSent({ firstName, email }: Readonly<{ firstName: string; email: string }>) {
  const t = useTranslations("site.demoForm");
  return (
    <div role="status" className="space-y-5 rounded-3xl bg-card p-6 text-center sm:p-10">
      <Illustration name="sent" className="mx-auto h-40 w-auto" />
      <h2 className="font-semibold text-2xl tracking-tight">{t("sentTitle", { firstName })}</h2>
      <p className="text-muted-foreground">
        {t.rich("sentText", { email, strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span> })}
      </p>
      <Button
        variant="ghost"
        render={<Link href="/fonctionnalites" />}
        className="h-11 rounded-full bg-page px-5 hover:bg-page/70"
      >
        {t("discover")}
      </Button>
    </div>
  );
}
