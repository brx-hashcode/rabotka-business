"use client";

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * The app's toasts: a white card with the type's icon in a tinted tile, the
 * title, an optional muted line, and an action as a pill. Unstyled sonner, so
 * these classes are the whole look. A toast floats over the page, so it keeps
 * the soft shadow that flat cards do not have.
 */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    className="toaster group"
    icons={{
      success: <IconCircleCheck className="size-5" />,
      info: <IconInfoCircle className="size-5" />,
      warning: <IconAlertTriangle className="size-5" />,
      error: <IconCircleX className="size-5" />,
      loading: <Loader className="size-5 animate-spin" />,
    }}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast:
          "group/toast flex w-full items-center gap-3 rounded-2xl bg-card p-3 pr-3.5 font-sans text-foreground shadow-soft sm:w-[var(--width)]",
        // Typed toasts get their tile here; a toast with its own `icon` (the
        // notifications) brings an already tinted one.
        icon: "!m-0 flex !size-auto shrink-0 items-center justify-center [&>svg]:m-0 group-data-[type=success]/toast:size-10! group-data-[type=success]/toast:rounded-xl group-data-[type=success]/toast:bg-chip-green group-data-[type=success]/toast:text-chip-green-foreground group-data-[type=error]/toast:size-10! group-data-[type=error]/toast:rounded-xl group-data-[type=error]/toast:bg-destructive/10 group-data-[type=error]/toast:text-destructive group-data-[type=warning]/toast:size-10! group-data-[type=warning]/toast:rounded-xl group-data-[type=warning]/toast:bg-chip-amber group-data-[type=warning]/toast:text-chip-amber-foreground group-data-[type=info]/toast:size-10! group-data-[type=info]/toast:rounded-xl group-data-[type=info]/toast:bg-page group-data-[type=info]/toast:text-muted-foreground group-data-[type=loading]/toast:size-10! group-data-[type=loading]/toast:rounded-xl group-data-[type=loading]/toast:bg-page",
        content: "min-w-0 flex-1 space-y-0.5",
        title: "font-semibold text-sm leading-snug",
        description: "text-muted-foreground text-xs leading-relaxed",
        actionButton:
          "shrink-0 cursor-pointer rounded-full bg-ink px-3.5 py-1.5 font-medium text-white text-xs transition-colors hover:bg-ink/90",
        cancelButton:
          "shrink-0 cursor-pointer rounded-full bg-page px-3.5 py-1.5 font-medium text-xs",
      },
    }}
    {...props}
  />
);

export { Toaster };
