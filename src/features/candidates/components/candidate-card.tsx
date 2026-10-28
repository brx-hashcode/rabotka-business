"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { IconBriefcase, IconShieldCheck, IconStarFilled } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { KeepButton } from "#/features/talents/components/keep-button";
import type { Candidate } from "#/lib/api/candidate-controller";
import { cn, getInitials } from "#/lib/utils";
import { ReachButton } from "./reach-button";

export const RELIABILITY_HINT = "Fiabilité : présence, ponctualité et missions menées à terme";

const button = "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 font-medium text-sm transition-colors";

/**
 * A worker as the search shows them — who, their trade, how they did — with
 * the profile (dialog) and the way to reach them. Never a contact detail on
 * the card itself.
 */
export function CandidateCard({ candidate: c, compact }: Readonly<{ candidate: Candidate; compact?: boolean }>) {
  const name = `${c.firstName} ${c.lastName}`.trim();
  return (
    <li className={cn("flex flex-col gap-4 rounded-3xl bg-page p-5", compact && "gap-3 p-4")}>
      <div className="flex items-start gap-3.5">
        <Link href={`/espace/candidats/${c.id}`} className="shrink-0">
          <Avatar className={cn("rounded-2xl", compact ? "size-12" : "size-14")}>
            {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt="" className="object-cover" />}
            <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">{getInitials(name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/espace/candidats/${c.id}`} className="flex items-center gap-1.5 hover:underline">
            <span className="truncate font-semibold">{name}</span>
            {c.isVerified && <BadgeCheck aria-label="Identité vérifiée" className="size-4 shrink-0 text-whatsapp" />}
          </Link>
          {c.categoryName && <p className="truncate text-muted-foreground text-sm">{c.categoryName}</p>}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
            {c.ratingAvg !== null && c.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium">
                <IconStarFilled className="size-3.5 text-amber-400" />
                {Number(c.ratingAvg).toFixed(1)}
                <span className="font-normal text-muted-foreground">({c.ratingCount})</span>
              </span>
            )}
            {c.reliabilityScore !== null && (
              <span className="inline-flex items-center gap-1 font-medium" title={RELIABILITY_HINT}>
                <IconShieldCheck className="size-3.5 text-whatsapp-dark" />
                {c.reliabilityScore}/100
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <IconBriefcase className="size-3.5" />
              {c.completedMissions} mission{c.completedMissions > 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <KeepButton workerId={c.id} name={name} />
      </div>
      {!compact && c.description && <p className="line-clamp-2 text-muted-foreground text-sm leading-relaxed">{c.description}</p>}
      <div className="mt-auto flex gap-2">
        <Link href={`/espace/candidats/${c.id}`} className={cn(button, "bg-card hover:bg-card/70")}>
          Profil
        </Link>
        <ReachButton workerId={c.id} name={name} />
      </div>
    </li>
  );
}

export { ReachButton };
