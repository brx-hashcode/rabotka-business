"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { IconBrandLinkedin } from "@tabler/icons-react";

import { Checkbox } from "#/components/ui/checkbox";
import { getMyBusiness, getMySubscription, myBusinessKey, mySubscriptionKey } from "#/lib/api/business-controller";
import { getLinkedin, linkedinKey, postOnLinkedin } from "#/lib/api/linkedin-controller";
import { defaultLinkedinText } from "../linkedin-post";
import { offerShareUrl } from "../share-url";
import { friendlyError } from "#/lib/api/friendly-error";
import { createOffer, getJobCategories, offersKey } from "#/lib/api/offer-controller";
import type { MySubscription } from "#/lib/api/types";
import { OfferForm, offerFormValues, toOfferInput, type OfferFormValues } from "./offer-form";
import { offersFull, offersUsed } from "#/features/subscription/offers-quota";

/** Publishing an offer. Past the plan's limit the server refuses, with its message. */
export function NewOfferPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const { data: business } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const { data: linkedin } = useQuery({ queryKey: linkedinKey, queryFn: getLinkedin });
  // Posted on the recruiter's LinkedIn as soon as it is online: only when the
  // offer will be on the careers page and their LinkedIn is connected.
  const canPostOnLinkedin =
    !!business?.publicSlug &&
    business.verificationStatus === "VERIFIED" &&
    linkedin?.included !== false &&
    !!linkedin?.account &&
    !linkedin.account.expired;
  const [alsoLinkedin, setAlsoLinkedin] = useState(true);
  const categories = useQuery({ queryKey: ["job-categories"], queryFn: getJobCategories, staleTime: Infinity });
  const create = useMutation({
    mutationFn: async ({ v, country }: { v: OfferFormValues; country: string | undefined }) => {
      const input = toOfferInput(v, country);
      return { ...(await createOffer(input)), input };
    },
    onSuccess: ({ id, reference, input }) => {
      if (canPostOnLinkedin && alsoLinkedin && business?.publicSlug) {
        const text = defaultLinkedinText({
          title: input.title,
          companyName: business.name,
          employmentType: input.employment_type,
          isRemote: input.isRemote,
          city: input.city ?? null,
          amount: input.amount ?? null,
          paymentFlow: input.payment_flow ?? null,
          scheduledAt: input.scheduled_at,
          description: input.description,
          categoryName: categories.data?.find((c) => c.id === input.category_id)?.name ?? null,
          url: offerShareUrl(window.location.origin, business.publicSlug, reference, "linkedin"),
        });
        postOnLinkedin(id, text).catch((err) =>
          toast.error(friendlyError(err, "L'offre n'a pas pu être publiée sur LinkedIn : réessayez depuis « Partager ».")),
        );
      }
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
      toast.success("Offre publiée. Les candidats correspondants sont prévenus.");
      // `publiee`: the offer page opens on « faites-la connaître » (LinkedIn first).
      router.push(`/espace/offres/${id}?publiee=1`);
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
        aside={
          <>
            {subscription.data && <PlanCard subscription={subscription.data} />}
            {canPostOnLinkedin && (
              <label className="flex cursor-pointer items-start gap-3 rounded-3xl bg-card p-5">
                <Checkbox checked={alsoLinkedin} onCheckedChange={(c) => setAlsoLinkedin(c === true)} className="mt-0.5" />
                <span className="min-w-0 space-y-1">
                  <span className="flex items-center gap-1.5 font-medium text-sm">
                    <IconBrandLinkedin className="size-4 text-[#0a66c2]" />
                    Publier aussi sur LinkedIn
                  </span>
                  <span className="block text-muted-foreground text-xs">
                    Sur le compte de {linkedin?.account?.name}. Les candidats postulent sur votre page carrières.
                  </span>
                </span>
              </label>
            )}
          </>
        }
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
  const used = offersUsed(e);
  const full = offersFull(e);
  return (
    <section className="space-y-4 rounded-3xl bg-card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Votre formule</p>
        <p className="font-semibold text-sm">{e.plan?.name ?? "Aucune"}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span>Offres publiées cette période</span>
          <span className="font-semibold tabular-nums">
            {used}
            {limit === null ? "" : `/${limit}`}
          </span>
        </div>
        {limit !== null && limit > 0 && (
          <div className="h-1.5 overflow-hidden rounded-full bg-page">
            <div
              className="h-full rounded-full bg-whatsapp-dark"
              style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
            />
          </div>
        )}
      </div>
      {full ? (
        <p className="rounded-2xl bg-chip-amber p-3 text-chip-amber-foreground text-sm">
          {e.plan ? "Toutes les offres de la période sont publiées : attendez la prochaine ou " : "Il faut une formule pour publier : "}
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
