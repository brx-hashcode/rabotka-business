"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight, IconCircleCheckFilled, IconPencil } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { useCountries } from "#/hooks/use-geo";
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
  const [accepted, setAccepted] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const viewed = viewing ? documents[viewing] : undefined;
  const { data: countries } = useCountries();
  const countryName = countries?.find((c) => c.code === organisation.country)?.name ?? organisation.country;
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
        title="Vérifiez vos informations"
        text="Relisez avant l'envoi : nos équipes vérifieront votre organisation sur la base de ces éléments."
      />

      <Summary title="Responsable du compte" onEdit={() => onEdit(0)}>
        <Row label="Nom">{`${account.firstName} ${account.lastName}`}</Row>
        <Row label="Email">{account.email}</Row>
        <Row label="Téléphone">{account.phone}</Row>
      </Summary>

      <Summary title="Organisation" onEdit={() => onEdit(2)}>
        <Row label="Raison sociale">{organisation.name}</Row>
        <Row label="Type">{categoryLabel}</Row>
        {legalFormLabel && <Row label="Forme juridique">{legalFormLabel}</Row>}
        {organisation.size && <Row label="Effectif">{`${organisation.size} salariés`}</Row>}
        {organisation.registrationNumber && <Row label="RCCM">{organisation.registrationNumber}</Row>}
        {organisation.taxId && <Row label="NIU">{organisation.taxId}</Row>}
        <Row label="Adresse">{`${organisation.address}, ${organisation.city}, ${countryName}`}</Row>
        {organisation.website && <Row label="Site web">{organisation.website}</Row>}
      </Summary>

      <Summary title="Documents" onEdit={() => onEdit(3)}>
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
          J&apos;accepte les{" "}
          <a href={`${PUBLIC_SITE}/terms`} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
            conditions d&apos;utilisation
          </a>{" "}
          et la{" "}
          <a href={`${PUBLIC_SITE}/privacy`} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
            politique de confidentialité
          </a>{" "}
          de Rabotka, et certifie être habilité(e) à représenter cette organisation.
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
      <StepActions onBack={onBack} continueLabel="Envoyer ma demande" pending={pending} disabled={!accepted} />
    </form>
  );
}

function Summary({ title, onEdit, children }: Readonly<{ title: string; onEdit: () => void; children: ReactNode }>) {
  return (
    <section className="rounded-2xl bg-page p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-sm hover:bg-black/5">
          <IconPencil className="size-4" />
          Modifier
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
 */
export function SignUpDone({
  email,
  signInRequired,
  onLeave,
}: Readonly<{ email: string; signInRequired: boolean; onLeave: () => void }>) {
  const router = useRouter();

  function enter() {
    onLeave();
    router.replace("/espace");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <StepHeading
        title="Votre compte entreprise est créé"
        text={
          signInRequired
            ? "Il ne reste qu'à vous connecter : saisissez le code que nous venons d'envoyer par email."
            : "Merci ! Nos équipes examinent maintenant les pièces de votre organisation. Vous serez informé par email dès que votre compte sera activé."
        }
      />
      <div className="space-y-3">
        <p className="font-semibold text-sm">Les prochaines étapes</p>
        <ol className="space-y-3 text-sm">
          {[
            {
              title: "Vérification de votre organisation",
              text: "Nos équipes examinent vos pièces justificatives.",
            },
            {
              title: "Activation de votre compte",
              text: "Vous êtes prévenu par email et dans votre espace.",
            },
            {
              title: "Vos premiers recrutements",
              text: "Publiez vos offres et recevez des profils présélectionnés.",
            },
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
        <InlineSignIn email={email} onSignedIn={onLeave} />
      ) : (
        <Button
          variant="ghost"
          onClick={enter}
          className="h-12 rounded-full border-0 bg-ink px-6 text-[15px] text-white hover:bg-ink/90 sm:h-12 sm:text-[15px]"
        >
          Découvrir mon espace entreprise
          <IconArrowRight />
        </Button>
      )}
    </div>
  );
}
