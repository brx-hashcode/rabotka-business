"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { useWhyNot } from "#/lib/use-why-not";
import { emailSchema } from "#/lib/validations/auth";

type Step1EmailFormProps = {
  onSubmit: (data: { email: string }) => Promise<void>;
  /** Filled in from a team invitation's link (`?email=`). */
  defaultEmail?: string;
  isLoading: boolean;
  serverError: string | null;
};

export function Step1EmailForm({
  onSubmit,
  defaultEmail,
  isLoading,
  serverError,
}: Readonly<Step1EmailFormProps>) {
  const t = useTranslations("auth");
  const whyNot = useWhyNot();
  const form = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: emailSchema(t("validation.email")) })),
    defaultValues: { email: defaultEmail ?? "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (serverError) {
      form.setError("email", { type: "server", message: serverError });
    }
  }, [serverError, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium text-sm">{t("emailForm.label")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder={t("emailForm.placeholder")}
                  autoComplete="email"
                  disabled={isLoading}
                  title={whyNot([isLoading, "wait"])}
                  autoFocus
                  className="h-12 rounded-full border-0 bg-page px-5 text-base shadow-none md:text-[15px] focus-visible:ring-2 focus-visible:ring-whatsapp/40"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="ghost"
          // The ink pill of the sign-up's buttons, as the auth pages' main action.
          className="h-12 w-full rounded-full border-0 bg-ink text-[15px] text-white shadow-none hover:bg-ink/90 hover:brightness-100 sm:h-12 sm:text-[15px]"
          disabled={isLoading}
          title={whyNot([isLoading, "wait"])}
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              {t("emailForm.sending")}
            </>
          ) : (
            t("emailForm.submit")
          )}
        </Button>
      </form>
    </Form>
  );
}
