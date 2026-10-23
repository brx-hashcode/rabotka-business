"use client";

import type { ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

/** Borderless fields on the grey page tint, as the sign-in form. */
export const FIELD_CLASS =
  "h-12 rounded-xl border-0 bg-page px-4 text-base shadow-none md:text-[15px] focus-visible:ring-2 focus-visible:ring-whatsapp/40";

/** One labelled text input bound to react-hook-form. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  optional,
  hint,
  prefix,
  className,
  ...input
}: Readonly<{
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  optional?: boolean;
  hint?: string;
  /** Fixed text inside the field, before the value (a dialling code). */
  prefix?: string;
  className?: string;
}> &
  Omit<React.ComponentProps<"input">, "name" | "className">) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel optional={optional}>{label}</FieldLabel>
          {prefix ? (
            <div className="flex h-12 items-center rounded-xl bg-page focus-within:ring-2 focus-within:ring-whatsapp/40">
              <span className="flex h-full items-center pr-3 pl-4 font-medium text-[15px] text-muted-foreground">
                {prefix}
              </span>
              <span aria-hidden className="h-5 w-px bg-foreground/10" />
              <FormControl>
                <Input
                  {...input}
                  {...field}
                  value={field.value ?? ""}
                  className={cn(FIELD_CLASS, "bg-transparent pl-3 focus-visible:ring-0")}
                />
              </FormControl>
            </div>
          ) : (
            <FormControl>
              <Input {...input} {...field} value={field.value ?? ""} className={FIELD_CLASS} />
            </FormControl>
          )}
          {hint && <FormDescription className="text-xs">{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function FieldLabel({ children, optional }: Readonly<{ children: ReactNode; optional?: boolean }>) {
  return (
    <FormLabel className="font-medium text-sm">
      {children}
      {optional && <span className="font-normal text-muted-foreground"> (facultatif)</span>}
    </FormLabel>
  );
}

/** The title block every step opens with. */
export function StepHeading({ title, text }: Readonly<{ title: string; text: string }>) {
  return (
    <div className="space-y-2">
      <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

/** Back and continue, the same on every step. */
export function StepActions({
  onBack,
  continueLabel = "Continuer",
  pending,
  disabled,
  type = "submit",
  onContinue,
}: Readonly<{
  onBack?: () => void;
  continueLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
  onContinue?: () => void;
}>) {
  return (
    <div className={cn("flex items-center gap-3 pt-2", onBack ? "justify-between" : "justify-end")}>
      {onBack && (
        <Button type="button" variant="ghost" onClick={onBack} disabled={pending} className="h-12 rounded-full px-5 hover:bg-page sm:h-12">
          <IconArrowLeft />
          Retour
        </Button>
      )}
      <Button
        type={type}
        onClick={onContinue}
        loading={pending}
        disabled={disabled || pending}
        className="h-12 min-w-44 rounded-full border-0 bg-ink px-6 text-[15px] text-white shadow-none hover:bg-ink/90 hover:brightness-100 sm:h-12 sm:text-[15px]"
        variant="ghost"
      >
        {continueLabel}
        <IconArrowRight />
      </Button>
    </div>
  );
}

/** A server error under the form, in a tinted block. */
export function FormError({ message }: Readonly<{ message: string | null }>) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-destructive/8 px-4 py-3 text-destructive text-sm">
      {message}
    </p>
  );
}
