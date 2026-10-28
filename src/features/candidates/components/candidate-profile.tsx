"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { IconMapPin, IconPhoto, IconStarFilled } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Skeleton } from "#/components/ui/skeleton";
import { ProfileSkeleton } from "#/components/page-skeletons";
import { getCandidate, getCandidatePortfolio } from "#/lib/api/candidate-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { ImageGallerySheet } from "#/components/image-gallery-sheet";
import { KeepButton } from "#/features/talents/components/keep-button";
import { ReachButton } from "./reach-button";
import { SafeImage } from "#/components/safe-image";
import { getInitials } from "#/lib/utils";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

/**
 * A worker as an employer may see them, entirely in the space: who they are,
 * their trades and track record, and their realisations. Never a way to reach
 * them — no phone, no email, no address (only the city): that is what a
 * contact unlock sells.
 */
/**
 * `asPage`: the page's own heading (h1), and two columns as the other detail
 * pages — who they are on the left, their figures and trades beside. In the
 * dialog it stays one column and a section title.
 */
export function CandidateProfile({ workerId, asPage }: Readonly<{ workerId: string; asPage?: boolean }>) {
  const Title = asPage ? "h1" : "h2";
  const { data: c, isLoading, error } = useQuery({
    queryKey: ["candidate", workerId],
    queryFn: () => getCandidate(workerId),
  });
  const portfolio = useQuery({
    queryKey: ["candidate-portfolio", c?.portfolioSlug],
    queryFn: () => getCandidatePortfolio(c!.portfolioSlug!),
    enabled: !!c?.portfolioSlug,
  });
  const [viewer, setViewer] = useState<{ images: string[]; index: number; title: string } | null>(null);

  if (isLoading) {
    if (asPage) return <ProfileSkeleton />;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-2xl" />
          <Skeleton className="h-8 w-1/2 rounded-xl" />
        </div>
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }
  if (!c) {
    const message = friendlyError(error, "Ce profil est indisponible.");
    if (asPage) return <p className="rounded-3xl bg-card p-6 text-muted-foreground">{message}</p>;
    return <p className="py-10 text-center text-muted-foreground">{message}</p>;
  }

  const name = `${c.firstName} ${c.lastName}`.trim();
  const items = portfolio.data?.portfolio ?? [];
  const location = portfolio.data?.location;

  const header = (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-20 rounded-2xl">
          {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt="" className="object-cover" />}
          <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414] text-xl">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <Title className="truncate font-semibold text-2xl tracking-tight">{name}</Title>
          {/* As the client app: only when verified — a pending or refused
              review is never shown to employers. */}
          {c.isVerified && (
            <span className="inline-flex items-center gap-1 font-medium text-whatsapp text-xs">
              <BadgeCheck className="size-3.5" />
              Identité vérifiée
            </span>
          )}
          {c.categoryName && <p className="text-muted-foreground">{c.categoryName}</p>}
          {location && (
            <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <IconMapPin className="size-4" />
              {location}
            </p>
          )}
        </div>
        <KeepButton workerId={workerId} name={name} className="size-10 self-start bg-page" />
      </div>

      {/* Reaching them, from the profile as from the card: « Contact » once obtained. */}
      <div className="flex sm:max-w-xs">
        <ReachButton workerId={workerId} name={name} />
      </div>
    </>
  );
  const figures = (
    <>
      <Figure label="Fiabilité" value={c.reliabilityScore === null ? "—" : `${c.reliabilityScore}/100`} />
      <Figure
        label={`Note (${c.ratingCount})`}
        value={
          c.ratingAvg === null ? (
            "—"
          ) : (
            <span className="inline-flex items-center gap-1">
              {Number(c.ratingAvg).toFixed(1)}
              <IconStarFilled className="size-4 text-amber-400" />
            </span>
          )
        }
      />
      <Figure label="Missions terminées" value={String(c.completedMissions)} />
    </>
  );
  const trades = c.categoryNames.length > 0 && (
    <section className="space-y-2">
      <h3 className="font-medium text-sm">Métiers</h3>
      <div className="flex flex-wrap gap-2">
        {c.categoryNames.map((n) => (
          <span key={n} className="rounded-full bg-page px-3 py-1.5 text-sm">
            {n}
          </span>
        ))}
      </div>
    </section>
  );
  const presentation = c.description && (
    <section className="space-y-2">
      <h3 className="font-medium text-sm">Présentation</h3>
      <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{c.description}</p>
    </section>
  );
  const realisations = (
    <section className="space-y-3">
      <h3 className="font-medium text-sm">Réalisations{items.length > 0 ? ` (${items.length})` : ""}</h3>
      {portfolio.isLoading && c.portfolioSlug ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="flex items-center gap-2 rounded-2xl bg-page p-4 text-muted-foreground text-sm">
          <IconPhoto className="size-5" />
          Aucune réalisation publiée pour le moment.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const urls = item.images.map((i) => i.imageUrl);
            return (
              <article key={item.id} className="space-y-2 rounded-2xl bg-page p-3">
                {urls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {urls.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setViewer({ images: urls, index, title: "Réalisation" })}
                        className="group relative aspect-square overflow-hidden rounded-xl bg-card"
                        aria-label="Agrandir l'image"
                      >
                        <SafeImage
                          src={url}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}
                {item.description && <p className="px-1 text-sm">{item.description}</p>}
                <p className="px-1 text-muted-foreground text-xs">{date(item.createdAt)}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
  const gallery = viewer && (
    <ImageGallerySheet images={viewer.images} index={viewer.index} title={viewer.title} onClose={() => setViewer(null)} />
  );

  if (asPage) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="min-w-0 space-y-6 rounded-3xl bg-card p-6 sm:p-8">
          {header}
          {presentation}
          {realisations}
        </div>
        <aside className="space-y-6 rounded-3xl bg-card p-6 lg:sticky lg:top-24">
          <section className="space-y-3">
            <h2 className="font-semibold text-lg">En bref</h2>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">{figures}</div>
          </section>
          {trades}
        </aside>
        {gallery}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      <div className="grid grid-cols-3 gap-3">{figures}</div>
      {trades}
      {presentation}
      {realisations}
      {gallery}
    </div>
  );
}

function Figure({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="rounded-2xl bg-page p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold text-lg">{value}</p>
    </div>
  );
}
