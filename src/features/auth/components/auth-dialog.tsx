"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { IconArrowLeft, IconX } from "@tabler/icons-react";

import { cn } from "#/lib/utils";

/**
 * The sign-in route rendered over the page it was opened from (the intercepted
 * `@modal/(.)auth/sign-in`). Closing it is `router.back()`, so the URL goes
 * back to wherever the visitor was, and browser back/forward reopen it.
 *
 * Desktop: a centered card over a dimmed feed. Below `md` the same element
 * fills the screen with a back arrow — a page in every way the visitor can
 * tell. Pure CSS, so there is no breakpoint check in JS and no flash.
 */
export function AuthDialog({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 max-md:hidden" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 overflow-y-auto bg-background outline-none",
            // Desktop: centered card.
            "md:top-1/2 md:left-1/2 md:w-full md:max-w-sm md:-translate-x-1/2 md:-translate-y-1/2",
            "md:rounded-2xl md:bg-card md:p-8 md:shadow-soft",
            "md:data-[state=open]:animate-in md:data-[state=open]:fade-in-0 md:data-[state=open]:zoom-in-95",
            // Mobile: a full page.
            "max-md:inset-0 max-md:flex max-md:flex-col max-md:px-4 max-md:pt-3 max-md:pb-8",
            "max-md:data-[state=open]:animate-in max-md:data-[state=open]:slide-in-from-bottom-4",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Connexion</DialogPrimitive.Title>

          <div className="mb-6 md:hidden">
            <DialogPrimitive.Close
              className="-ml-2 inline-flex size-10 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Retour"
            >
              <IconArrowLeft className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <DialogPrimitive.Close
            className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground max-md:hidden"
            aria-label="Fermer"
          >
            <IconX className="size-4" />
          </DialogPrimitive.Close>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center max-md:pb-10">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
