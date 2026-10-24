"use client";

import { useQuery } from "@tanstack/react-query";
import { IconCircleCheckFilled, IconExternalLink, IconMapPin, IconStarFilled } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "#/components/ui/sheet";
import { Skeleton } from "#/components/ui/skeleton";
import { appConfig } from "#/config";
import { getCandidate } from "#/lib/api/candidate-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { getInitials } from "#/lib/utils";

/**
 * One worker, opened from the search: who they are, their trades, their
 * track record, and their public portfolio. Contacting them comes with the
 * Candidats pages.
 */
export function CandidateSheet({
  workerId,
  onOpenChange,
}: Readonly<{ workerId: string | null; onOpenChange: (open: boolean) => void }>) {
  const { data: c, isLoading, error } = useQuery({
    queryKey: ["candidate", workerId],
    queryFn: () => getCandidate(workerId!),
    enabled: !!workerId,
  });
  const name = c ? `${c.firstName} ${c.lastName}`.trim() : "";

  return (
    <Sheet open={!!workerId} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 border-0 bg-card p-0 sm:max-w-md">
        <SheetTitle className="sr-only">{name || "Candidat"}</SheetTitle>
        <SheetDescription className="sr-only">Profil du candidat</SheetDescription>
        {isLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="size-20 rounded-2xl" />
            <Skeleton className="h-8 w-2/3 rounded-xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : !c ? (
          <p className="p-6 text-muted-foreground text-sm">{friendlyError(error, "Ce profil est indisponible.")}</p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="space-y-4 p-6">
              <Avatar className="size-20 rounded-2xl">
                {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt="" className="object-cover" />}
                <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414] text-xl">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 font-semibold text-2xl tracking-tight">
                  {name}
                  {c.isVerified && <IconCircleCheckFilled aria-label="Profil vérifié" className="size-5 text-whatsapp-dark" />}
                </h2>
                {c.categoryName && <p className="text-muted-foreground">{c.categoryName}</p>}
                {c.address && (
                  <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <IconMapPin className="size-4" />
                    {c.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Figure label="Fiabilité" value={c.reliabilityScore === null ? "—" : `${c.reliabilityScore}/100`} />
                <Figure
                  label={`Note (${c.ratingCount})`}
                  value={
                    c.ratingAvg === null ? (
                      "—"
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {c.ratingAvg.toFixed(1)}
                        <IconStarFilled className="size-4 text-amber-400" />
                      </span>
                    )
                  }
                />
                <Figure label="Missions" value={String(c.completedMissions)} />
              </div>

              {c.categoryNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {c.categoryNames.map((n) => (
                    <span key={n} className="rounded-full bg-page px-3 py-1.5 text-sm">
                      {n}
                    </span>
                  ))}
                </div>
              )}

              {c.description && (
                <div className="space-y-1.5">
                  <p className="font-medium text-sm">Présentation</p>
                  <p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">{c.description}</p>
                </div>
              )}
            </div>

            <div className="mt-auto space-y-2 p-6 pt-0">
              {c.portfolioSlug && (
                <a
                  href={`${appConfig.clientUrl}/p/${c.portfolioSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-page font-medium text-[15px] hover:bg-page/70"
                >
                  Voir le portfolio
                  <IconExternalLink className="size-4" />
                </a>
              )}
              <button
                type="button"
                disabled
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-medium text-[15px] text-white opacity-50"
              >
                Contacter · bientôt
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Figure({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="rounded-2xl bg-page p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
