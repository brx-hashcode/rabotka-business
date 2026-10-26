"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Skeleton } from "#/components/ui/skeleton";
import { friendlyError } from "#/lib/api/friendly-error";
import { getOffer, offersKey, updateOffer, type Offer } from "#/lib/api/offer-controller";
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
      {offer && values && offer.status === "ACTIVE" ? (
        <OfferForm
          defaultValues={values}
          keepSchedule={values.scheduledDate ? scheduledIso(values.scheduledDate, values.scheduledTime) : undefined}
          submitLabel="Enregistrer"
          pending={save.isPending}
          aside={<OfferFacts offer={offer} />}
          onCancel={() => router.push(`/espace/offres/${id}`)}
          onSubmit={(v, country) => save.mutate({ v, country })}
        />
      ) : (
        <section className="max-w-3xl rounded-3xl bg-card p-5 sm:p-8">
          {isLoading ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : !offer ? (
            <p className="text-muted-foreground">{friendlyError(error, "Cette offre est introuvable.")}</p>
          ) : (
            <p className="text-muted-foreground">Seule une offre active peut être modifiée.</p>
          )}
        </section>
      )}
    </div>
  );
}

/** What the form does not change: the offer's reference, age and hires so far. */
function OfferFacts({ offer }: Readonly<{ offer: Offer }>) {
  const facts = [
    { label: "Référence", value: offer.reference },
    {
      label: "Publiée le",
      value: new Date(offer.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    },
    { label: "Personnes retenues", value: `${offer.acceptedCount}/${offer.quantity}` },
  ];
  return (
    <section className="space-y-3 rounded-3xl bg-card p-6">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Informations</p>
      <dl className="space-y-2 text-sm">
        {facts.map((f) => (
          <div key={f.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{f.label}</dt>
            <dd className="font-medium tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
