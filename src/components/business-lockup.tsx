import { BrandLogo } from "#/components/brand-logo";
import { cn } from "#/lib/utils";

/**
 * The header's logo: the Rabotka lockup, a thin divider, then « Business » —
 * the product area named beside the brand, as LinkedIn's « | Recruter ».
 * `compact` drops the divider and the word below `sm`, where the landing
 * header has no room for them beside its button.
 */
export function BusinessLockup({ compact = false }: Readonly<{ compact?: boolean }>) {
  return (
    <span className="flex items-center gap-3">
      <BrandLogo tone="dark" />
      <span
        className={cn(
          "items-center gap-3 text-header-foreground",
          compact ? "hidden sm:flex" : "flex",
        )}
      >
        <span aria-hidden className="h-6 w-px bg-header-foreground/30" />
        <span className="text-[17px] font-normal">Business</span>
      </span>
    </span>
  );
}
