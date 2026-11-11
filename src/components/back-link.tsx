import Link from "next/link";
import { IconArrowLeft, IconChevronRight } from "@tabler/icons-react";

/**
 * Where a detail page sits, and the way back: a round back button, the
 * parent page, then this page's own name when it has one.
 */
export function BackLink({ href, label, current }: Readonly<{ href: string; label: string; current?: string | null }>) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-2 text-sm">
      <Link
        href={href}
        aria-label={`Retour : ${label}`}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground"
      >
        <IconArrowLeft className="size-4" />
      </Link>
      <Link href={href} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
        {label}
      </Link>
      {current ? (
        <>
          <IconChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
          <span aria-current="page" className="min-w-0 truncate font-medium text-foreground">
            {current}
          </span>
        </>
      ) : null}
    </nav>
  );
}
