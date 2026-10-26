"use client";

import { useQuery } from "@tanstack/react-query";
import { IconLockOpen } from "@tabler/icons-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Skeleton } from "#/components/ui/skeleton";
import { getMyContacts, myContactsKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { ContactDetails } from "./contact-details";

/**
 * A hired candidate's unlocked details, over the page they were asked from —
 * the same list as « Profils contactés », read when the dialog opens.
 */
export function ContactDialog({
  workerId,
  name,
  open,
  onOpenChange,
}: Readonly<{ workerId: string; name: string; open: boolean; onOpenChange: (open: boolean) => void }>) {
  const contacts = useQuery({ queryKey: myContactsKey, queryFn: getMyContacts, enabled: open });
  const contact = contacts.data?.find((c) => c.workerId === workerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] gap-0 rounded-3xl border-0 bg-card p-6 shadow-soft sm:max-w-md">
        <DialogTitle className="sr-only">Contact de {name}</DialogTitle>
        <DialogDescription className="sr-only">Téléphone et e-mail débloqués</DialogDescription>
        {contacts.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-2/3 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : contact ? (
          <ContactDetails contact={contact} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
              <IconLockOpen className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">Coordonnées pas encore disponibles</p>
            <p className="text-muted-foreground text-sm">
              {contacts.error
                ? friendlyError(contacts.error, "Les coordonnées sont indisponibles pour le moment.")
                : `Elles apparaissent dès que ${name} a réglé sa part du déblocage.`}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
