import { cn } from "#/lib/utils";

/** The unDraw illustrations in public/illustrations (free licence, no credit needed). */
export type IllustrationName =
  | "booked"
  | "chat"
  | "interview"
  | "job-hunt"
  | "job-offers"
  | "mobile"
  | "no-results"
  | "online-cv"
  | "sent"
  | "team";

/** A decorative drawing: hidden from screen readers, the text beside it says it all. */
export function Illustration({ name, className }: Readonly<{ name: IllustrationName; className?: string }>) {
  // Two drawings, CSS shows one; lazy, so the hidden one is never downloaded.
  return (["light", "dark"] as const).map((theme) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={theme}
      src={`/illustrations/${name}${theme === "dark" ? "-dark" : ""}.svg`}
      alt=""
      aria-hidden
      loading="lazy"
      draggable={false}
      className={cn(
        "pointer-events-none h-auto w-full select-none object-contain",
        className,
        theme === "dark" ? "hidden dark:block" : "dark:hidden",
      )}
    />
  ));
}
