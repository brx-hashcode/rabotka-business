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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/illustrations/${name}.svg`}
      alt=""
      aria-hidden
      loading="lazy"
      draggable={false}
      className={cn("pointer-events-none h-auto w-full select-none object-contain", className)}
    />
  );
}
