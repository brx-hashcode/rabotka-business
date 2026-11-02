"use client";

import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconCrown,
  IconDots,
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
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { friendlyError } from "#/lib/api/friendly-error";
import { timeAgo } from "#/lib/api/notification-controller";
import {
  activityKey,
  getActivity,
  getTeam,
  inviteMember,
  removeMember,
  resendInvite,
  ROLE_HINT,
  ROLE_LABEL,
  setMemberRole,
  teamKey,
  type InvitedRole,
  type Seats,
  type Team,
  type TeamMember,
} from "#/lib/api/team-controller";
import { cn, getInitials } from "#/lib/utils";
import { activityLabel, activityOfferId } from "../activity-labels";
import { isAdmin } from "../member-access";
import { useMember } from "../use-member";

const INVITED: InvitedRole[] = ["RECRUITER", "REVIEWER"];
const PLURAL: Record<InvitedRole, string> = { RECRUITER: "Recruteurs", REVIEWER: "Évaluateurs" };

/**
 * « Équipe »: the people who work in the space, and who did what. The account
 * holder is the one administrator; it invites Recruteurs and Évaluateurs,
 * each up to its plan's limit.
 */
export function TeamPage() {
  const { role, isLoading } = useMember();
  const [tab, setTab] = useState<"members" | "activity">("members");

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Équipe</h1>
        <p className="text-muted-foreground">
          Invitez vos collègues : chacun se connecte avec sa propre adresse e-mail, avec le rôle que vous lui donnez.
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
            <p className="font-semibold">Réservé à l&apos;administrateur</p>
            <p className="text-muted-foreground text-sm">Le responsable du compte gère l&apos;équipe et les rôles.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Équipe" className="inline-flex rounded-full bg-card p-1">
            {(
              [
                ["members", "Membres"],
                ["activity", "Activité"],
              ] as const
            ).map(([key, label]) => (
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
                {label}
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
  const queryClient = useQueryClient();
  const team = useQuery({ queryKey: teamKey, queryFn: getTeam });
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: teamKey });

  const remove = useMutation({
    mutationFn: (id: string) => removeMember(id),
    onSuccess: () => {
      toast.success(`${removing?.name ?? "Le membre"} n'a plus accès à l'espace.`);
      setRemoving(null);
      refresh();
    },
    onError: (err) => toast.error(friendlyError(err, "Le membre n'a pas pu être retiré.")),
  });

  if (team.isLoading) return <MembersBones />;
  if (!team.data) {
    return <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(team.error, "L'équipe n'a pas pu être chargée.")}</p>;
  }
  const { members, seats } = team.data;

  return (
    <div className="space-y-4">
      <Places seats={seats} />

      <section className="overflow-hidden rounded-3xl bg-card">
        <p className="px-5 pt-4 pb-1 font-semibold">
          Membres <span className="font-normal text-muted-foreground">({members.length})</span>
        </p>
        <ul className="divide-y divide-page">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} seats={seats} onRemove={() => setRemoving(m)} onChanged={refresh} />
          ))}
        </ul>
        {members.length === 1 && (
          <div className="flex items-center gap-4 bg-page/40 px-5 py-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card">
              <IconUserPlus className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-sm">Vous êtes seul dans l&apos;espace</p>
              <p className="text-muted-foreground text-sm">
                Un recruteur publie et trie avec vous ; un évaluateur donne son avis sur les candidats.
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
        title={`Retirer ${removing?.name ?? ""} de l'équipe ?`}
        description="Sa session s'arrête aussitôt. Ce qu'il a fait reste : offres, décisions, notes."
        confirmLabel="Retirer"
        pending={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </div>
  );
}

const hasPlace = (s: Seats) => s.limit === null || s.used < s.limit;

/** « Inviter », beside the tabs: off when the plan has no place left. */
function InviteButton() {
  const queryClient = useQueryClient();
  const team = useQuery({ queryKey: teamKey, queryFn: getTeam });
  const [open, setOpen] = useState(false);
  const seats = team.data?.seats;
  const anyPlace = !!seats && INVITED.some((r) => hasPlace(seats[r]));
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!anyPlace}
        title={seats && !anyPlace ? "Plus de place avant le renouvellement" : undefined}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 font-medium text-sm text-white disabled:opacity-40"
      >
        <IconUserPlus className="size-4" />
        Inviter un collègue
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

/** The places per role added this period (a new period frees them), with the way to more when none is left. */
function Places({ seats }: Readonly<{ seats: Team["seats"] }>) {
  const anyPlace = INVITED.some((r) => hasPlace(seats[r]));
  const none = INVITED.every((r) => seats[r].limit === 0);
  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl bg-card px-5 py-4">
      <p className="font-medium text-sm">Places jusqu&apos;au renouvellement</p>
      <div className="flex flex-wrap gap-2">
        {INVITED.map((r) => (
          <SeatPill key={r} role={r} used={seats[r].used} limit={seats[r].limit} />
        ))}
      </div>
      {!anyPlace && (
        <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground text-sm sm:ml-auto">
          {none ? "Votre formule n'inclut pas de membres d'équipe." : "Toutes les places sont utilisées : elles reviennent au renouvellement de votre formule."}
          <Link href="/espace/abonnement" className="font-medium text-foreground underline underline-offset-2">
            Changer de formule
          </Link>
        </p>
      )}
    </section>
  );
}

