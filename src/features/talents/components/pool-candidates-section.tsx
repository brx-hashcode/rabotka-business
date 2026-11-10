"use client";

import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconBookmark, IconBookmarkFilled, IconMail, IconNote, IconPhone, IconSearch, IconSend } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import { VerdictChip } from "#/features/cv-screening/components/cv-bits";
import { canHire } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";
import { friendlyError } from "#/lib/api/friendly-error";
import { listOffers, offersKey } from "#/lib/api/offer-controller";
import {
  dropPoolCandidate,
  invitePoolCandidate,
  keepPoolCandidate,
  poolKey,
  searchPoolCandidates,
  type PoolCandidate,
  type PoolKind,
} from "#/lib/api/talent-controller";
import { cn, getInitials } from "#/lib/utils";

const dayMonthYear = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const COPY: Record<PoolKind, { empty: string; hint: string }> = {
  external: {
    empty: "Aucune candidature gardée pour l'instant.",
    hint: "Les candidats de votre page carrières qui ont accepté d'être gardés pour d'autres postes, le temps de leur accord.",
  },
  cv: {
    empty: "Aucun CV analysé n'est conservé en ce moment.",
    hint: "Les CV de vos « Analyse de CV », tant que votre formule les conserve.",
  },
};

/**
 * « Mes profils » beyond Rabotka: careers-page candidates kept with their
 * consent, and the CVs the business analysed. Searched by what their CV
 * says; kept with a note and tags; invited by e-mail to an open offer.
 */
