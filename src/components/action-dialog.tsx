"use client";

import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

/**
 * Confirmation for an action. A centred card on desktop, a sheet rising
 * from the bottom on phones. It stays open (and blocks closing) while the
 * action runs, and the caller closes it on success.
 */
export function ActionDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  children,
  confirmLabel,
  onConfirm,
  pending,
  confirmDisabled,
  tone = "default",
  hideCancel = false,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  confirmDisabled?: boolean;
  tone?: "default" | "warning";
  /** A result to acknowledge, not a choice: a single full-width button. */
  hideCancel?: boolean;
}>) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 flex flex-col gap-5 bg-card outline-none",
            // Phones: bottom sheet.
            "max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[90svh] max-md:overflow-y-auto max-md:rounded-t-3xl max-md:px-5 max-md:pt-3 max-md:pb-8",
            "max-md:data-[state=open]:animate-in max-md:data-[state=open]:slide-in-from-bottom",
            // Desktop: centred card.
            "md:top-1/2 md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:p-6 md:shadow-soft",
            "md:data-[state=open]:animate-in md:data-[state=open]:fade-in-0 md:data-[state=open]:zoom-in-95",
          )}
        >
          <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-muted md:hidden" />

          <div className="flex items-start gap-4">
            {icon && (
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                  tone === "warning"
                    ? "bg-chip-amber text-chip-amber-foreground"
                    : "bg-chip-green text-chip-green-foreground",
                )}
              >
                {icon}
              </span>
            )}
            <div className="min-w-0 space-y-1.5 pt-0.5">
              <DialogPrimitive.Title className="font-semibold text-lg leading-snug">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
          </div>

          {children}

          <div className={cn("grid gap-2", !hideCancel && "grid-cols-2")}>
            {!hideCancel && (
              <DialogPrimitive.Close asChild disabled={pending}>
                <Button size="lg" variant="secondary" className="rounded-full">
                  Annuler
                </Button>
              </DialogPrimitive.Close>
            )}
            <Button
              size="lg"
              className="rounded-full"
              loading={pending}
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
