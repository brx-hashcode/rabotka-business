"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { createOffer, offersKey } from "#/lib/api/offer-controller";
import type { MySubscription } from "#/lib/api/types";
import { OfferForm, offerFormValues, toOfferInput, type OfferFormValues } from "./offer-form";

/** Publishing an offer. Past the plan's limit the server refuses, with its message. */
export function NewOfferPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
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
      <OfferForm
        defaultValues={offerFormValues()}
        submitLabel="Publier l'offre"
        pending={create.isPending}
        aside={subscription.data && <PlanCard subscription={subscription.data} />}
        onCancel={() => router.push("/espace/offres")}
        onSubmit={(v, country) => create.mutate({ v, country })}
      />
    </div>
  );
}

/** Room left under the plan: a full plan cannot publish, so say it before the form is filled. */
function PlanCard({ subscription }: Readonly<{ subscription: MySubscription }>) {
  const e = subscription.entitlements;
  const limit = e.plan ? e.activeOffersLimit : 0;
  const full = limit !== null && e.activeOffers >= limit;
  return (
    <section className="space-y-4 rounded-3xl bg-card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Votre formule</p>
        <p className="font-semibold text-sm">{e.plan?.name ?? "Aucune"}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span>Offres en ligne</span>
          <span className="font-semibold tabular-nums">
            {e.activeOffers}
            {limit === null ? "" : `/${limit}`}
          </span>
        </div>
        {limit !== null && limit > 0 && (
          <div className="h-1.5 overflow-hidden rounded-full bg-page">
            <div
              className="h-full rounded-full bg-whatsapp-dark"
              style={{ width: `${Math.min(100, (e.activeOffers / limit) * 100)}%` }}
            />
          </div>
        )}
      </div>
      {full ? (
        <p className="rounded-2xl bg-chip-amber p-3 text-chip-amber-foreground text-sm">
          {e.plan ? "Limite atteinte : clôturez une offre ou " : "Il faut une formule pour publier : "}
          <Link href="/espace/abonnement" className="font-medium underline">
            {e.plan ? "changez de formule" : "choisissez-en une"}
          </Link>
          .
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          {e.priorityVisibility
            ? "Votre offre sera mise en avant auprès des candidats."
            : "Les candidats correspondants sont prévenus dès la publication."}
        </p>
      )}
    </section>
  );
}
