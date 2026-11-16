"use client";

import { useTranslations } from "next-intl";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";
import { IconAlertTriangle, IconClock, IconLock } from "@tabler/icons-react";
import { toast } from "sonner";

import { Bone } from "#/components/page-skeletons";
import { useBusinessCatalog } from "#/hooks/use-business-catalog";
import { OrganisationStep, type OrganisationValues } from "#/features/sign-up/components/organisation-step";
import { getMyBusiness, myBusinessKey, updateMyBusiness } from "#/lib/api/business-controller";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import type { MyBusiness, UpdateMyBusiness } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { sessionUserKey } from "#/hooks/use-session-user";
import type { SessionUser } from "#/lib/api/types";
import { OrganisationDocuments } from "./organisation-documents";
import { OrganisationMailboxes } from "./organisation-mailboxes";
import { MessageTemplatesCard } from "#/features/messages/components/message-templates-card";
import { OrganisationLogo } from "./organisation-logo";
import { OrganisationOwner } from "./organisation-owner";

function toValues(b: MyBusiness): OrganisationValues {
  return {
    name: b.name,
    category: b.category,
    legalForm: b.legalForm ?? "",
    size: b.size ?? "",
    registrationNumber: b.registrationNumber ?? "",
    taxId: b.taxId ?? "",
    statisticalId: b.statisticalId ?? "",
    address: b.address ?? "",
    country: b.countryCode ?? "",
    city: b.city ?? "",
    website: b.website ?? "",
    description: b.description ?? "",
  };
}

/** Only the fields that changed; an emptied optional one is sent as null. */
function changes(before: OrganisationValues, after: OrganisationValues): UpdateMyBusiness {
  const out: Record<string, string | null> = {};
  for (const key of Object.keys(after) as (keyof OrganisationValues)[]) {
    const value = (after[key] ?? "").trim();
    if (value === (before[key] ?? "").trim()) continue;
    out[key === "country" ? "countryCode" : key] = value || null;
  }
  return out as UpdateMyBusiness;
}

/**
 * « Mon organisation »: where the review stands, the account holder, the
 * papers (a refused one is replaced here), and the details. Once verified,
 * what the review checked — name, type, legal form, official numbers, papers
 * — is locked: a change goes through the team (Aide).
 */
