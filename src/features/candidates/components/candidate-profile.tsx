"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheckFilled,
  IconMapPin,
  IconPhoto,
  IconStarFilled,
  IconX,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Skeleton } from "#/components/ui/skeleton";
import { getCandidate, getCandidatePortfolio } from "#/lib/api/candidate-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn, getInitials } from "#/lib/utils";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

/**
 * A worker as an employer may see them, entirely in the space: who they are,
 * their trades and track record, and their realisations. Never a way to reach
 * them — no phone, no email, no address (only the city): that is what a
 * contact unlock sells.
 */
export function CandidateProfile({ workerId }: Readonly<{ workerId: string }>) {
  const { data: c, isLoading, error } = useQuery({
    queryKey: ["candidate", workerId],
    queryFn: () => getCandidate(workerId),
  });
  const portfolio = useQuery({
    queryKey: ["candidate-portfolio", c?.portfolioSlug],
    queryFn: () => getCandidatePortfolio(c!.portfolioSlug!),
    enabled: !!c?.portfolioSlug,
  });
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  if (isLoading) {
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
    return <p className="py-10 text-center text-muted-foreground">{friendlyError(error, "Ce profil est indisponible.")}</p>;
  }

  const name = `${c.firstName} ${c.lastName}`.trim();
  const items = portfolio.data?.portfolio ?? [];
  const location = portfolio.data?.location;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-20 rounded-2xl">
          {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt="" className="object-cover" />}
          <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414] text-xl">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <h2 className="flex items-center gap-2 font-semibold text-2xl tracking-tight">
            <span className="truncate">{name}</span>
            {c.isVerified && <IconCircleCheckFilled aria-label="Profil vérifié" className="size-5 shrink-0 text-whatsapp-dark" />}
          </h2>
          {c.categoryName && <p className="text-muted-foreground">{c.categoryName}</p>}
          {location && (
            <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <IconMapPin className="size-4" />
              {location}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
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
      </div>

      {c.categoryNames.length > 0 && (
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
      )}

      {c.description && (
        <section className="space-y-2">
          <h3 className="font-medium text-sm">Présentation</h3>
          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{c.description}</p>
        </section>
      )}

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
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {urls.map((url, index) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setViewer({ images: urls, index })}
                          className="group relative aspect-square overflow-hidden rounded-xl bg-card"
                          aria-label="Agrandir l'image"
                        >
                          {/* Remote storage images of any size: not for next/image. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            loading="lazy"
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

      {viewer && <ImageViewer images={viewer.images} index={viewer.index} onClose={() => setViewer(null)} />}
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

/**
 * A realisation's images, large, one at a time, inside the space. Its own
 * (nested) dialog: inside the profile dialog a `fixed` overlay would be
 * confined to that dialog's box, and this way Escape closes only the image.
 */
function ImageViewer({ images, index, onClose }: Readonly<{ images: string[]; index: number; onClose: () => void }>) {
  const [i, setI] = useState(index);
  const many = images.length > 1;
  const step = (d: number) => setI((x) => (x + d + images.length) % images.length);
  const nav =
    "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0f2414] hover:bg-white";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showClose={false}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        className="top-0 left-0 flex h-svh w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center rounded-none border-0 bg-black/90 p-4 shadow-none sm:max-w-none"
      >
        <DialogTitle className="sr-only">Image {i + 1} sur {images.length}</DialogTitle>
        <DialogDescription className="sr-only">Réalisation du candidat</DialogDescription>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
        <DialogClose
          aria-label="Fermer"
          className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/90 text-[#0f2414]"
        >
          <IconX className="size-5" />
        </DialogClose>
        {many && (
          <>
            <button type="button" aria-label="Image précédente" className={cn(nav, "left-4")} onClick={() => step(-1)}>
              <IconChevronLeft className="size-5" />
            </button>
            <button type="button" aria-label="Image suivante" className={cn(nav, "right-4")} onClick={() => step(1)}>
              <IconChevronRight className="size-5" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
