"use client";

import { useTradeName } from "#/lib/api/use-trade-name";
import { useLocale, useTranslations } from "next-intl";
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
import { ReachButton } from "#/features/candidates/components/candidate-card";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import { formatRating } from "#/i18n/format";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { listOffers, offersKey } from "#/lib/api/offer-controller";
import { inviteTalent, listTalents, removeTalent, saveTalent, talentsKey, type Talent } from "#/lib/api/talent-controller";
import { cn, getInitials } from "#/lib/utils";
import { PoolCandidatesSection } from "./pool-candidates-section";

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const SOURCE_KEYS = ["rabotka", "external", "cv"] as const;

const TAB_KEYS = ["all", "kept", "alumni"] as const;
type Tab = (typeof TAB_KEYS)[number];

/**
 * « Vivier »: the workers the business keeps and those it already hired —
 * a note and tags of its own, and the way to bring them back: an invitation
 * to apply to an open offer, or their contact.
 */
export function TalentsPage() {
  const t = useTranslations("talents.page");
  const locale = useLocale();
  const friendlyError = useFriendlyError();
  const talents = useQuery({ queryKey: talentsKey, queryFn: listTalents });
  // The tab lives in the URL (?onglet=), so a reload or a shared link keeps it.
  const [tab, setTab] = useQueryState("onglet", parseAsStringLiteral(TAB_KEYS).withDefault("all"));
  // The search and the tag live in the URL too (?q=, ?tag=), so a reload keeps them.
  const [q, setQ] = useQueryState("q", parseAsString.withDefault("").withOptions({ limitUrlUpdates: debounce(300) }));
  const [tag, setTag] = useQueryState("tag");
  // Where the profiles come from (?source=): Rabotka workers, or careers-page
  // candidates kept with consent, or CVs analysed — the last two searched by their CV.
  const [source, setSource] = useQueryState("source", parseAsStringLiteral(SOURCE_KEYS).withDefault("rabotka"));
  const all = useMemo(() => talents.data ?? [], [talents.data]);

  const tags = useMemo(() => [...new Set(all.flatMap((x) => x.tags))].sort((a, b) => a.localeCompare(b, locale)), [all, locale]);
  const shown = all.filter(
    (x) =>
      (tab === "all" || (tab === "kept" ? x.saved : x.missionsWithUs > 0)) &&
      (!tag || x.tags.includes(tag)) &&
      (!q.trim() || fold(`${x.firstName} ${x.lastName} ${x.categoryName ?? ""} ${x.city ?? ""} ${x.description ?? ""} ${x.note ?? ""} ${x.tags.join(" ")}`).includes(fold(q.trim()))),
  );
  const count = (k: Tab) => (k === "all" ? all.length : all.filter((x) => (k === "kept" ? x.saved : x.missionsWithUs > 0)).length);

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("intro")}
        </p>
      </div>

      {/* Rabotka workers, or beyond: careers candidates kept with consent, CVs analysed. */}
      <div role="tablist" aria-label={t("sourcesLabel")} className="inline-flex flex-wrap rounded-full bg-card p-1">
        {SOURCE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={source === key}
            onClick={() => void setSource(key)}
            className={cn(
              "rounded-full px-4 py-2 font-medium text-sm transition-colors",
              source === key ? "bg-ink text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`sources.${key}`)}
          </button>
        ))}
      </div>

      {source !== "rabotka" ? (
        <PoolCandidatesSection key={source} source={source} />
      ) : (
      <section className="space-y-5 rounded-3xl bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" className="inline-flex rounded-full bg-page p-1">
            {TAB_KEYS.map((key) => (
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
                {t(`tabs.${key}`)}
                <span className="tabular-nums opacity-70">{count(key)}</span>
              </button>
            ))}
          </div>
          <div className="relative min-w-60 flex-1">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => void setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 rounded-full border-0 bg-page pl-10 shadow-none focus-visible:ring-2 focus-visible:ring-ink/10"
            />
          </div>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((x) => (
              <button
                key={x}
                type="button"
                aria-pressed={tag === x}
                onClick={() => void setTag(tag === x ? null : x)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium text-xs transition-colors",
                  tag === x ? "bg-ink text-white" : "bg-page text-muted-foreground hover:text-foreground",
                )}
              >
                {x}
              </button>
            ))}
          </div>
        )}

        {talents.isLoading ? (
          <CardGridSkeleton kind="talent" />
        ) : !talents.data ? (
          <p className="text-muted-foreground">{friendlyError(talents.error, t("unavailable"))}</p>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
              <IconBookmark className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">{all.length === 0 ? t("emptyTitle") : t("nobody")}</p>
            <p className="max-w-md text-muted-foreground text-sm">
              {all.length === 0
                ? t("emptyText")
                : t("nobodyText")}
            </p>
            {all.length === 0 && (
              <Link href="/espace/recherche" className="font-medium text-sm text-whatsapp-dark hover:underline">
                {t("searchLink")}
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((x) => (
              <TalentCard key={x.workerId} talent={x} />
            ))}
          </ul>
        )}
      </section>
      )}
    </div>
  );
}

