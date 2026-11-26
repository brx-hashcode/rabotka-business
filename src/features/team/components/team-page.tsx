"use client";

import { useLocale, useTranslations } from "next-intl";
import { useWhyNot } from "#/lib/use-why-not";
import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconBriefcase,
  IconCheck,
  IconCrown,
  IconDots,
  IconMessageCircle,
  IconShieldCheck,
  IconLock,
  IconMail,
  IconPlus,
  IconSend,
  IconUserMinus,
  IconUserPlus,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Bone } from "#/components/page-skeletons";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { timeAgo } from "#/lib/api/notification-controller";
import {
  activityKey,
  getActivity,
  getTeam,
  inviteMember,
  removeMember,
  resendInvite,
  setMemberRole,
  teamKey,
  type InvitedRole,
  type SeatRole,
  type Seats,
  type Team,
  type TeamMember,
} from "#/lib/api/team-controller";
import { cn, getInitials } from "#/lib/utils";
import { activityLabel, activityOfferId } from "../activity-labels";
import { isAdmin } from "../member-access";
import { useMember } from "../use-member";

/** The plan's seats, as the places bar shows them: one limit a role. */
const SEATS: SeatRole[] = ["ADMIN", "RECRUITER", "REVIEWER"];

/** In the invite dialog: the role most given first, the widest last. */
const ROLE_ORDER: InvitedRole[] = ["RECRUITER", "REVIEWER", "ADMIN"];

const ROLE_ICON: Record<InvitedRole, typeof IconBriefcase> = {
  RECRUITER: IconBriefcase,
  REVIEWER: IconMessageCircle,
  ADMIN: IconShieldCheck,
};

/** The list's order: the holder, then administrators, recruiters, evaluators; by name within each. */
const RANK: Record<InvitedRole, number> = { ADMIN: 0, RECRUITER: 1, REVIEWER: 2 };
const byRank = (a: TeamMember, b: TeamMember) =>
  Number(b.isOwner) - Number(a.isOwner) || RANK[a.role] - RANK[b.role] || a.name.localeCompare(b.name);

/** The roles someone may give: administrators are the holder's to make. */
const rolesFor = (isOwner: boolean): InvitedRole[] =>
  isOwner ? ["ADMIN", "RECRUITER", "REVIEWER"] : ["RECRUITER", "REVIEWER"];

/**
 * « Équipe »: the people who work in the space, and who did what. The account
 * holder — who created the account — may add administrators, and only it
 * manages them; any administrator invites Recruteurs and Évaluateurs. Each
 * takes a place of the plan, an administrator a recruiter's.
 */
export function TeamPage() {
  const t = useTranslations("team.page");
  const { role, isLoading } = useMember();
  const [tab, setTab] = useState<"members" | "activity">("members");

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("intro")}
        </p>
      </div>

      {isLoading ? (
        <MembersBones />
      ) : !isAdmin(role) ? (
        <div className="flex items-start gap-4 rounded-3xl bg-card p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-page">
            <IconLock className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="font-semibold">{t("adminOnly")}</p>
            <p className="text-muted-foreground text-sm">{t("adminOnlyText")}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label={t("title")} className="inline-flex rounded-full bg-card p-1">
            {(["members", "activity"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-full px-4 py-1.5 font-medium text-sm",
                  tab === key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`tabs.${key}`)}
              </button>
            ))}
          </div>
          {tab === "members" && <InviteButton />}
          </div>
          {tab === "members" ? <Members /> : <Activity />}
        </>
      )}
    </div>
  );
}

// ── Members ────────────────────────────────────────────────────────────

