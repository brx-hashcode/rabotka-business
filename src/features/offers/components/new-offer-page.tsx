"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PACKS_HREF } from "#/features/subscription/packs";
import { usePackOnSale } from "#/features/subscription/use-packs";
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
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { createOffer, getJobCategories, offersKey } from "#/lib/api/offer-controller";
import type { MySubscription } from "#/lib/api/types";
import { OfferForm, offerFormValues, toOfferInput, type OfferFormValues } from "./offer-form";
import { offersFull, offersUsed } from "#/features/subscription/offers-quota";

/** Publishing an offer. Past the plan's limit the server refuses, with its message. */
export function NewOfferPage() {
  const router = useRouter();
  const t = useTranslations("offers.new");
  const friendlyError = useFriendlyError();
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
          toast.error(friendlyError(err, t("linkedinFailed"))),
        );
      }
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
      toast.success(t("published"));
      // `publiee`: the offer page opens on « faites-la connaître » (LinkedIn first).
      router.push(`/espace/offres/${id}?publiee=1`);
    },
    onError: (err) => toast.error(friendlyError(err, t("failed"))),
  });

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </div>
      <OfferForm
        // Placed where the organisation is, once known (it is cached by then
        // almost always: the sidebar reads it).
        key={business ? "home" : "blank"}
        defaultValues={offerFormValues(undefined, business)}
        submitLabel={t("submit")}
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
                    {t("alsoLinkedin")}
                  </span>
                  <span className="block text-muted-foreground text-xs">
                    {t("linkedinAccount", { name: linkedin?.account?.name ?? "" })}
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
  const packOnSale = usePackOnSale("OFFER");
  const t = useTranslations("offers.new");
  const link = (href: string) => (chunks: React.ReactNode) => (
    <Link href={href} className="font-medium underline">
      {chunks}
    </Link>
  );
  return (
    <section className="space-y-4 rounded-3xl bg-card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{t("yourPlan")}</p>
        <p className="font-semibold text-sm">{e.plan?.name ?? t("none")}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span>{t("publishedThisPeriod")}</span>
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
          {t.rich(!e.plan ? "noPlan" : packOnSale ? "fullWithPack" : "full", {
            pack: link(PACKS_HREF),
            plan: link("/espace/abonnement"),
          })}
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          {e.priorityVisibility ? t("priority") : t("notified")}
        </p>
      )}
    </section>
  );
}
