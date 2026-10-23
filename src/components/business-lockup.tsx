import { BrandLogo } from "#/components/brand-logo";
import { cn } from "#/lib/utils";

/**
 * The header's logo: the Rabotka lockup, a thin divider, then « Business » —
 * the product area named beside the brand, as LinkedIn's « | Recruter ».
 * `compact` drops the divider and the word below `sm`, where the landing
 * header has no room for them beside its button.
 */
export function BusinessLockup({
  compact = false,
  inverse = false,
}: Readonly<{ compact?: boolean; inverse?: boolean }>) {
  return (
    <span className="flex items-center gap-3">
      <BrandLogo tone={inverse ? "inverse" : "dark"} />
      <span
        className={cn(
          "items-center gap-3",
          inverse ? "text-white" : "text-header-foreground",
          compact ? "hidden sm:flex" : "flex",
        )}
      >
        <span aria-hidden className={cn("h-6 w-px", inverse ? "bg-white/40" : "bg-header-foreground/30")} />
        <span className="text-[17px] font-normal">Business</span>
      </span>
    </span>
  );
}
