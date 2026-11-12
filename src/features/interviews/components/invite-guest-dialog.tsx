"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconSend2, IconX } from "@tabler/icons-react";

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
} from "#/lib/api/interview-controller";
import type { Interview } from "#/lib/api/types";

/** The server's limit: an interview, not a meeting. */
const MAX_GUESTS = 5;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
          <Bone className="h-14 w-full rounded-2xl" />
        ) : list.length > 0 ? (
          <div className="space-y-2">
            <p className="font-medium text-sm">Invités</p>
            <ul className="space-y-1">
              {list.map((g) => (
                <li key={g.id} className="flex items-center gap-3 rounded-xl bg-page px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-sm">{g.name}</span>
                    <span className="block truncate text-muted-foreground text-xs">{g.email}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Retirer ${g.name}`}
                    title="Retirer l'invitation"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(g.id)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-destructive"
                  >
                    <IconX className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
