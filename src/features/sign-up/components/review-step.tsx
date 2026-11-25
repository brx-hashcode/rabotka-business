"use client";

import { useEffect, useState, type ReactNode } from "react";
import { IconArrowRight, IconCircleCheckFilled, IconPencil } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { useWhyNot } from "#/lib/use-why-not";
import type { BusinessCatalog } from "#/lib/api/types";
import { PUBLIC_SITE } from "#/features/landing/content";
import type { AccountValues } from "./account-step";
import { DocumentPreviewDialog } from "./document-preview";
import type { DocumentsValue } from "./documents-step";
import { FormError, StepActions, StepHeading } from "./form-bits";
import { InlineSignIn } from "./inline-sign-in";
import type { OrganisationValues } from "./organisation-step";

/** Everything entered, by step, with a way back to each; then the terms and the send. */
export function ReviewStep({
  catalog,
  account,
  organisation,
  documents,
  previews,
  pending,
  error,
  onEdit,
  onBack,
  onSubmit,
}: Readonly<{
  catalog: BusinessCatalog;
  account: AccountValues;
  organisation: OrganisationValues;
  documents: DocumentsValue;
  previews: Record<string, string>;
  pending: boolean;
  error: string | null;
  onEdit: (step: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}>) {
  const t = useTranslations("signUp.review");
  const [accepted, setAccepted] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const viewed = viewing ? documents[viewing] : undefined;
  const countryName = catalog.countries.find((c) => c.code === organisation.country)?.name ?? organisation.country;
  const ids = catalog.identifiers;
  const categoryLabel = catalog.categories.find((c) => c.value === organisation.category)?.label;
  const legalFormLabel = catalog.legalForms.find((f) => f.value === organisation.legalForm)?.label;
  const docLabel = new Map(catalog.documentTypes.map((d) => [d.value, d.label]));

  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (accepted) onSubmit();
      }}
    >
      <StepHeading
        title={t("title")}
        text={t("text")}
      />

      <Summary title={t("holder")} onEdit={() => onEdit(0)}>
        <Row label={t("name")}>{`${account.firstName} ${account.lastName}`}</Row>
        <Row label={t("email")}>{account.email}</Row>
        <Row label={t("phone")}>{account.phone}</Row>
      </Summary>

      <Summary title={t("organisation")} onEdit={() => onEdit(2)}>
        <Row label={t("companyName")}>{organisation.name}</Row>
        <Row label={t("type")}>{categoryLabel}</Row>
        {legalFormLabel && <Row label={t("legalForm")}>{legalFormLabel}</Row>}
        {organisation.size && <Row label={t("size")}>{t("employees", { size: organisation.size })}</Row>}
        {organisation.registrationNumber && (
          <Row label={ids.registrationNumber?.label ?? t("registrationNumber")}>{organisation.registrationNumber}</Row>
        )}
        {organisation.taxId && <Row label={ids.taxId?.label ?? t("taxId")}>{organisation.taxId}</Row>}
        {organisation.statisticalId && ids.statisticalId && (
          <Row label={ids.statisticalId.label}>{organisation.statisticalId}</Row>
        )}
        <Row label={organisation.address ? t("address") : t("country")}>
          {[organisation.address, organisation.city, countryName].filter(Boolean).join(", ")}
        </Row>
        {organisation.website && <Row label={t("website")}>{organisation.website}</Row>}
      </Summary>

      <Summary title={t("documents")} onEdit={() => onEdit(3)}>
        {Object.keys(documents).length === 0 && (
          <p className="text-muted-foreground">{t("noDocuments")}</p>
        )}
        {Object.entries(documents).map(([type, doc]) => (
          <Row key={type} label={docLabel.get(type) ?? type}>
            <button
              type="button"
              onClick={() => setViewing(type)}
              className="inline-flex max-w-full items-center gap-1.5 text-left underline-offset-4 hover:underline"
            >
              <IconCircleCheckFilled className="size-4 shrink-0 text-whatsapp" />
              <span className="truncate">{doc.fileName}</span>
            </button>
          </Row>
        ))}
      </Summary>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-page p-4 text-sm">
        <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
        <span>
          {t.rich("terms", {
            terms: (chunks) => (
              <a href={`${PUBLIC_SITE}/terms`} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                {chunks}
              </a>
            ),
            privacy: (chunks) => (
              <a href={`${PUBLIC_SITE}/privacy`} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                {chunks}
              </a>
            ),
          })}
        </span>
      </label>

      <DocumentPreviewDialog
        title={viewing ? (docLabel.get(viewing) ?? viewing) : ""}
        doc={viewed ?? null}
        src={viewed ? (previews[viewed.key] ?? (viewed.url || undefined)) : undefined}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      />

      <FormError message={error} />
      <StepActions onBack={onBack} continueLabel={t("submit")} pending={pending} disabled={!accepted} reason={t("acceptFirst")} />
    </form>
  );
}

