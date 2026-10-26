"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Skeleton } from "#/components/ui/skeleton";
import { friendlyError } from "#/lib/api/friendly-error";
import { getOffer, offersKey, updateOffer } from "#/lib/api/offer-controller";
import { OfferForm, offerFormValues, scheduledIso, toOfferInput, type OfferFormValues } from "./offer-form";

/**
 * Editing an active offer. Candidates still on it are told when the pay, the
 * date or the place changes (server side).
 */
export function EditOfferPage({ id }: Readonly<{ id: string }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: offer, isLoading, error } = useQuery({ queryKey: [...offersKey, id], queryFn: () => getOffer(id) });
  const save = useMutation({
    mutationFn: ({ v, country }: { v: OfferFormValues; country: string | undefined }) =>
      updateOffer(id, toOfferInput(v, country)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKey });
      toast.success("Offre mise à jour.");
      router.push(`/espace/offres/${id}`);
    },
    onError: (err) => toast.error(friendlyError(err, "L'offre n'a pas pu être modifiée.")),
  });

  const values = offer ? offerFormValues(offer) : null;

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Modifier l&apos;offre</h1>
        <p className="text-muted-foreground">Les candidats déjà positionnés sont prévenus d&apos;un changement de rémunération, de date ou de lieu.</p>
      </div>
      <section className="max-w-3xl rounded-3xl bg-card p-5 sm:p-8">
        {isLoading ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : !offer || !values ? (
          <p className="text-muted-foreground">{friendlyError(error, "Cette offre est introuvable.")}</p>
        ) : offer.status !== "ACTIVE" ? (
          <p className="text-muted-foreground">Seule une offre active peut être modifiée.</p>
        ) : (
          <OfferForm
            defaultValues={values}
            keepSchedule={values.scheduledDate ? scheduledIso(values.scheduledDate, values.scheduledTime) : undefined}
            submitLabel="Enregistrer"
            pending={save.isPending}
            onCancel={() => router.push(`/espace/offres/${id}`)}
            onSubmit={(v, country) => save.mutate({ v, country })}
          />
        )}
      </section>
    </div>
  );
}
