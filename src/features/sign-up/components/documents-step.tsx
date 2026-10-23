"use client";

import { useRef, useState } from "react";
import {
  IconCircleCheckFilled,
  IconFileText,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";

import { Spinner } from "#/components/ui/spinner";
import { friendlyError } from "#/lib/api/friendly-error";
import { uploadSignUpDocument } from "#/lib/api/signup-controller";
import type { BusinessCatalog } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { FormError, StepActions, StepHeading } from "./form-bits";

export type UploadedDocument = { url: string; key: string; fileName: string };
/** By document type: one file each. */
export type DocumentsValue = Record<string, UploadedDocument>;

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * The organisation's papers. What is required comes from the catalog for the
 * chosen category: each « one of » group is one row (pick which paper you
 * have), the optional ones sit below. Files go to the private KYC store as
 * soon as they are picked, with the signup token.
 */
export function DocumentsStep({
  catalog,
  category,
  signupToken,
  value,
  onChange,
  onBack,
  onDone,
}: Readonly<{
  catalog: BusinessCatalog;
  category: string;
  signupToken: string;
  value: DocumentsValue;
  onChange: (next: DocumentsValue) => void;
  onBack: () => void;
  onDone: () => void;
}>) {
  const requirement = catalog.categories.find((c) => c.value === category)?.documents ?? {
    required: [],
    optional: [],
  };
  const label = new Map(catalog.documentTypes.map((d) => [d.value, d.label]));
  const [error, setError] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(
    requirement.optional.some((t) => value[t]),
  );

  const missing = requirement.required.filter((group) => !group.some((t) => value[t]));

  function set(type: string, doc: UploadedDocument | null) {
    const next = { ...value };
    if (doc) next[type] = doc;
    else delete next[type];
    onChange(next);
  }

  return (
    <div className="space-y-8">
      <StepHeading
        title="Pièces justificatives"
        text="Formats acceptés : PDF, JPG, PNG ou WEBP, 10 Mo maximum par fichier. Vos documents restent confidentiels."
      />

      {requirement.required.length > 0 && (
        <section className="space-y-3">
          <p className="font-semibold text-sm">Documents requis</p>
          {requirement.required.map((group) => (
            <RequiredGroup
              key={group.join("|")}
              group={group}
              label={label}
              value={value}
              signupToken={signupToken}
              onSet={set}
              onError={setError}
            />
          ))}
        </section>
      )}

      {requirement.optional.length > 0 && (
        <section className="space-y-3">
          {showOptional ? (
            <>
              <p className="font-semibold text-sm">
                Documents complémentaires <span className="font-normal text-muted-foreground">(facultatif)</span>
              </p>
              {requirement.optional.map((type) => (
                <DocumentRow
                  key={type}
                  type={type}
                  title={label.get(type) ?? type}
                  doc={value[type]}
                  signupToken={signupToken}
                  onSet={set}
                  onError={setError}
                />
              ))}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowOptional(true)}
              className="inline-flex items-center gap-2 rounded-full bg-page px-4 py-2.5 font-medium text-sm transition-colors hover:bg-page/70"
            >
              <IconPlus className="size-4" />
              Ajouter des documents complémentaires
            </button>
          )}
        </section>
      )}

      <FormError message={error} />
      <StepActions
        type="button"
        onBack={onBack}
        onContinue={onDone}
        disabled={missing.length > 0}
        continueLabel={missing.length > 0 ? `${missing.length} document${missing.length > 1 ? "s" : ""} manquant${missing.length > 1 ? "s" : ""}` : "Continuer"}
      />
    </div>
  );
}

/** A required « one of » group: chips to say which paper, then its upload. */
function RequiredGroup({
  group,
  label,
  value,
  signupToken,
  onSet,
  onError,
}: Readonly<{
  group: string[];
  label: Map<string, string>;
  value: DocumentsValue;
  signupToken: string;
  onSet: (type: string, doc: UploadedDocument | null) => void;
  onError: (message: string | null) => void;
}>) {
  const uploaded = group.find((t) => value[t]);
  const [chosen, setChosen] = useState(uploaded ?? group[0]);

  return (
    <div className="space-y-3">
      {group.length > 1 && !uploaded && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Vous disposez de :</span>
          {group.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setChosen(t)}
              aria-pressed={chosen === t}
              className={cn(
                "rounded-full px-3 py-1.5 font-medium transition-colors",
                chosen === t ? "bg-ink text-white" : "bg-page hover:bg-page/70",
              )}
            >
              {label.get(t) ?? t}
            </button>
          ))}
        </div>
      )}
      <DocumentRow
        type={uploaded ?? chosen}
        title={label.get(uploaded ?? chosen) ?? chosen}
        required
        doc={value[uploaded ?? chosen]}
        signupToken={signupToken}
        onSet={onSet}
        onError={onError}
      />
    </div>
  );
}

/** One paper: its name, and upload / replace / remove. */
function DocumentRow({
  type,
  title,
  required,
  doc,
  signupToken,
  onSet,
  onError,
}: Readonly<{
  type: string;
  title: string;
  required?: boolean;
  doc: UploadedDocument | undefined;
  signupToken: string;
  onSet: (type: string, doc: UploadedDocument | null) => void;
  onError: (message: string | null) => void;
}>) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    onError(null);
    if (file.size > MAX_BYTES) {
      onError(`« ${file.name} » dépasse 10 Mo.`);
      return;
    }
    setUploading(true);
    try {
      const result = await uploadSignUpDocument(file, signupToken);
      onSet(type, { url: result.url, key: result.key, fileName: file.name });
    } catch (err) {
      onError(friendlyError(err, `« ${file.name} » n'a pas pu être envoyé. Réessayez.`));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className={cn("flex items-center gap-4 rounded-2xl p-4 transition-colors", doc ? "bg-chip-green" : "bg-page")}>
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", doc ? "bg-whatsapp text-white" : "bg-card")}>
        {doc ? <IconCircleCheckFilled className="size-5" /> : <IconFileText className="size-5 text-muted-foreground" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">
          {title}
          {required && !doc && <span className="text-destructive"> *</span>}
        </p>
        <p className="truncate text-muted-foreground text-xs">{doc ? doc.fileName : "Aucun fichier"}</p>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {uploading ? (
        <Spinner className="size-5" />
      ) : doc ? (
        <span className="flex shrink-0 gap-1">
          <button type="button" onClick={() => input.current?.click()} aria-label="Remplacer" className="rounded-full p-2 hover:bg-black/5">
            <IconRefresh className="size-4" />
          </button>
          <button type="button" onClick={() => onSet(type, null)} aria-label="Retirer" className="rounded-full p-2 hover:bg-black/5">
            <IconTrash className="size-4" />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-card px-4 py-2 font-medium text-sm transition-colors hover:bg-card/70"
        >
          <IconUpload className="size-4" />
          Téléverser
        </button>
      )}
    </div>
  );
}
