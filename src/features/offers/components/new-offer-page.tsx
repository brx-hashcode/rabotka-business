"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { mySubscriptionKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { createOffer, offersKey } from "#/lib/api/offer-controller";
import { OfferForm, offerFormValues, toOfferInput, type OfferFormValues } from "./offer-form";

/** Publishing an offer. Past the plan's limit the server refuses, with its message. */
export function NewOfferPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: ({ v, country }: { v: OfferFormValues; country: string | undefined }) => createOffer(toOfferInput(v, country)),
    onSuccess: ({ id }) => {
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
      toast.success("Offre publiée. Les candidats correspondants sont prévenus.");
      router.push(`/espace/offres/${id}`);
    },
    onError: (err) => toast.error(friendlyError(err, "L'offre n'a pas pu être publiée.")),
  });

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Nouvelle offre</h1>
        <p className="text-muted-foreground">Décrivez le poste : les candidats correspondants en sont prévenus dès sa publication.</p>
      </div>
      <section className="max-w-3xl rounded-3xl bg-card p-5 sm:p-8">
        <OfferForm
          defaultValues={offerFormValues()}
          submitLabel="Publier l'offre"
          pending={create.isPending}
          onCancel={() => router.push("/espace/offres")}
          onSubmit={(v, country) => create.mutate({ v, country })}
        />
      </section>
    </div>
  );
}