export function OrganisationPage() {
  const t = useTranslations("organisation.page");
  const friendlyError = useFriendlyError();
  const queryClient = useQueryClient();
  const { data: business, isLoading, error } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  // The papers' names in the organisation's country's words.
  const catalog = useBusinessCatalog(business?.countryCode);

  const verified = business?.verificationStatus === "VERIFIED";
  const setBusiness = (next: MyBusiness) => queryClient.setQueryData(myBusinessKey, next);
  const setLogo = (url: string) => {
    queryClient.setQueryData<MyBusiness>(myBusinessKey, (b) => (b ? { ...b, logoUrl: url } : b));
    // The header's avatar is the same picture.
    queryClient.setQueryData<SessionUser | null>(sessionUserKey, (u) => (u ? { ...u, avatar_url: url } : u));
  };

  const save = useMutation({
    mutationFn: (body: UpdateMyBusiness) => updateMyBusiness(body),
    onSuccess: ({ business: next, reopened }) => {
      setBusiness(next);
      toast.success(
        reopened ? t("savedReview") : t("saved"),
      );
    },
    onError: (err) => toast.error(friendlyError(err, t("saveFailed"))),
  });

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-3xl bg-card p-6">
            <Bone className="size-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bone className="h-6 w-48" />
              <Bone className="h-4 w-64" />
            </div>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_26rem]">
            <div className="space-y-6 rounded-3xl bg-card p-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Bone className="h-3.5 w-28" />
                  <Bone className="h-12" />
                </div>
              ))}
            </div>
            <div className="space-y-3 rounded-3xl bg-card p-6">
              <Bone className="h-6 w-32" />
              <Bone className="h-16 rounded-2xl" />
              <Bone className="h-16 rounded-2xl" />
              <Bone className="h-16 rounded-2xl" />
            </div>
          </div>
        </div>
      ) : !business ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">
          {friendlyError(error, t("notBusiness"))}
        </p>
      ) : (
        <>
          <ReviewBanner business={business} />
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_26rem]">
            <section className="order-2 space-y-6 rounded-3xl bg-card p-5 sm:p-8 lg:order-1">
              <OrganisationLogo name={business.name} logoUrl={business.logoUrl} onUploaded={setLogo} />
              <div aria-hidden className="h-px bg-page" />
              <div className="space-y-1">
                <h2 className="font-semibold text-lg">{t("details")}</h2>
                {verified && (
                  <p className="flex items-start gap-2 rounded-2xl bg-page px-4 py-3 text-muted-foreground text-sm">
                    <IconLock className="mt-0.5 size-4 shrink-0" />
                    <span>
                      {t.rich("locked", { link: RequestLink })}
                    </span>
                  </p>
                )}
              </div>
              <OrganisationStep
                // Re-mounted on each saved version, so the form starts from it.
                key={`${business.id}:${business.name}:${business.category}:${business.address}:${business.countryCode}:${business.city}`}
                defaultValues={toValues(business)}
                heading={false}
                submitLabel={t("save")}
                pending={save.isPending}
                lockIdentity={verified}
                onDone={(values) => {
                  const body = changes(toValues(business), values);
                  if (Object.keys(body).length === 0) {
                    toast(t("nothing"));
                    return;
                  }
                  save.mutate(body);
                }}
              />
            </section>
            <div className="order-1 space-y-6 lg:sticky lg:top-24 lg:order-2">
              {business.owner && <OrganisationOwner owner={business.owner} />}
              <OrganisationDocuments business={business} catalog={catalog} onChange={setBusiness} />
              <OrganisationMailboxes />
              <MessageTemplatesCard />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RequestLink(chunks: ReactNode) {
  return (
    <Link href="/espace/reclamations/nouvelle" className="font-medium text-foreground underline underline-offset-2">
      {chunks}
    </Link>
  );
}

/** Where the review stands and what to do — shown only while there is something to do. */
function ReviewBanner({ business }: Readonly<{ business: MyBusiness }>) {
  const t = useTranslations("organisation.review");
  const refusedDocs = business.documents.some((d) => d.verificationStatus === "REJECTED");
  // Verified and nothing to fix: nothing to say — the page is just the details.
  if (business.verificationStatus === "VERIFIED" && !refusedDocs) return null;
  const state =
    business.verificationStatus === "REJECTED"
        ? {
            icon: IconAlertTriangle,
            tone: "bg-destructive/8 text-destructive",
            title: t("refusedTitle"),
            text: t("refusedText", { reason: business.rejectionReason || "none" }),
          }
        : refusedDocs && business.verificationStatus === "VERIFIED"
          ? {
              // Verified, its papers can't be replaced from here (the server
              // refuses it): the team does it on request.
              icon: IconAlertTriangle,
              tone: "bg-chip-amber text-chip-amber-foreground",
              title: t("docRefusedTitle"),
              text: t("docRefusedText"),
            }
          : refusedDocs
          ? {
              icon: IconAlertTriangle,
              tone: "bg-chip-amber text-chip-amber-foreground",
              title: t("replaceTitle"),
              text: t("replaceText"),
            }
          : {
              icon: IconClock,
              tone: "bg-chip-amber text-chip-amber-foreground",
              title: t("pendingTitle"),
              text: t("pendingText"),
            };
  const Icon = state.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-3xl p-5", state.tone)}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-0.5">
        <p className="font-semibold">{state.title}</p>
        <p className="text-sm opacity-90">{state.text}</p>
      </div>
    </div>
  );
}