function SeatPill({ role, used, limit }: Readonly<{ role: InvitedRole; used: number; limit: number | null }>) {
  const full = limit !== null && used >= limit;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm",
        full ? "bg-page text-muted-foreground" : "bg-selected text-selected-foreground",
      )}
    >
      {PLURAL[role]}
      <span className="font-semibold tabular-nums">{limit === null ? `${used} · illimité` : `${used} / ${limit}`}</span>
    </span>
  );
}

function MemberRow({
  member,
  seats,
  onRemove,
  onChanged,
}: Readonly<{ member: TeamMember; seats: Team["seats"]; onRemove: () => void; onChanged: () => void }>) {
  const resend = useMutation({
    mutationFn: () => resendInvite(member.id),
    onSuccess: () => toast.success(`Invitation renvoyée à ${member.email}.`),
    onError: (err) => toast.error(friendlyError(err, "L'invitation n'a pas pu être renvoyée.")),
  });
  const role = useMutation({
    mutationFn: (next: InvitedRole) => setMemberRole(member.id, next),
    onSuccess: (m) => {
      toast.success(`${m.name} est maintenant ${ROLE_LABEL[m.role].toLowerCase()}.`);
      onChanged();
    },
    onError: (err) => toast.error(friendlyError(err, "Le rôle n'a pas pu être changé.")),
  });
  const invited = member.status === "INVITED";

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
          {member.isOwner && <IconCrown className="size-4 shrink-0 text-chip-amber-foreground" aria-label="Responsable du compte" />}
        </p>
        <p className="truncate text-muted-foreground text-xs">
          {member.email}
          {" · "}
          {invited
            ? `invité ${member.invitedAt ? timeAgo(member.invitedAt) : ""}`
            : member.lastSeenAt
              ? `vu ${timeAgo(member.lastSeenAt)}`
              : "actif"}
        </p>
      </div>
      <span
        className={cn(
          "hidden shrink-0 rounded-full px-2.5 py-1 font-medium text-xs sm:inline",
          invited ? "bg-chip-amber text-chip-amber-foreground" : "bg-page text-muted-foreground",
        )}
      >
        {invited ? "Invitation envoyée" : member.isOwner ? "Responsable du compte" : ROLE_LABEL[member.role]}
      </span>
      {!member.isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions pour ${member.name}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-page hover:bg-page/70"
          >
            <IconDots className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
            {INVITED.filter((r) => r !== member.role).map((r) => {
              const full = seats[r].limit !== null && seats[r].used >= seats[r].limit!;
              return (
                <DropdownMenuItem
                  key={r}
                  disabled={full || role.isPending}
                  onSelect={() => role.mutate(r)}
                  className="cursor-pointer flex-col items-start gap-0 rounded-xl px-3 py-2"
                >
                  <span className="font-medium text-sm">Passer {ROLE_LABEL[r].toLowerCase()}</span>
                  <span className="text-muted-foreground text-xs">{full ? "Plus de place avant le renouvellement" : ROLE_HINT[r]}</span>
                </DropdownMenuItem>
              );
            })}
            {invited && (
              <DropdownMenuItem
                disabled={resend.isPending}
                onSelect={() => resend.mutate()}
                className="cursor-pointer gap-2 rounded-xl px-3 py-2 text-sm"
              >
                <IconSend className="size-4" />
                Renvoyer l&apos;invitation
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onRemove} className="cursor-pointer gap-2 rounded-xl px-3 py-2 text-destructive text-sm focus:text-destructive">
              <IconUserMinus className="size-4" />
              Retirer de l&apos;équipe
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  seats,
  onInvited,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void; seats: Team["seats"]; onInvited: () => void }>) {
  const free = (r: InvitedRole) => seats[r].limit === null || seats[r].used < seats[r].limit!;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitedRole>(free("RECRUITER") ? "RECRUITER" : "REVIEWER");
  const invite = useMutation({
    mutationFn: () => inviteMember({ name: name.trim(), email: email.trim(), role }),
    onSuccess: (m) => {
      toast.success(`Invitation envoyée à ${m.email}.`);
      setName("");
      setEmail("");
      onOpenChange(false);
      onInvited();
    },
    onError: (err) => toast.error(friendlyError(err, "L'invitation n'a pas pu être envoyée.")),
  });
  const valid = name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email.trim()) && free(role);

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconMail className="size-5" />}
      title="Inviter un collègue"
      description="Il reçoit un e-mail pour rejoindre l'espace, et se connecte avec cette adresse."
      confirmLabel="Envoyer l'invitation"
      confirmDisabled={!valid}
      pending={invite.isPending}
      onConfirm={() => valid && invite.mutate()}
    >
      <div className="space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom et prénom"
          maxLength={120}
          aria-label="Nom et prénom"
          className="h-12 rounded-xl border-0 bg-page px-4 shadow-none"
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Adresse e-mail professionnelle"
          maxLength={200}
          aria-label="Adresse e-mail"
          className="h-12 rounded-xl border-0 bg-page px-4 shadow-none"
        />
        <div role="radiogroup" aria-label="Rôle" className="grid gap-2 sm:grid-cols-2">
          {INVITED.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              disabled={!free(r)}
              onClick={() => setRole(r)}
              className={cn(
                "space-y-0.5 rounded-2xl p-3 text-left transition-colors disabled:opacity-50",
                role === r ? "bg-selected text-selected-foreground" : "bg-page hover:bg-page/70",
              )}
            >
              <span className="block font-medium text-sm">{ROLE_LABEL[r]}</span>
              <span className={cn("block text-xs", role === r ? "opacity-80" : "text-muted-foreground")}>
                {free(r) ? ROLE_HINT[r] : "Plus de place avant le renouvellement"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </ActionDialog>
  );
}

// ── Activity ───────────────────────────────────────────────────────────

function Activity() {
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
          {[{ id: undefined, name: "Tout le monde" }, ...people].map((p) => (
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
          Rien pour l&apos;instant : chaque offre publiée, candidat retenu ou entretien proposé apparaîtra ici, avec qui l&apos;a fait.
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
                  <span className="font-medium">{it.member?.name ?? "Un ancien membre"}</span> {activityLabel(it.action)}
                  {offerId && (
                    <>
                      {" · "}
                      <Link href={`/espace/offres/${offerId}`} className="font-medium underline underline-offset-2">
                        voir l&apos;offre
                      </Link>
                    </>
                  )}
                </p>
                <span className="shrink-0 text-muted-foreground text-xs">{timeAgo(it.at)}</span>
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
          className="mx-auto flex h-10 items-center gap-2 rounded-full bg-card px-5 font-medium text-sm"
        >
          <IconPlus className="size-4" />
          Voir plus
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
