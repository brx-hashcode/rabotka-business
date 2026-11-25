"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useWhyNot } from "#/lib/use-why-not";
import { IconLink, IconLock, IconX } from "@tabler/icons-react";

import { ActionDialog } from "#/components/action-dialog";
import { Bone } from "#/components/page-skeletons";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { useMember } from "#/features/team/use-member";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import {
  interviewGuestsKey,
  inviteInterviewGuest,
  listInterviewGuests,
  removeInterviewGuest,
  type InterviewGuest,
} from "#/lib/api/interview-controller";
import type { Interview } from "#/lib/api/types";
import { cn } from "#/lib/utils";

/** The server's limit: an interview, not a meeting. */
const MAX_GUESTS = 5;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** One colour per person, in turn, so neighbours stand apart. */
const AVATAR = [
  "bg-chip-sky text-chip-sky-foreground",
  "bg-chip-violet text-chip-violet-foreground",
  "bg-chip-amber text-chip-amber-foreground",
  "bg-chip-green text-chip-green-foreground",
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

/**
 * « Partager la visio » of an interview, as a share window: add someone by
 * e-mail (a colleague, a manager, an outside expert), see who has access,
 * copy the link. An invited person gets a personal link and joins under
 * their own name, without an account, as the candidate does.
 */
export function InviteGuestDialog({
  interview: i,
  open,
  onOpenChange,
}: Readonly<{
  /** What the window needs: from a card on « Entretiens », or from the call page. */
  interview: Pick<Interview, "id" | "candidateName" | "jobTitle" | "location">;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}>) {
  const queryClient = useQueryClient();
  const t = useTranslations("interviews.guests");
  const whyNot = useWhyNot();
  const friendlyError = useFriendlyError();
  const { member } = useMember();
  const key = interviewGuestsKey(i.id);
  const guests = useQuery({ queryKey: key, queryFn: () => listInterviewGuests(i.id), enabled: open });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [removing, setRemoving] = useState<InterviewGuest | null>(null);

  const invite = useMutation({
    mutationFn: () => inviteInterviewGuest(i.id, { name: name.trim(), email: email.trim() }),
    onSuccess: (g) => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success(t("sent", { name: g.name }));
      setName("");
      setEmail("");
    },
    onError: (err) => toast.error(friendlyError(err, t("failed"))),
  });
  const remove = useMutation({
    mutationFn: (guestId: string) => removeInterviewGuest(i.id, guestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      setRemoving(null);
      toast.success(t("removed"));
    },
    onError: (err) => toast.error(friendlyError(err, t("removeFailed"))),
  });

  const list = guests.data ?? [];
  const typed = email.trim().toLowerCase();
  const adding = EMAIL.test(typed);
  const again = list.some((g) => g.email === typed);
  const full = list.length >= MAX_GUESTS && !again;

  const copy = async () => {
    if (!i.location) return;
    try {
      await navigator.clipboard.writeText(i.location);
      toast.success(t("candidateLink"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] gap-6 rounded-3xl border-0 bg-card p-6 shadow-soft sm:max-w-lg sm:p-7">
        <div className="space-y-1 pr-8">
          <DialogTitle className="text-xl">{t("title")}</DialogTitle>
          <DialogDescription>{t("with", { name: i.candidateName, job: i.jobTitle })}</DialogDescription>
        </div>

        {/* Add someone: the e-mail first; the name once it is one. */}
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (adding && name.trim() && !full) invite.mutate();
          }}
        >
          <label className="block space-y-1.5">
            <span className="font-medium text-muted-foreground text-xs">{t("add")}</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              maxLength={200}
              autoFocus
              className="h-12 rounded-2xl border-0 bg-page px-4"
            />
          </label>
          {adding && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                aria-label={t("name")}
                maxLength={80}
                className="h-12 flex-1 rounded-2xl border-0 bg-page px-4"
              />
              <Button type="submit" className="h-12 rounded-full px-6 sm:h-12" disabled={!name.trim() || full} title={whyNot([invite.isPending, "wait"], [full, { say: t("full", { max: MAX_GUESTS }) }], [!name.trim(), "complete"])} loading={invite.isPending}>
                {again ? t("resend") : t("send")}
              </Button>
            </div>
          )}
          {adding && full && <p className="text-muted-foreground text-xs">{t("full", { max: MAX_GUESTS })}</p>}
        </form>

        <section className="space-y-2">
          <h3 className="font-semibold text-sm">{t("access")}</h3>
          <ul className="space-y-1">
            {member && (
              <Person initials={initials(member.name)} tone="bg-ink text-white" name={t("you", { name: member.name })} detail={member.email} role={t("organiser")} />
            )}
            <Person initials={initials(i.candidateName)} tone="bg-chip-green text-chip-green-foreground" name={i.candidateName} detail={t("byInvitation")} role={t("candidate")} />
            {guests.isLoading ? (
              <li>
                <Bone className="h-12 w-full rounded-2xl" />
              </li>
            ) : (
              list.map((g, n) => (
                <Person
                  key={g.id}
                  initials={initials(g.name)}
                  tone={AVATAR[n % AVATAR.length] ?? ""}
                  name={g.name}
                  detail={g.email}
                  role={t("guest")}
                  onRemove={() => setRemoving(g)}
                />
              ))
            )}
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold text-sm">{t("accessTitle")}</h3>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-page">
              <IconLock className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-medium text-sm">{t("onInvitation")}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t("onInvitationText")}
              </p>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" className="h-11 rounded-full bg-page px-5 sm:h-11" onClick={() => void copy()} disabled={!i.location} title={whyNot([!i.location, { say: t("noLink") }])}>
            <IconLink className="size-4" />
            {t("copyLink")}
          </Button>
          <Button type="button" className="h-11 rounded-full px-7 sm:h-11" onClick={() => onOpenChange(false)}>
            OK
          </Button>
        </div>

        <ActionDialog
          open={removing !== null}
          onOpenChange={(o) => !o && setRemoving(null)}
          tone="warning"
          title={removing ? t("removeTitle", { name: removing.name }) : ""}
          description={t("removeText")}
          confirmLabel={t("remove")}
          onConfirm={() => removing && remove.mutate(removing.id)}
          pending={remove.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

/** One row of « Personnes ayant accès »: who, how they join, and their place in the call. */
function Person({
  initials: letters,
  tone,
  name,
  detail,
  role,
  onRemove,
}: Readonly<{ initials: string; tone: string; name: string; detail: string; role: string; onRemove?: () => void }>) {
  const t = useTranslations("interviews.guests");
  return (
    <li className="flex items-center gap-3 rounded-2xl px-1 py-1.5">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full font-semibold text-xs", tone)}>{letters}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-sm">{name}</span>
        <span className="block truncate text-muted-foreground text-xs">{detail}</span>
      </span>
      <span className="shrink-0 text-muted-foreground text-xs">{role}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={t("removeOf", { name })}
          title={t("remove")}
          onClick={onRemove}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-page hover:text-destructive"
        >
          <IconX className="size-4" />
        </button>
      ) : (
        <span className="size-8 shrink-0" aria-hidden />
      )}
    </li>
  );
}