function Summary({ title, onEdit, children }: Readonly<{ title: string; onEdit: () => void; children: ReactNode }>) {
  const t = useTranslations("signUp.review");
  return (
    <section className="rounded-2xl bg-page p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-sm hover:bg-black/5">
          <IconPencil className="size-4" />
          {t("edit")}
        </button>
      </div>
      <dl className="space-y-2 text-sm">{children}</dl>
    </section>
  );
}

function Row({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium">{children}</dd>
    </div>
  );
}

/**
 * After the send: what happens next, and the way in. Nothing moves until the
 * person clicks — the session already exists, and refreshing the page here
 * would let the auth gate send them to /espace before they read this.
 *
 * Leaving does not reset the sign-up store: `finish()` already emptied what
 * is kept in the tab, and a reset would flip this screen back to an empty
 * first step for as long as /espace takes to load.
 */
export function SignUpDone({ email, signInRequired }: Readonly<{ email: string; signInRequired: boolean }>) {
  const leaving = useLeaving();
  const t = useTranslations("signUp.done");
  const whyNot = useWhyNot();

  // A full page load, not a client-side navigation: the request then carries
  // the session cookies just set, and if there were none the gate's redirect
  // lands on the sign-in page.
  function enter() {
    leaving.start();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full load, see above
    globalThis.location.assign("/espace");
  }

  return (
    <div className="space-y-8">
      <StepHeading
        title={t("title")}
        text={signInRequired ? t("signIn") : t("thanks")}
      />
      <div className="space-y-3">
        <p className="font-semibold text-sm">{t("next")}</p>
        <ol className="space-y-3 text-sm">
          {[
            { title: t("checkTitle"), text: t("checkText") },
            { title: t("activationTitle"), text: t("activationText") },
            { title: t("hireTitle"), text: t("hireText") },
          ].map((item, i) => (
            <li key={item.title} className="flex items-start gap-3 rounded-2xl bg-page p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-card font-semibold text-xs">
                {i + 1}
              </span>
              <span>
                <span className="block font-medium">{item.title}</span>
                <span className="block text-muted-foreground">{item.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      {signInRequired ? (
        <InlineSignIn email={email} />
      ) : (
        <Button
          variant="ghost"
          onClick={enter}
          disabled={leaving.active}
          title={whyNot([leaving.active, "wait"])}
          aria-busy={leaving.active || undefined}
          className="h-12 rounded-full border-0 bg-ink px-6 text-[15px] text-white hover:bg-ink/90 disabled:opacity-100 sm:h-12 sm:text-[15px]"
        >
          {t("enter")}
          {/* Not Button's `loading`: its spinner is invisible on ink. */}
          {leaving.active ? <Loader aria-hidden className="size-4 animate-spin" /> : <IconArrowRight />}
        </Button>
      )}
    </div>
  );
}

/**
 * Waiting on a full page load. Cleared when the browser restores this page
 * from its back/forward cache, so the button is not stuck spinning there.
 */
export function useLeaving() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setActive(false);
    };
    globalThis.addEventListener("pageshow", onShow);
    return () => globalThis.removeEventListener("pageshow", onShow);
  }, []);
  return { active, start: () => setActive(true) };
}
