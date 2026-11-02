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
  const [inviting, setInviting] = useState(false);
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
  const anySeat = INVITED.some((r) => seats[r].limit === null || seats[r].used < seats[r].limit!);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        {INVITED.map((r) => (
          <SeatTile key={r} role={r} used={seats[r].used} limit={seats[r].limit} />
        ))}
        <button
          type="button"
          onClick={() => setInviting(true)}
          disabled={!anySeat}
          className="inline-flex h-full min-h-14 items-center justify-center gap-2 rounded-3xl bg-ink px-6 font-medium text-white disabled:opacity-50"
        >
          <IconUserPlus className="size-5" />
          Inviter
        </button>
      </div>
      {!anySeat && (
        <p className="text-muted-foreground text-sm">
          Votre formule n&apos;a plus de place dans l&apos;équipe.{" "}
          <Link href="/espace/abonnement" className="font-medium text-foreground underline underline-offset-2">
            Changer de formule
          </Link>
        </p>
      )}

      <ul className="space-y-2.5">
        {members.map((m) => (
          <MemberRow key={m.id} member={m} seats={seats} onRemove={() => setRemoving(m)} onChanged={refresh} />
        ))}
        {members.length === 1 && (
          <li className="flex flex-col items-center gap-2 rounded-3xl bg-card px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
              <IconUserPlus className="size-6" />
            </span>
            <p className="font-medium">Vous êtes seul dans l&apos;espace</p>
            <p className="max-w-sm text-muted-foreground text-sm">
              Un recruteur publie et trie avec vous ; un évaluateur donne son avis sur les candidats.
            </p>
          </li>
        )}
      </ul>

      <InviteDialog open={inviting} onOpenChange={setInviting} seats={seats} onInvited={refresh} />
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

function SeatTile({ role, used, limit }: Readonly<{ role: InvitedRole; used: number; limit: number | null }>) {
  const full = limit !== null && used >= limit;
  return (
    <div className="space-y-1 rounded-3xl bg-card px-5 py-4">
      <p className="text-muted-foreground text-sm">{PLURAL[role]}</p>
      <p className="font-semibold text-2xl tabular-nums">
        {used}
        <span className="font-normal text-base text-muted-foreground">{limit === null ? " · illimité" : ` / ${limit}`}</span>
      </p>
      {limit === 0 ? (
        <p className="text-muted-foreground text-xs">Pas inclus dans votre formule</p>
      ) : full ? (
        <p className="text-chip-amber-foreground text-xs">Toutes les places sont prises</p>
      ) : null}
    </div>
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
    <li className="flex items-center gap-3 rounded-3xl bg-card px-4 py-3.5 sm:px-5">
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
          invited ? "bg-chip-amber text-chip-amber-foreground" : "bg-page",
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
                  <span className="text-muted-foreground text-xs">{full ? "Plus de place dans votre formule" : ROLE_HINT[r]}</span>
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
                {free(r) ? ROLE_HINT[r] : "Plus de place dans votre formule"}
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
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Bone key={i} onPage className="h-24 rounded-3xl" />
        ))}
      </div>
      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <Bone key={i} onPage className="h-[4.5rem] rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
