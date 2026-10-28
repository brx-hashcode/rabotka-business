import { cn } from "#/lib/utils";

/**
 * A screen of the product, drawn with its own components and example data.
 * Hidden from screen readers, which get `label` instead: the picture says
 * nothing a sentence cannot.
 */
export function MockupFrame({
  label,
  title,
  className,
  children,
}: Readonly<{ label: string; title?: string; className?: string; children: React.ReactNode }>) {
  return (
    <figure className={cn("relative", className)}>
      <figcaption className="sr-only">{label}</figcaption>
      <div aria-hidden className="pointer-events-none select-none overflow-hidden rounded-3xl bg-card shadow-soft">
        <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-2">
          <span className="size-2.5 rounded-full bg-foreground/10" />
          <span className="size-2.5 rounded-full bg-foreground/10" />
          <span className="size-2.5 rounded-full bg-foreground/10" />
          {title && <span className="ml-2 truncate text-[11px] text-muted-foreground">{title}</span>}
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </figure>
  );
}

/** A floating card over a mock-up (a toast, a drawer's corner). */
export function FloatCard({ className, children }: Readonly<{ className?: string; children: React.ReactNode }>) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute select-none rounded-2xl bg-card p-3 shadow-soft", className)}>
      {children}
    </div>
  );
}
