"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconSend2, IconX } from "@tabler/icons-react";

import { ActionDialog } from "#/components/action-dialog";
import { Bone } from "#/components/page-skeletons";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { friendlyError } from "#/lib/api/friendly-error";
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
  "bg-chip-green text-chip-green-foreground",
  "bg-chip-sky text-chip-sky-foreground",
  "bg-chip-violet text-chip-violet-foreground",
  "bg-chip-amber text-chip-amber-foreground",
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

/** « Marie Ngoma est invité », « Marie et Paul sont invités », « Marie, Paul et 2 autres sont invités ». */
function summary(names: string[]): string {
  const first = names.map((n) => n.split(/\s+/)[0] ?? n);
  if (first.length === 1) return `${names[0]} est invité`;
  if (first.length === 2) return `${first[0]} et ${first[1]} sont invités`;
  return `${first[0]}, ${first[1]} et ${first.length - 2} autre${first.length > 3 ? "s" : ""} sont invités`;
}

/**
 * « Inviter quelqu'un » into an interview's visio: a colleague, a manager, an
 * outside expert. Each gets a personal link by e-mail and joins under their
 * own name, without an account, as the candidate does.
 */
export function InviteGuestDialog({
  interview: i,
  open,
  onOpenChange,
}: Readonly<{ interview: Interview; open: boolean; onOpenChange: (o: boolean) => void }>) {
  const queryClient = useQueryClient();
  const key = interviewGuestsKey(i.id);
  const guests = useQuery({ queryKey: key, queryFn: () => listInterviewGuests(i.id), enabled: open });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [removing, setRemoving] = useState<InterviewGuest | null>(null);

  const invite = useMutation({
    mutationFn: () => inviteInterviewGuest(i.id, { name: name.trim(), email: email.trim() }),
    onSuccess: (g) => {
      void queryClient.invalidateQueries({ queryKey: key });
      toast.success(`Invitation envoyée à ${g.name}.`);
      setName("");
      setEmail("");
    },
    onError: (err) => toast.error(friendlyError(err, "L'invitation n'a pas pu être envoyée.")),
  });
  const remove = useMutation({
    mutationFn: (guestId: string) => removeInterviewGuest(i.id, guestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      setRemoving(null);
      toast.success("Invitation retirée : son lien ne fonctionne plus.");
    },
    onError: (err) => toast.error(friendlyError(err, "L'invitation n'a pas pu être retirée.")),
  });

  const list = guests.data ?? [];
  const full = list.length >= MAX_GUESTS && !list.some((g) => g.email === email.trim().toLowerCase());
  const valid = name.trim().length > 0 && EMAIL.test(email.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] rounded-3xl border-0 bg-card p-6 shadow-soft sm:max-w-md">
        <div className="space-y-1">
          <DialogTitle>Inviter quelqu&apos;un</DialogTitle>
          <DialogDescription>
            Un collègue ou un responsable rejoint la visio avec {i.candidateName}, sous son nom et sans compte. Il reçoit un lien personnel par e-mail.
          </DialogDescription>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && !full) invite.mutate();
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Son nom" aria-label="Nom" maxLength={80} className="h-11 rounded-xl border-0 bg-page" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Son adresse e-mail"
            aria-label="Adresse e-mail"
            maxLength={200}
            className="h-11 rounded-xl border-0 bg-page"
          />
          <Button type="submit" className="h-11 w-full rounded-full" disabled={!valid || full} loading={invite.isPending}>
            <IconSend2 className="size-4" />
            Envoyer l&apos;invitation
          </Button>
          {full && <p className="text-center text-muted-foreground text-xs">{MAX_GUESTS} invités au plus par entretien : retirez-en un pour en ajouter.</p>}
        </form>

        {guests.isLoading ? (
          <Bone className="h-10 w-40 rounded-full" />
        ) : list.length > 0 ? (
          <div className="flex items-center gap-3">
            <ul className="flex shrink-0 items-center pl-2" aria-label="Invités">
              {list.map((g, n) => (
                <li key={g.id} className="group relative -ml-2">
                  <span
                    title={`${g.name} · ${g.email}`}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full font-semibold text-xs ring-2 ring-card",
                      AVATAR[n % AVATAR.length],
                    )}
                  >
                    {initials(g.name)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Retirer ${g.name}`}
                    title={`Retirer ${g.name}`}
                    onClick={() => setRemoving(g)}
                    className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-foreground text-background opacity-0 ring-2 ring-card transition-opacity focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <IconX className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="min-w-0 text-muted-foreground text-sm">{summary(list.map((g) => g.name))}</p>
          </div>
        ) : null}

        <ActionDialog
          open={removing !== null}
          onOpenChange={(o) => !o && setRemoving(null)}
          tone="warning"
          title={removing ? `Retirer l'invitation de ${removing.name} ?` : ""}
          description="Son lien ne fonctionnera plus : il ne pourra pas rejoindre la visio. Vous pourrez l'inviter à nouveau."
          confirmLabel="Retirer l'invitation"
          onConfirm={() => removing && remove.mutate(removing.id)}
          pending={remove.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