function Members() {
  const t = useTranslations("team.members");
  const friendlyError = useFriendlyError();
  const queryClient = useQueryClient();
  const team = useQuery({ queryKey: teamKey, queryFn: getTeam });
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: teamKey });

  const remove = useMutation({
    mutationFn: (id: string) => removeMember(id),
    onSuccess: () => {
      toast.success(t("removed", { name: removing?.name ?? t("aMember") }));
      setRemoving(null);
      refresh();
    },
    onError: (err) => toast.error(friendlyError(err, t("removeFailed"))),
  });

  if (team.isLoading) return <MembersBones />;
  if (!team.data) {
    return <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(team.error, t("loadFailed"))}</p>;
  }
  const { members, seats } = team.data;

  return (
    <div className="space-y-4">
      <Places seats={seats} />

      <section className="overflow-hidden rounded-3xl bg-card">
        <p className="px-5 pt-4 pb-1 font-semibold">
          {t("heading")} <span className="font-normal text-muted-foreground">({members.length})</span>
        </p>
        <ul className="divide-y divide-page">
          {[...members].sort(byRank).map((m) => (
            <MemberRow key={m.id} member={m} seats={seats} onRemove={() => setRemoving(m)} onChanged={refresh} />
          ))}
        </ul>
        {members.length === 1 && (
          <div className="flex items-center gap-4 bg-page/40 px-5 py-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card">
              <IconUserPlus className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-sm">{t("alone")}</p>
              <p className="text-muted-foreground text-sm">
                {t("aloneText")}
              </p>
            </div>
          </div>
        )}
      </section>

      <ActionDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        tone="warning"
        icon={<IconUserMinus className="size-5" />}
        title={t("removeTitle", { name: removing?.name ?? "" })}
        description={t("removeText")}
        confirmLabel={t("remove")}
        pending={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </div>
  );
}

/** No seat known (a backend older than the role's limit): no place to give. */
const hasPlace = (s: Seats | undefined) => !!s && (s.limit === null || s.used < s.limit);

/** The roles the backend sends seats for, with their seats. */
const seatsOf = (seats: Team["seats"]) =>
  SEATS.flatMap((role) => {
    const s = seats[role];
    return s ? [{ role, ...s }] : [];
  });

/** « Inviter », beside the tabs: off when the plan has no place left. */
function InviteButton() {
  const t = useTranslations("team.members");
  const queryClient = useQueryClient();
  const team = useQuery({ queryKey: teamKey, queryFn: getTeam });
  const [open, setOpen] = useState(false);
  const seats = team.data?.seats;
  const anyPlace = !!seats && SEATS.some((r) => hasPlace(seats[r]));
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!anyPlace}
        title={seats && !anyPlace ? t("allTaken") : undefined}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 font-medium text-sm text-white disabled:opacity-40"
      >
        <IconUserPlus className="size-4" />
        {t("invite")}
      </button>
      {seats && (
        <InviteDialog
          open={open}
          onOpenChange={setOpen}
          seats={seats}
          onInvited={() => void queryClient.invalidateQueries({ queryKey: teamKey })}
        />
      )}
    </>
  );
}

/**
 * The places per role: the people in the team now (invited or active), freed
 * when someone leaves. Above the plan (after a smaller plan), how many to
 * take out; with none left, the way to more.
 */
function Places({ seats }: Readonly<{ seats: Team["seats"] }>) {
  const t = useTranslations("team.members");
  const known = seatsOf(seats);
  const anyPlace = known.some((s) => hasPlace(s));
  const none = known.every((s) => s.limit === 0);
  const over = known.map((s) => ({ role: s.role, extra: s.limit === null ? 0 : s.used - s.limit })).filter(
    (o) => o.extra > 0,
  );
  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl bg-card px-5 py-4">
      <p className="font-medium text-sm">{t("places")}</p>
      <div className="flex flex-wrap gap-2">
        {known.map((r) => (
          <SeatPill key={r.role} role={r.role} used={r.used} limit={r.limit} />
        ))}
      </div>
      {over.length > 0 && (
        <p className="w-full rounded-2xl bg-chip-amber px-4 py-3 text-chip-amber-foreground text-sm">
          {t("over", { list: over.map(({ role, extra }) => t("overOne", { role, count: extra })).join(", ") })}
        </p>
      )}
      {!anyPlace && over.length === 0 && (
        <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground text-sm sm:ml-auto">
          {none ? t("noSeats") : t("full")}
          <Link href="/espace/abonnement" className="font-medium text-foreground underline underline-offset-2">
            {t("changePlan")}
          </Link>
        </p>
      )}
    </section>
  );
}