function TalentCard({ talent: t }: Readonly<{ talent: Talent }>) {
  const tt = useTranslations("talents.page");
  const trade = useTradeName();
  const tCard = useTranslations("candidates.card");
  const locale = useLocale();
  const friendlyError = useFriendlyError();
  const monthYear = (iso: string) => new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { month: "long", year: "numeric" });
  const queryClient = useQueryClient();
  const name = `${t.firstName} ${t.lastName}`.trim();
  const [dialog, setDialog] = useState<"note" | "invite" | "remove" | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: talentsKey });

  const keep = useMutation({
    mutationFn: () => saveTalent(t.workerId),
    onSuccess: () => {
      refresh();
      toast.success(tt("added", { name }));
    },
    onError: (err) => toast.error(friendlyError(err, tt("updateFailed"))),
  });
  const remove = useMutation({
    mutationFn: () => removeTalent(t.workerId),
    onSuccess: () => {
      refresh();
      setDialog(null);
      toast.success(tt("removed", { name }));
    },
    onError: (err) => toast.error(friendlyError(err, tt("updateFailed"))),
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
            <p className="truncate text-muted-foreground text-sm">{[t.categoryName && trade(t.categoryName), t.city].filter(Boolean).join(" · ")}</p>
          )}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs">
            {t.ratingAvg !== null && t.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium">
                <IconStarFilled className="size-3.5 text-amber-400" />
                {formatRating(t.ratingAvg, locale as Locale)}
              </span>
            )}
            {t.reliabilityScore !== null && (
              <span className="inline-flex items-center gap-1 font-medium" title={tCard("reliabilityHint")}>
                <IconShieldCheck className="size-3.5 text-whatsapp-dark" />
                {t.reliabilityScore}/100
              </span>
            )}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={tt("moreActions")} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card outline-none hover:bg-card/70">
            <IconDots className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
            {t.saved ? (
              <>
                <DropdownMenuItem onSelect={() => setDialog("note")} className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-page">
                  <IconNote className="size-4" />
                  {tt("noteAndTags")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setDialog("remove")}
                  className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-destructive text-sm focus:bg-destructive/10 focus:text-destructive"
                >
                  <IconTrash className="size-4" />
                  {tt("stopKeeping")}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onSelect={() => keep.mutate()} className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-page">
                <IconBookmark className="size-4" />
                {tt("keepInMine")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {t.missionsWithUs > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-chip-green px-2.5 py-0.5 font-medium text-chip-green-foreground text-xs">
            <IconBriefcase className="size-3.5" />
            {tt("missionsWithUs", { count: t.missionsWithUs })}
          </span>
        )}
        {t.saved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-lime px-2.5 py-0.5 font-medium text-[#0f2414] text-xs">
            <IconBookmark className="size-3.5" />
            {tt("kept")}
          </span>
        )}
        {!t.available && <span className="rounded-full bg-card px-2.5 py-0.5 font-medium text-muted-foreground text-xs">{tt("notAvailable")}</span>}
        {t.tags.map((x) => (
          <span key={x} className="rounded-full bg-card px-2.5 py-0.5 font-medium text-xs">
            {x}
          </span>
        ))}
      </div>

      {t.lastMissionTitle && t.lastMissionAt && (
        <p className="text-muted-foreground text-xs">
          {tt.rich("lastMission", {
            title: t.lastMissionTitle,
            date: monthYear(t.lastMissionAt),
            b: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
          })}
        </p>
      )}
      {t.description && <p className="line-clamp-2 text-muted-foreground text-sm leading-relaxed">{t.description}</p>}
      {t.note && <p className="line-clamp-3 rounded-2xl bg-card p-3 text-sm italic">{tt("quoted", { note: t.note })}</p>}

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          disabled={!t.available}
          onClick={() => setDialog("invite")}
          className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-brand-lime px-4 font-medium text-[#0f2414] text-sm hover:bg-brand-lime/80 disabled:opacity-50"
        >
          <IconSend className="size-4 shrink-0" />
          {tt("invite")}
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
        title={tt("removeTitle", { name })}
        description={t.missionsWithUs > 0 ? tt("removeTextAlumni") : tt("removeText")}
        confirmLabel={tt("stopKeeping")}
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
  const tt = useTranslations("talents.page");
  const friendlyError = useFriendlyError();
  const [note, setNote] = useState(t.note ?? "");
  const [tags, setTags] = useState<string[]>(t.tags);
  const [draft, setDraft] = useState("");
  const save = useMutation({
    mutationFn: () => saveTalent(t.workerId, { note: note.trim() || null, tags: draft.trim() ? [...tags, draft.trim()] : tags }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: talentsKey });
      setDraft("");
      onOpenChange(false);
      toast.success(tt("saved"));
    },
    onError: (err) => toast.error(friendlyError(err, tt("noteFailed"))),
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
      title={tt("noteTitle", { name })}
      description={tt("noteDescription")}
      confirmLabel={tt("save")}
      pending={save.isPending}
      onConfirm={() => save.mutate()}
    >
      <div className="space-y-3">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder={tt("notePlaceholder")}
          className="min-h-24 rounded-xl border-0 bg-page px-4 py-3 shadow-none"
        />
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-page p-2">
          {tags.map((x) => (
            <span key={x} className="inline-flex items-center gap-1 rounded-full bg-card py-1 pr-1.5 pl-2.5 font-medium text-xs">
              {x}
              <button type="button" aria-label={tt("removeTag", { tag: x })} onClick={() => setTags(tags.filter((y) => y !== x))} className="rounded-full p-0.5 hover:bg-page">
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
            placeholder={tags.length < 8 ? tt("addTag") : tt("maxTags", { max: 8 })}
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
  const tt = useTranslations("talents.page");
  const friendlyError = useFriendlyError();
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
      toast.success(tt("invited", { name }));
    },
    onError: (err) => toast.error(friendlyError(err, tt("inviteFailed"))),
  });
  const list = offers.data?.items ?? [];

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconSend className="size-5" />}
      title={tt("inviteTitle", { name })}
      description={tt("inviteDescription")}
      confirmLabel={tt("sendInvite")}
      confirmDisabled={!offerId}
      pending={invite.isPending}
      onConfirm={() => invite.mutate()}
    >
      {offers.isLoading ? (
        <Skeleton className="h-11 rounded-full" />
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">
          {tt("noOffer")}{" "}
          <Link href="/espace/offres/nouvelle" className="font-medium text-whatsapp-dark underline">
            {tt("publish")}
          </Link>
        </p>
      ) : (
        <Select value={offerId} onValueChange={setOfferId}>
          <SelectTrigger aria-label={tt("offerLabel")} className="h-11 w-full rounded-full border-0 bg-page px-4 font-medium shadow-none dark:bg-page">
            <SelectValue placeholder={tt("chooseOffer")} />
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
