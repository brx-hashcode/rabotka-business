import type { Icon } from "@tabler/icons-react";

/** One figure of the dashboard's summary: icon, label, value, a short hint. */
export function StatTile({
  icon: IconCmp,
  label,
  value,
  hint,
}: Readonly<{
  icon: Icon;
  label: string;
  value: string;
  hint?: string;
}>) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-page p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-card">
          <IconCmp className="size-5" />
        </span>
        <span className="font-medium text-base leading-tight">{label}</span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-3xl tracking-tight">{value}</p>
        {hint && <p className="line-clamp-2 text-muted-foreground text-sm">{hint}</p>}
      </div>
    </div>
  );
}
