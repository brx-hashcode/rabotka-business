import { parseDescription } from "#/features/careers/description";
import { cn } from "#/lib/utils";

/**
 * Plain text as people type it, with its « - » lines shown as a list: each item
 * under its own dot, so a wrapped line no longer slides back under the dash.
 * Size and colour come from the caller.
 */
export function DescriptionText({ text, className }: Readonly<{ text: string; className?: string }>) {
  return (
    <div className={cn("space-y-3 leading-relaxed", className)}>
      {parseDescription(text).map((block, i) =>
        block.kind === "text" ? (
          <p key={i} className="break-words">
            {block.text}
          </p>
        ) : (
          <ul key={i} className="space-y-2">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3">
                <span aria-hidden className="mt-[0.65em] size-1.5 shrink-0 rounded-full bg-whatsapp-dark" />
                <span className="min-w-0 break-words">
                  {item.label && <strong className="font-semibold">{item.label} : </strong>}
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
