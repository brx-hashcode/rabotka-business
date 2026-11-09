import { cn } from "#/lib/utils";

/** A section's kicker, title and lead, as every landing section opens. */
export function SectionHeading({
  kicker,
  title,
  text,
  center = false,
  as: Heading = "h2",
}: Readonly<{ kicker: string; title: string; text?: string; center?: boolean; as?: "h1" | "h2" }>) {
  return (
    <div className={cn("max-w-2xl space-y-3", center && "mx-auto text-center")}>
      <p className="font-medium text-sm text-whatsapp-dark">{kicker}</p>
      <Heading className="font-semibold text-3xl tracking-tight sm:text-4xl">{title}</Heading>
      {text && <p className="text-lg text-muted-foreground">{text}</p>}
    </div>
  );
}
