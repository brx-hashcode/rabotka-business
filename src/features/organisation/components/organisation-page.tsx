"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { IconAlertTriangle, IconClock, IconLock } from "@tabler/icons-react";
import { toast } from "sonner";

import { Bone } from "#/components/page-skeletons";
import { OrganisationStep, type OrganisationValues } from "#/features/sign-up/components/organisation-step";
import { getMyBusiness, myBusinessKey, updateMyBusiness } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { getBusinessCatalog } from "#/lib/api/signup-controller";
import type { MyBusiness, UpdateMyBusiness } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { sessionUserKey } from "#/hooks/use-session-user";
import type { SessionUser } from "#/lib/api/types";
import { OrganisationCareersLink } from "./organisation-careers-link";
import { OrganisationDocuments } from "./organisation-documents";
import { OrganisationMailboxes } from "./organisation-mailboxes";
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
    address: b.address,
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
  const queryClient = useQueryClient();
  const { data: business, isLoading, error } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const { data: catalog } = useQuery({ queryKey: ["business", "catalog"], queryFn: getBusinessCatalog, staleTime: Infinity });

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
        reopened
          ? "Modifications enregistrées. Elles seront vérifiées par notre équipe."
          : "Modifications enregistrées.",
      );
    },
    onError: (err) => toast.error(friendlyError(err, "Vos modifications n'ont pas pu être enregistrées.")),
  });

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Organisation</h1>
        <p className="text-muted-foreground">Les informations et documents de votre organisation, et leur vérification.</p>
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
          {friendlyError(error, "Ce compte n'est pas un compte entreprise.")}
        </p>
      ) : (
        <>
          <ReviewBanner business={business} />
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_26rem]">
            <section className="order-2 space-y-6 rounded-3xl bg-card p-5 sm:p-8 lg:order-1">
              <OrganisationLogo name={business.name} logoUrl={business.logoUrl} onUploaded={setLogo} />
              <div aria-hidden className="h-px bg-page" />
              {verified && business.publicSlug && (
                <>
                  <OrganisationCareersLink slug={business.publicSlug} />
                  <div aria-hidden className="h-px bg-page" />
                </>
              )}
              <div className="space-y-1">
                <h2 className="font-semibold text-lg">Informations</h2>
                {verified && (
                  <p className="flex items-start gap-2 rounded-2xl bg-page px-4 py-3 text-muted-foreground text-sm">
                    <IconLock className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Votre organisation est vérifiée : son identité, ses identifiants officiels et ses documents ne se
                      modifient plus ici. Pour un changement,{" "}
                      <Link href="/espace/reclamations/nouvelle" className="font-medium text-foreground underline underline-offset-2">
                        faites une demande à l&apos;équipe
                      </Link>
                      . Le siège, l&apos;effectif et la présentation restent modifiables.
                    </span>
                  </p>
                )}
              </div>
              <OrganisationStep
                // Re-mounted on each saved version, so the form starts from it.
                key={`${business.id}:${business.name}:${business.category}:${business.address}:${business.city}`}
                catalog={catalog}
                defaultValues={toValues(business)}
                heading={false}
                submitLabel="Enregistrer"
                pending={save.isPending}
                lockIdentity={verified}
                onDone={(values) => {
                  const body = changes(toValues(business), values);
                  if (Object.keys(body).length === 0) {
                    toast("Aucune modification à enregistrer.");
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Where the review stands and what to do — shown only while there is something to do. */
function ReviewBanner({ business }: Readonly<{ business: MyBusiness }>) {
  const refusedDocs = business.documents.some((d) => d.verificationStatus === "REJECTED");
  // Verified and nothing to fix: nothing to say — the page is just the details.
  if (business.verificationStatus === "VERIFIED" && !refusedDocs) return null;
  const state =
    business.verificationStatus === "REJECTED"
        ? {
            icon: IconAlertTriangle,
            tone: "bg-destructive/8 text-destructive",
            title: "Vérification refusée",
            text: `${business.rejectionReason ? `Motif : ${business.rejectionReason}. ` : ""}Corrigez vos informations ou remplacez les documents concernés : la vérification reprendra automatiquement.`,
          }
        : refusedDocs
          ? {
              icon: IconAlertTriangle,
              tone: "bg-chip-amber text-chip-amber-foreground",
              title: "Des documents sont à remplacer",
              text: "Envoyez une nouvelle version des documents refusés pour que la vérification se poursuive.",
            }
          : {
              icon: IconClock,
              tone: "bg-chip-amber text-chip-amber-foreground",
              title: "Vérification en cours",
              text: "Notre équipe examine vos documents. Vous serez prévenu par e-mail et dans votre espace.",
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
