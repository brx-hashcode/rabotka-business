"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconFileText, IconLockOpen } from "@tabler/icons-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Skeleton } from "#/components/ui/skeleton";
import { getMyContacts, myContactsKey } from "#/lib/api/business-controller";
import { PreviewSheet } from "#/components/preview-sheet";
import { friendlyError } from "#/lib/api/friendly-error";
import { applicationContractUrl } from "#/lib/api/offer-controller";
import { ContactDetails } from "./contact-details";

/**
 * A hired candidate's unlocked details, over the page they were asked from —
 * from the business's contacts, read when the dialog opens. Given the
 * application they were retained for, it also shows their contract, in the
 * document drawer (read there, downloaded from there).
 */
export function ContactDialog({
  workerId,
  name,
  open,
  onOpenChange,
  applicationId,
}: Readonly<{
  workerId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The retained application: its contract can be downloaded. */
  applicationId?: string;
}>) {
  const contacts = useQuery({ queryKey: myContactsKey, queryFn: getMyContacts, enabled: open });
  const [contractOpen, setContractOpen] = useState(false);
  const contact = contacts.data?.find((c) => c.workerId === workerId);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] gap-0 rounded-3xl border-0 bg-card p-6 shadow-soft sm:max-w-md">
        <DialogTitle className="sr-only">Contact de {name}</DialogTitle>
        <DialogDescription className="sr-only">Téléphone et e-mail</DialogDescription>
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
                : `Elles apparaissent dès que ${name} a confirmé.`}
            </p>
          </div>
        )}
        {applicationId && (
          <button
            type="button"
            onClick={() => {
              // One layer at a time: the drawer replaces the dialog.
              onOpenChange(false);
              setContractOpen(true);
            }}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-page font-medium hover:bg-page/70"
          >
            <IconFileText className="size-4" />
            Voir le contrat
          </button>
        )}
      </DialogContent>
    </Dialog>
    {applicationId && (
      <PreviewSheet
        open={contractOpen}
        onOpenChange={setContractOpen}
        title={`Contrat de ${name}`}
        subtitle="Contrat de prestation de services"
        src={applicationContractUrl(applicationId)}
        kind="pdf"
        fileName={`contrat_${name.replaceAll(/\s+/g, "_")}.pdf`}
        unavailable="Le contrat n'a pas pu être préparé. Réessayez dans un instant."
      />
    )}
    </>
  );
}