function SeatPill({ role, used, limit }: Readonly<{ role: SeatRole; used: number; limit: number | null }>) {
  const t = useTranslations("team");
  const full = limit !== null && used >= limit;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm",
        full ? "bg-page text-muted-foreground" : "bg-selected text-selected-foreground",
      )}
    >
      {t(`rolePlural.${role}`)}
      <span className="font-semibold tabular-nums">{limit === null ? t("members.unlimited", { used }) : `${used} / ${limit}`}</span>
    </span>
  );
}

function MemberRow({
  member,
  seats,
  onRemove,
  onChanged,
}: Readonly<{ member: TeamMember; seats: Team["seats"]; onRemove: () => void; onChanged: () => void }>) {
  const t = useTranslations("team.members");
  const tTeam = useTranslations("team");
  const whyNot = useWhyNot();
  const locale = useLocale();
  const friendlyError = useFriendlyError();
  const { member: me } = useMember();
  const resend = useMutation({
    mutationFn: () => resendInvite(member.id),
    onSuccess: () => {
      toast.success(t("resent", { email: member.email }));
      setAsked(null);
    },
    onError: (err) => toast.error(friendlyError(err, t("resendFailed"))),
  });
  // What the menu asked for, confirmed in a dialog before it is done.
  const [asked, setAsked] = useState<{ kind: "role"; role: InvitedRole } | { kind: "resend" } | null>(null);
  const role = useMutation({
    mutationFn: (next: InvitedRole) => setMemberRole(member.id, next),
    onSuccess: (m) => {
      toast.success(t("roleChanged", { name: m.name, role: m.role }));
      setAsked(null);
      onChanged();
    },
    onError: (err) => toast.error(friendlyError(err, t("roleFailed"))),
  });
  const invited = member.status === "INVITED";
  // Nobody changes the holder or themselves, and administrators are the
  // holder's to manage: the API refuses the rest, so the menu doesn't offer it.
  const meIsOwner = me?.isOwner ?? false;
  const canManage = !member.isOwner && member.id !== me?.id && (meIsOwner || member.role !== "ADMIN");
  const seatFull = (r: InvitedRole) => !hasPlace(seats[r]);

  return (
    <li className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
      <Avatar className="size-11 shrink-0 rounded-2xl">
        <AvatarFallback className={cn("rounded-2xl font-medium", invited ? "bg-page text-muted-foreground" : "bg-brand-lime text-[#0f2414]")}>
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-medium">
          <span className="truncate">{member.name}</span>
          {member.isOwner && <IconCrown className="size-4 shrink-0 text-chip-amber-foreground" aria-label={t("owner")} />}
          {member.id === me?.id && (
            <span className="shrink-0 rounded-full bg-selected px-2 py-0.5 font-medium text-[11px] text-selected-foreground">
              {t("you")}
            </span>
          )}
        </p>
        <p className="truncate text-muted-foreground text-xs">
          {member.email}
          {" · "}
          {invited
            ? member.invitedAt
              ? t("invitedAgo", { ago: timeAgo(member.invitedAt, locale) })
              : t("invitedNoDate")
            : member.lastSeenAt
              ? t("seenAgo", { ago: timeAgo(member.lastSeenAt, locale) })
              : t("active")}
        </p>
      </div>
      <RoleBadge member={member} />
      {/* The menu's place is kept when there is none, so every badge lines up. */}
      {!canManage && <span aria-hidden className="size-9 shrink-0" />}
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t("actionsFor", { name: member.name })}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-page hover:bg-page/70"
          >
            <IconDots className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
            {[...rolesFor(meIsOwner)]
              .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))
              .filter((r) => r !== member.role)
              .map((r) => {
                const full = seatFull(r);
                const Icon = ROLE_ICON[r];
                return (
                  <DropdownMenuItem
                    key={r}
                    disabled={full}
                    title={whyNot([full, { say: t("seatsTaken") }])}
                    onSelect={() => setAsked({ kind: "role", role: r })}
                    className="cursor-pointer items-start gap-3 rounded-xl px-2.5 py-2"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-page">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-sm">{t("makeRole", { role: r })}</span>
                      <span className="block text-muted-foreground text-xs">
                        {full ? t("seatsTaken") : tTeam(`roleHint.${r}`)}
                      </span>
                    </span>
                  </DropdownMenuItem>
                );
              })}
            <DropdownMenuSeparator className="mx-2 my-1.5 bg-page" />
            {invited && (
              <DropdownMenuItem
                onSelect={() => setAsked({ kind: "resend" })}
                className="cursor-pointer gap-3 rounded-xl px-2.5 py-2 text-sm"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-page">
                  <IconSend className="size-4" />
                </span>
                {t("resend")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={onRemove}
              className="cursor-pointer gap-3 rounded-xl px-2.5 py-2 text-destructive text-sm focus:text-destructive"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <IconUserMinus className="size-4" />
              </span>
              {t("removeFromTeam")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {asked?.kind === "role" && (
        <ActionDialog
          open
          onOpenChange={(open) => !open && setAsked(null)}
          tone={asked.role === "ADMIN" ? "warning" : "default"}
          icon={(() => {
            const Icon = ROLE_ICON[asked.role];
            return <Icon className="size-5" />;
          })()}
          title={t("roleTitle", { name: member.name, role: asked.role })}
          description={t("roleText", { role: asked.role })}
          confirmLabel={t("makeRole", { role: asked.role })}
          pending={role.isPending}
          onConfirm={() => role.mutate(asked.role)}
        />
      )}
      {asked?.kind === "resend" && (
        <ActionDialog
          open
          onOpenChange={(open) => !open && setAsked(null)}
          icon={<IconSend className="size-5" />}
          title={t("resendTitle", { email: member.email })}
          description={t("resendText")}
          confirmLabel={t("resend")}
          pending={resend.isPending}
          onConfirm={() => resend.mutate()}
        />
      )}
    </li>
  );
}

/** The role, with the icon the invitation shows it with; « Invitation envoyée » until they join. */
function RoleBadge({ member }: Readonly<{ member: TeamMember }>) {
  const t = useTranslations("team.members");
  const tLabels = useTranslations("labels");
  if (member.status === "INVITED") {
    return (
      <span className="hidden shrink-0 rounded-full bg-chip-amber px-2.5 py-1 font-medium text-chip-amber-foreground text-xs sm:inline">
        {t("inviteSent")}
      </span>
    );
  }
  const Icon = member.isOwner ? IconCrown : ROLE_ICON[member.role];
  return (
    <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-page px-2.5 py-1 font-medium text-muted-foreground text-xs sm:inline-flex">
      <Icon className="size-3.5" />
      {member.isOwner ? t("owner") : tLabels(`role.${member.role}`)}
    </span>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  seats,
  onInvited,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void; seats: Team["seats"]; onInvited: () => void }>) {
  const t = useTranslations("team.invite");
  const whyNot = useWhyNot();
  const tTeam = useTranslations("team");
  const tLabels = useTranslations("labels");
  const friendlyError = useFriendlyError();
  const { member: me } = useMember();
  const roles = rolesFor(me?.isOwner ?? false);
  const free = (r: InvitedRole) => hasPlace(seats[r]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitedRole>(free("RECRUITER") ? "RECRUITER" : "REVIEWER");
  const invite = useMutation({
    mutationFn: () => inviteMember({ name: name.trim(), email: email.trim(), role }),
    onSuccess: (m) => {
      toast.success(t("sent", { email: m.email }));
      setName("");
      setEmail("");
      onOpenChange(false);
      onInvited();
    },
    onError: (err) => toast.error(friendlyError(err, t("failed"))),
  });
  const valid = name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email.trim()) && free(role);

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      wide
      icon={<IconMail className="size-5" />}
      title={t("title")}
      description={t("text")}
      confirmLabel={t("confirm")}
      confirmDisabled={!valid}
      confirmDisabledReason={free(role) ? undefined : tTeam("members.seatsTaken")}
      pending={invite.isPending}
      onConfirm={() => valid && invite.mutate()}
    >
      <div className="space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("name")}
          maxLength={120}
          aria-label={t("name")}
          className="h-12 rounded-xl border-0 bg-page px-4 shadow-none"
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          maxLength={200}
          aria-label={t("email")}
          className="h-12 rounded-xl border-0 bg-page px-4 shadow-none"
        />
        <div role="radiogroup" aria-label={t("role")} className="space-y-2 pt-1">
          <p className="px-1 font-medium text-muted-foreground text-xs">{t("role")}</p>
          {/* One row a role, the one most given first: three cards side by
              side wrapped every hint over four lines. */}
          {[...roles].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b)).map((r) => {
            const Icon = ROLE_ICON[r];
            const on = role === r;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={!free(r)}
                title={whyNot([!free(r), { say: tTeam("members.seatsTaken") }])}
                onClick={() => setRole(r)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  on ? "bg-selected text-selected-foreground" : "bg-page hover:bg-page/70",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    on ? "bg-brand-lime text-brand-lime-foreground" : "bg-card",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-sm">{tLabels(`role.${r}`)}</span>
                  <span className={cn("block text-xs", on ? "opacity-80" : "text-muted-foreground")}>
                    {free(r) ? tTeam(`roleHint.${r}`) : tTeam("members.seatsTaken")}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    on ? "bg-brand-lime text-brand-lime-foreground" : "bg-card",
                  )}
                >
                  {on && <IconCheck className="size-3.5" stroke={3} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </ActionDialog>
  );
}

// ── Activity ───────────────────────────────────────────────────────────

function Activity() {
  const t = useTranslations("team.activity");
  const whyNot = useWhyNot();
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const team = useQuery({ queryKey: teamKey, queryFn: getTeam });
  const [memberId, setMemberId] = useState<string | undefined>(undefined);
  const activity = useInfiniteQuery({
    queryKey: [...activityKey, memberId ?? "all"],
    queryFn: ({ pageParam }) => getActivity({ page: pageParam, memberId }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
  const items = activity.data?.pages.flatMap((p) => p.items) ?? [];
  const people = (team.data?.members ?? []).filter((m) => m.status !== "INVITED");

  return (
    <div className="space-y-4">
      {people.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {[{ id: undefined, name: t("everyone") }, ...people].map((p) => (
            <button
              key={p.id ?? "all"}
              type="button"
              aria-pressed={memberId === p.id}
              onClick={() => setMemberId(p.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-medium text-sm",
                memberId === p.id ? "bg-selected text-selected-foreground" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {activity.isLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} onPage className="h-16 rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-3xl bg-card px-6 py-10 text-center text-muted-foreground text-sm">
          {t("empty")}
        </p>
      ) : (
        <ul className="divide-y divide-page overflow-hidden rounded-3xl bg-card">
          {items.map((it) => {
            const offerId = activityOfferId(it.action, it.targetId);
            return (
              <li key={it.id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar className="size-9 shrink-0 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-page font-medium text-xs">
                    {it.member ? getInitials(it.member.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{it.member?.name ?? t("formerMember")}</span> {activityLabel(it.action, t)}
                  {offerId && (
                    <>
                      {" · "}
                      <Link href={`/espace/offres/${offerId}`} className="font-medium underline underline-offset-2">
                        {t("seeOffer")}
                      </Link>
                    </>
                  )}
                </p>
                <span className="shrink-0 text-muted-foreground text-xs">{timeAgo(it.at, locale)}</span>
              </li>
            );
          })}
        </ul>
      )}
      {activity.hasNextPage && (
        <button
          type="button"
          onClick={() => void activity.fetchNextPage()}
          disabled={activity.isFetchingNextPage}
          title={whyNot([activity.isFetchingNextPage, "wait"])}
          className="mx-auto flex h-10 items-center gap-2 rounded-full bg-card px-5 font-medium text-sm"
        >
          <IconPlus className="size-4" />
          {tCommon("seeMore")}
        </button>
      )}
    </div>
  );
}

function MembersBones() {
  return (
    <div className="space-y-4">
      <Bone onPage className="h-16 rounded-3xl" />
      <div className="space-y-3 rounded-3xl bg-card p-5">
        <Bone className="h-5 w-28" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Bone className="size-11 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-56 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
