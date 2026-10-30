"use client";

import { useMemo, useState } from "react";
import { debounce, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconBookmark,
  IconBriefcase,
  IconDots,
  IconNote,
  IconSearch,
  IconSend,
  IconShieldCheck,
  IconStarFilled,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import { CardGridSkeleton } from "#/components/page-skeletons";
import { ReachButton, RELIABILITY_HINT } from "#/features/candidates/components/candidate-card";
import { friendlyError } from "#/lib/api/friendly-error";
import { listOffers, offersKey } from "#/lib/api/offer-controller";
import { inviteTalent, listTalents, removeTalent, saveTalent, talentsKey, type Talent } from "#/lib/api/talent-controller";
import { cn, getInitials } from "#/lib/utils";

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const monthYear = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

const TAB_KEYS = ["all", "kept", "alumni"] as const;
type Tab = (typeof TAB_KEYS)[number];

/**
 * « Vivier »: the workers the business keeps and those it already hired —
 * a note and tags of its own, and the way to bring them back: an invitation
 * to apply to an open offer, or their contact.
 */
export function TalentsPage() {
  const talents = useQuery({ queryKey: talentsKey, queryFn: listTalents });
  // The tab lives in the URL (?onglet=), so a reload or a shared link keeps it.
  const [tab, setTab] = useQueryState("onglet", parseAsStringLiteral(TAB_KEYS).withDefault("all"));
  // The search and the tag live in the URL too (?q=, ?tag=), so a reload keeps them.
  const [q, setQ] = useQueryState("q", parseAsString.withDefault("").withOptions({ limitUrlUpdates: debounce(300) }));
  const [tag, setTag] = useQueryState("tag");
  const all = useMemo(() => talents.data ?? [], [talents.data]);

  const tags = useMemo(() => [...new Set(all.flatMap((t) => t.tags))].sort((a, b) => a.localeCompare(b, "fr")), [all]);
  const shown = all.filter(
    (t) =>
      (tab === "all" || (tab === "kept" ? t.saved : t.missionsWithUs > 0)) &&
      (!tag || t.tags.includes(tag)) &&
      (!q.trim() || fold(`${t.firstName} ${t.lastName} ${t.categoryName ?? ""} ${t.city ?? ""} ${t.description ?? ""} ${t.note ?? ""} ${t.tags.join(" ")}`).includes(fold(q.trim()))),
  );
  const count = (k: Tab) => (k === "all" ? all.length : all.filter((t) => (k === "kept" ? t.saved : t.missionsWithUs > 0)).length);

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Mes profils</h1>
        <p className="text-muted-foreground">
          Les profils que vous gardez et ceux qui ont déjà travaillé pour vous : invitez-les sur une nouvelle offre.
        </p>
      </div>

      <section className="space-y-5 rounded-3xl bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" className="inline-flex rounded-full bg-page p-1">
            {(
              [
                ["all", "Tous"],
                ["kept", "Gardés"],
                ["alumni", "Déjà recrutés"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => void setTab(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium text-sm",
                  tab === key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
                <span className="tabular-nums opacity-70">{count(key)}</span>
              </button>
            ))}
          </div>
          <div className="relative min-w-60 flex-1">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => void setQ(e.target.value)}
              placeholder="Nom, métier, ville, note, mot-clé…"
              className="h-11 rounded-full border-0 bg-page pl-10 shadow-none focus-visible:ring-2 focus-visible:ring-ink/10"
            />
          </div>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tag === t}
                onClick={() => void setTag(tag === t ? null : t)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium text-xs transition-colors",
                  tag === t ? "bg-ink text-white" : "bg-page text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {talents.isLoading ? (
          <CardGridSkeleton kind="talent" />
        ) : !talents.data ? (
          <p className="text-muted-foreground">{friendlyError(talents.error, "Vos profils sont indisponibles pour le moment.")}</p>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
              <IconBookmark className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">{all.length === 0 ? "Aucun profil pour le moment" : "Personne ici"}</p>
            <p className="max-w-md text-muted-foreground text-sm">
              {all.length === 0
                ? "Gardez un profil avec le bouton « Garder », depuis la recherche ou une fiche : il apparaît ici, comme ceux que vous avez déjà recrutés."
                : "Changez d'onglet, de mot-clé ou de recherche."}
            </p>
            {all.length === 0 && (
              <Link href="/espace/recherche" className="font-medium text-sm text-whatsapp-dark hover:underline">
                Chercher des profils
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((t) => (
              <TalentCard key={t.workerId} talent={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TalentCard({ talent: t }: Readonly<{ talent: Talent }>) {
  const queryClient = useQueryClient();
  const name = `${t.firstName} ${t.lastName}`.trim();
  const [dialog, setDialog] = useState<"note" | "invite" | "remove" | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: talentsKey });

  const keep = useMutation({
    mutationFn: () => saveTalent(t.workerId),
    onSuccess: () => {
      refresh();
      toast.success(`Profil de ${name} ajouté à « Mes profils ».`);
    },
    onError: (err) => toast.error(friendlyError(err, "Vos profils n'ont pas pu être mis à jour.")),
  });
  const remove = useMutation({
    mutationFn: () => removeTalent(t.workerId),
    onSuccess: () => {
      refresh();
      setDialog(null);
      toast.success(`Profil de ${name} retiré de « Mes profils ».`);
    },
    onError: (err) => toast.error(friendlyError(err, "Vos profils n'ont pas pu être mis à jour.")),
  });

  return (
    <li className={cn("flex flex-col gap-4 rounded-3xl bg-page p-5", !t.available && "opacity-70")}>
      <div className="flex items-start gap-3.5">
        <Link href={`/espace/candidats/${t.workerId}`} className="shrink-0">
          <Avatar className="size-14 rounded-2xl">
            {t.avatarUrl && <AvatarImage src={t.avatarUrl} alt="" className="object-cover" />}
            <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">{getInitials(name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/espace/candidats/${t.workerId}`} className="block truncate font-semibold hover:underline">
            {name}
          </Link>
          {(t.categoryName || t.city) && (
            <p className="truncate text-muted-foreground text-sm">{[t.categoryName, t.city].filter(Boolean).join(" · ")}</p>
          )}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs">
            {t.ratingAvg !== null && t.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium">
                <IconStarFilled className="size-3.5 text-amber-400" />
                {Number(t.ratingAvg).toFixed(1)}
              </span>
            )}
            {t.reliabilityScore !== null && (
              <span className="inline-flex items-center gap-1 font-medium" title={RELIABILITY_HINT}>
                <IconShieldCheck className="size-3.5 text-whatsapp-dark" />
                {t.reliabilityScore}/100
              </span>
            )}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Plus d'actions" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card outline-none hover:bg-card/70">
            <IconDots className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
            {t.saved ? (
              <>
                <DropdownMenuItem onSelect={() => setDialog("note")} className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-page">
                  <IconNote className="size-4" />
                  Note et mots-clés
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setDialog("remove")}
                  className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-destructive text-sm focus:bg-destructive/10 focus:text-destructive"
                >
                  <IconTrash className="size-4" />
                  Ne plus garder
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onSelect={() => keep.mutate()} className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-page">
                <IconBookmark className="size-4" />
                Garder dans mes profils
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {t.missionsWithUs > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-chip-green px-2.5 py-0.5 font-medium text-chip-green-foreground text-xs">
            <IconBriefcase className="size-3.5" />
            {t.missionsWithUs} mission{t.missionsWithUs > 1 ? "s" : ""} avec vous
          </span>
        )}
        {t.saved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-lime px-2.5 py-0.5 font-medium text-[#0f2414] text-xs">
            <IconBookmark className="size-3.5" />
            Gardé
          </span>
        )}
        {!t.available && <span className="rounded-full bg-card px-2.5 py-0.5 font-medium text-muted-foreground text-xs">Plus disponible</span>}
        {t.tags.map((x) => (
          <span key={x} className="rounded-full bg-card px-2.5 py-0.5 font-medium text-xs">
            {x}
          </span>
        ))}
      </div>

      {t.lastMissionTitle && t.lastMissionAt && (
        <p className="text-muted-foreground text-xs">
          Dernière mission : <span className="font-medium text-foreground">{t.lastMissionTitle}</span>, {monthYear(t.lastMissionAt)}
        </p>
      )}
      {t.description && <p className="line-clamp-2 text-muted-foreground text-sm leading-relaxed">{t.description}</p>}
      {t.note && <p className="line-clamp-3 rounded-2xl bg-card p-3 text-sm italic">« {t.note} »</p>}

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          disabled={!t.available}
          onClick={() => setDialog("invite")}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-brand-lime px-4 font-medium text-[#0f2414] text-sm hover:bg-brand-lime/80 disabled:opacity-50"
        >
          <IconSend className="size-4 shrink-0" />
          Inviter
        </button>
        {t.available && <ReachButton workerId={t.workerId} name={name} />}
      </div>

      <NoteDialog talent={t} name={name} open={dialog === "note"} onOpenChange={(o) => setDialog(o ? "note" : null)} />
      <InviteDialog workerId={t.workerId} name={name} open={dialog === "invite"} onOpenChange={(o) => setDialog(o ? "invite" : null)} />
      <ActionDialog
        open={dialog === "remove"}
        onOpenChange={(o) => setDialog(o ? "remove" : null)}
        tone="warning"
        icon={<IconTrash className="size-5" />}
        title={`Ne plus garder ${name} ?`}
        description={t.missionsWithUs > 0 ? "Votre note et vos mots-clés seront effacés. Ce profil restera parmi les déjà recrutés." : "Votre note et vos mots-clés seront effacés."}
        confirmLabel="Ne plus garder"
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </li>
  );
}

/** A note and tags only the business reads. */
function NoteDialog({
  talent: t,
  name,
  open,
  onOpenChange,
}: Readonly<{ talent: Talent; name: string; open: boolean; onOpenChange: (o: boolean) => void }>) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState(t.note ?? "");
  const [tags, setTags] = useState<string[]>(t.tags);
  const [draft, setDraft] = useState("");
  const save = useMutation({
    mutationFn: () => saveTalent(t.workerId, { note: note.trim() || null, tags: draft.trim() ? [...tags, draft.trim()] : tags }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: talentsKey });
      setDraft("");
      onOpenChange(false);
      toast.success("Enregistré.");
    },
    onError: (err) => toast.error(friendlyError(err, "La note n'a pas pu être enregistrée.")),
  });
  const addDraft = () => {
    const v = draft.trim();
    if (v && !tags.some((x) => x.toLowerCase() === v.toLowerCase()) && tags.length < 8) setTags([...tags, v]);
    setDraft("");
  };

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconNote className="size-5" />}
      title={`Note sur ${name}`}
      description="Visible de votre organisation seulement."
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
          placeholder="Ex. : très ponctuelle, préfère les missions du matin…"
          className="min-h-24 rounded-xl border-0 bg-page px-4 py-3 shadow-none"
        />
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-page p-2">
          {tags.map((x) => (
            <span key={x} className="inline-flex items-center gap-1 rounded-full bg-card py-1 pr-1.5 pl-2.5 font-medium text-xs">
              {x}
              <button type="button" aria-label={`Retirer ${x}`} onClick={() => setTags(tags.filter((y) => y !== x))} className="rounded-full p-0.5 hover:bg-page">
                <IconX className="size-3" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addDraft();
              }
            }}
            onBlur={addDraft}
            maxLength={30}
            placeholder={tags.length < 8 ? "Ajouter un mot-clé…" : "8 mots-clés au plus"}
            disabled={tags.length >= 8}
            className="min-w-32 flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </ActionDialog>
  );
}

/** Choose one of the open offers: the worker is asked, in their notifications, to apply. */
function InviteDialog({
  workerId,
  name,
  open,
  onOpenChange,
}: Readonly<{ workerId: string; name: string; open: boolean; onOpenChange: (o: boolean) => void }>) {
  const offers = useQuery({
    queryKey: [...offersKey, "list", "open"],
    queryFn: () => listOffers({ statuses: ["ACTIVE", "PARTIALLY_FILLED"] }),
    enabled: open,
  });
  const [offerId, setOfferId] = useState("");
  const invite = useMutation({
    mutationFn: () => inviteTalent(workerId, offerId),
    onSuccess: () => {
      onOpenChange(false);
      setOfferId("");
      toast.success(`Invitation envoyée à ${name}.`);
    },
    onError: (err) => toast.error(friendlyError(err, "L'invitation n'a pas pu être envoyée.")),
  });
  const list = offers.data?.items ?? [];

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconSend className="size-5" />}
      title={`Inviter ${name} à postuler`}
      description="L'invitation arrive dans ses notifications : un geste suffit pour postuler."
      confirmLabel="Envoyer l'invitation"
      confirmDisabled={!offerId}
      pending={invite.isPending}
      onConfirm={() => invite.mutate()}
    >
      {offers.isLoading ? (
        <Skeleton className="h-11 rounded-full" />
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">
          Aucune offre en cours.{" "}
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