export function PoolCandidatesSection({ source }: Readonly<{ source: PoolKind }>) {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [keptOnly, setKeptOnly] = useState(false);
  const results = useInfiniteQuery({
    queryKey: [...poolKey, source, query, keptOnly],
    queryFn: ({ pageParam }) => searchPoolCandidates({ source, q: query, kept: keptOnly, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
  const items = results.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section className="space-y-5 rounded-3xl bg-card p-6">
      <p className="text-muted-foreground text-sm">{COPY[source].hint}</p>
      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(q.trim());
        }}
      >
        <div className="relative min-w-60 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => setQuery(q.trim())}
            placeholder="Un métier, une compétence, une ville, un nom… dans le CV"
            className="h-11 rounded-full border-0 bg-page pl-10 shadow-none focus-visible:ring-2 focus-visible:ring-ink/10"
          />
        </div>
        <button type="submit" className="h-11 rounded-full bg-ink px-5 font-medium text-sm text-white hover:bg-ink/90">
          Rechercher
        </button>
        <button
          type="button"
          aria-pressed={keptOnly}
          onClick={() => setKeptOnly((v) => !v)}
          className={cn(
            "h-11 rounded-full px-4 font-medium text-sm transition-colors",
            keptOnly ? "bg-selected text-selected-foreground" : "bg-page text-muted-foreground hover:text-foreground",
          )}
        >
          Gardés seulement
        </button>
      </form>

      {results.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : results.isError ? (
        <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">{friendlyError(results.error, "La recherche n'a pas abouti.")}</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-page p-6 text-center text-muted-foreground text-sm">
          {query ? `Aucun résultat pour « ${query} ».` : COPY[source].empty}
        </p>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((c) => (
              <PoolCard key={`${c.kind}:${c.id}`} candidate={c} />
            ))}
          </ul>
          {results.hasNextPage && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={results.isFetchingNextPage}
                onClick={() => void results.fetchNextPage()}
                className="h-10 rounded-full bg-page px-5 font-medium text-sm hover:bg-page/70 disabled:opacity-50"
              >
                Voir plus
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function PoolCard({ candidate: c }: Readonly<{ candidate: PoolCandidate }>) {
  const queryClient = useQueryClient();
  const hire = canHire(useMember().role);
  const [noting, setNoting] = useState(false);
  const [inviting, setInviting] = useState(false);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: poolKey });
  const toggle = useMutation({
    mutationFn: () => (c.kept ? dropPoolCandidate(c.kind, c.id) : keepPoolCandidate(c.kind, c.id, { note: c.note, tags: c.tags })),
    onSuccess: () => {
      refresh();
      toast.success(c.kept ? `${c.name} n'est plus gardé.` : `${c.name} est gardé dans Mes profils.`);
    },
    onError: (err) => toast.error(friendlyError(err, "Le profil n'a pas pu être gardé.")),
  });

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-page p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback className="text-sm">{getInitials(c.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{c.name}</p>
            {c.score !== null && <VerdictChip score={c.score} />}
          </div>
          <p className="truncate text-muted-foreground text-sm">{[c.currentTitle, c.city].filter(Boolean).join(" · ") || "—"}</p>
        </div>
        {hire && (
          <button
            type="button"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate()}
            aria-label={c.kept ? `Ne plus garder ${c.name}` : `Garder ${c.name}`}
            title={c.kept ? "Gardé : cliquer pour ne plus le garder" : "Garder dans Mes profils"}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card hover:bg-card/70 disabled:opacity-50"
          >
            {c.kept ? <IconBookmarkFilled className="size-4 text-whatsapp-dark" /> : <IconBookmark className="size-4" />}
          </button>
        )}
      </div>

      {c.summary && <p className="line-clamp-2 text-muted-foreground text-sm">{c.summary}</p>}

      <p className="text-muted-foreground text-xs">
        {c.kind === "external" ? "A postulé pour " : "Analysé pour "}
        {c.appliedFor.id ? (
          <Link href={`/espace/offres/${c.appliedFor.id}`} className="font-medium text-foreground hover:underline">
            {c.appliedFor.title}
          </Link>
        ) : (
          <span className="font-medium text-foreground">{c.appliedFor.title}</span>
        )}
        {c.keptUntil && ` · ${c.kind === "external" ? "gardé" : "conservé"} jusqu'au ${dayMonthYear(c.keptUntil)}`}
      </p>

      {(c.note || c.tags.length > 0) && (
        <div className="space-y-1.5 rounded-xl bg-card px-3 py-2 text-sm">
          {c.note && <p className="whitespace-pre-line">{c.note}</p>}
          {c.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {c.tags.map((t) => (
                <span key={t} className="rounded-full bg-page px-2 py-0.5 font-medium text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {c.email && (
          <a href={`mailto:${c.email}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 font-medium text-xs hover:bg-card/70">
            <IconMail className="size-3.5" />
            E-mail
          </a>
        )}
        {c.phone && (
          <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 font-medium text-xs hover:bg-card/70">
            <IconPhone className="size-3.5" />
            Appeler
          </a>
        )}
        {hire && (
          <>
            <button
              type="button"
              onClick={() => setNoting(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3 font-medium text-xs hover:bg-card/70"
            >
              <IconNote className="size-3.5" />
              Note et mots-clés
            </button>
            {c.email && (
              <button
                type="button"
                onClick={() => setInviting(true)}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 font-medium text-white text-xs hover:bg-ink/90"
              >
                <IconSend className="size-3.5" />
                Inviter à postuler
              </button>
            )}
          </>
        )}
      </div>

      {noting && <PoolNoteDialog candidate={c} onClose={() => setNoting(false)} onSaved={refresh} />}
      <PoolInviteDialog candidate={c} open={inviting} onOpenChange={setInviting} />
    </li>
  );
}

function PoolNoteDialog({ candidate: c, onClose, onSaved }: Readonly<{ candidate: PoolCandidate; onClose: () => void; onSaved: () => void }>) {
  const [note, setNote] = useState(c.note ?? "");
  const [tags, setTags] = useState(c.tags.join(", "));
  const save = useMutation({
    mutationFn: () =>
      keepPoolCandidate(c.kind, c.id, {
        note: note.trim() || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      onSaved();
      onClose();
      toast.success(`${c.name} est gardé, avec votre note.`);
    },
    onError: (err) => toast.error(friendlyError(err, "La note n'a pas pu être enregistrée.")),
  });
  return (
    <ActionDialog
      open
      onOpenChange={(o) => !o && onClose()}
      icon={<IconNote className="size-5" />}
      title={`Note sur ${c.name}`}
      description="Visible de votre équipe seulement. Enregistrer garde aussi le profil."
      confirmLabel="Enregistrer"
      pending={save.isPending}
      onConfirm={() => save.mutate()}
    >
      <div className="space-y-3">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Ce que vous avez retenu de ce profil"
          className="rounded-xl border-0 bg-page px-4 py-3 shadow-none"
        />
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Mots-clés, séparés par des virgules"
          className="h-11 rounded-xl border-0 bg-page px-4 shadow-none"
        />
      </div>
    </ActionDialog>
  );
}

function PoolInviteDialog({
  candidate: c,
  open,
  onOpenChange,
}: Readonly<{ candidate: PoolCandidate; open: boolean; onOpenChange: (o: boolean) => void }>) {
  const offers = useQuery({
    queryKey: [...offersKey, "list", "open"],
    queryFn: () => listOffers({ statuses: ["ACTIVE", "PARTIALLY_FILLED"] }),
    enabled: open,
  });
  const [offerId, setOfferId] = useState("");
  const invite = useMutation({
    mutationFn: () => invitePoolCandidate(c.kind, c.id, offerId),
    onSuccess: () => {
      onOpenChange(false);
      setOfferId("");
      toast.success(`Invitation envoyée à ${c.name}.`);
    },
    onError: (err) => toast.error(friendlyError(err, "L'invitation n'a pas pu être envoyée.")),
  });
  const list = (offers.data?.items ?? []).filter((o) => o.id !== c.appliedFor.id);
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconSend className="size-5" />}
      title={`Inviter ${c.name} à postuler`}
      description="Un e-mail avec le lien de l'offre sur votre page carrières : postuler prend quelques minutes."
      confirmLabel="Envoyer l'invitation"
      confirmDisabled={!offerId}
      pending={invite.isPending}
      onConfirm={() => invite.mutate()}
    >
      {offers.isLoading ? (
        <Skeleton className="h-11 rounded-full" />
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">
          Aucune autre offre en cours.{" "}
          <Link href="/espace/offres/nouvelle" className="font-medium text-whatsapp-dark underline">
            Publier une offre
          </Link>
        </p>
      ) : (
        <Select value={offerId} onValueChange={setOfferId}>
          <SelectTrigger aria-label="Offre" className="h-11 w-full rounded-full border-0 bg-page px-4 font-medium shadow-none dark:bg-page">
            <SelectValue placeholder="Choisir une offre en cours" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={8} className="z-[60] max-h-72 w-[var(--radix-select-trigger-width)]">
            {list.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </ActionDialog>
  );
}
