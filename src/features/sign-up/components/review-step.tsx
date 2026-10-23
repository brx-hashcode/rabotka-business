"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { IconCircleCheckFilled, IconPencil } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { useCountries } from "#/hooks/use-geo";
import type { BusinessCatalog } from "#/lib/api/types";
import { PUBLIC_SITE } from "#/features/landing/content";
import type { AccountValues } from "./account-step";
import type { DocumentsValue } from "./documents-step";
import { FormError, StepActions, StepHeading } from "./form-bits";
import type { OrganisationValues } from "./organisation-step";

/** Everything entered, by step, with a way back to each; then the terms and the send. */
export function ReviewStep({
  catalog,
  account,
  organisation,
  documents,
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
  pending: boolean;
  error: string | null;
  onEdit: (step: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}>) {
  const [accepted, setAccepted] = useState(false);
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
            <span className="inline-flex items-center gap-1.5">
              <IconCircleCheckFilled className="size-4 text-whatsapp" />
              <span className="truncate">{doc.fileName}</span>
            </span>
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

/** After the send: what happens next, and the way into the space. */
export function SignUpDone({ email }: Readonly<{ email: string }>) {
  return (
    <div className="space-y-8">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-chip-green text-whatsapp-dark">
        <IconCircleCheckFilled className="size-7" />
      </span>
      <StepHeading
        title="Votre demande a bien été envoyée"
        text="Votre compte entreprise est créé. Nos équipes examinent maintenant les pièces de votre organisation ; votre compte sera activé dès leur validation."
      />
      <ol className="space-y-3 text-sm">
        {[
          "Vérification de vos documents par nos équipes",
          "Activation de votre compte entreprise",
          "Publication de vos premières offres",
        ].map((item, i) => (
          <li key={item} className="flex items-center gap-3 rounded-2xl bg-page p-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-card font-semibold text-xs">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground text-sm">
        Pour vous reconnecter, saisissez simplement <span className="font-medium text-foreground">{email}</span> : un code vous sera envoyé.
      </p>
      <Button
        variant="ghost"
        render={<Link href="/espace" />}
        className="h-12 rounded-full border-0 bg-ink px-6 text-white hover:bg-ink/90 sm:h-12"
      >
        Accéder à mon espace
      </Button>
    </div>
  );
}
