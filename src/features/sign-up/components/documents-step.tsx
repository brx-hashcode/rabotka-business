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
import { DocumentPreviewDialog } from "./document-preview";
import { FormError, StepActions, StepHeading } from "./form-bits";

export type UploadedDocument = { url: string; key: string; fileName: string; mimeType?: string };
/** By document type: one file each. */
export type DocumentsValue = Record<string, UploadedDocument>;

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * The organisation's papers. None is required: the catalog for the chosen
 * country and type lists the usual ones first (« recommandés »), the others
 * below; an organisation sends what it has, and the review asks for the rest.
 * Files go to the private KYC store as soon as they are picked, with the
 * signup token.
 */
export function DocumentsStep({
  catalog,
  category,
  signupToken,
  value,
  previews,
  onChange,
  onPreview,
  onBack,
  onDone,
}: Readonly<{
  catalog: BusinessCatalog;
  category: string;
  signupToken: string;
  value: DocumentsValue;
  previews: Record<string, string>;
  onChange: (next: DocumentsValue) => void;
  /** A local object URL for a file just picked, to preview without a request. */
  onPreview: (key: string, url: string) => void;
  onBack: () => void;
  onDone: () => void;
}>) {
  const documents = catalog.categories.find((c) => c.value === category)?.documents ?? {
    recommended: [],
    optional: [],
  };
  const label = new Map(catalog.documentTypes.map((d) => [d.value, d.label]));
  const [error, setError] = useState<string | null>(null);
  // A type with nothing usual (« Autre organisation ») shows the whole list.
  const [showOptional, setShowOptional] = useState(
    documents.recommended.length === 0 || documents.optional.some((t) => value[t]),
  );
  const sent = Object.keys(value).length;
  const [viewing, setViewing] = useState<string | null>(null);
  const viewed = viewing ? value[viewing] : undefined;
  const rowProps = { signupToken, onError: setError, onPreview, onView: setViewing };

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
        text="Envoyez ceux dont vous disposez : ils accélèrent la vérification de votre organisation. Vous pourrez en ajouter depuis votre espace. PDF, JPG, PNG ou WEBP, 10 Mo maximum par fichier ; vos documents restent confidentiels."
      />

      {documents.recommended.length > 0 && (
        <section className="space-y-3">
          <p className="font-semibold text-sm">
            Documents recommandés <span className="font-normal text-muted-foreground">(facultatif)</span>
          </p>
          {documents.recommended.map((type) => (
            <DocumentRow key={type} type={type} title={label.get(type) ?? type} doc={value[type]} onSet={set} {...rowProps} />
          ))}
        </section>
      )}

      {documents.optional.length > 0 && (
        <section className="space-y-3">
          {showOptional ? (
            <>
              <p className="font-semibold text-sm">
                Documents complémentaires <span className="font-normal text-muted-foreground">(facultatif)</span>
              </p>
              {documents.optional.map((type) => (
                <DocumentRow
                  key={type}
                  type={type}
                  title={label.get(type) ?? type}
                  doc={value[type]}
                  onSet={set}
                  {...rowProps}
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
      <DocumentPreviewDialog
        title={viewing ? (label.get(viewing) ?? viewing) : ""}
        doc={viewed ?? null}
        src={viewed ? (previews[viewed.key] ?? viewed.url) : undefined}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      />
      <StepActions
        type="button"
        onBack={onBack}
        onContinue={onDone}
        continueLabel={sent === 0 ? "Continuer sans document" : "Continuer"}
      />
    </div>
  );
}

type RowCallbacks = {
  signupToken: string;
  onError: (message: string | null) => void;
  onPreview: (key: string, url: string) => void;
  onView: (type: string) => void;
};

/** One paper: its name (click to preview once uploaded), and upload / replace / remove. */
function DocumentRow({
  type,
  title,
  doc,
  signupToken,
  onSet,
  onError,
  onPreview,
  onView,
}: Readonly<{
  type: string;
  title: string;
  doc: UploadedDocument | undefined;
  onSet: (type: string, doc: UploadedDocument | null) => void;
} & RowCallbacks>) {
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
      onPreview(result.key, URL.createObjectURL(file));
      onSet(type, { url: result.url, key: result.key, fileName: file.name, mimeType: file.type });
    } catch (err) {
      onError(friendlyError(err, `« ${file.name} » n'a pas pu être envoyé. Réessayez.`));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className={cn("flex items-center gap-4 rounded-2xl p-4 transition-colors", doc ? "bg-chip-green" : "bg-page")}>
      <button
        type="button"
        disabled={!doc}
        onClick={() => onView(type)}
        aria-label={doc ? `Aperçu : ${title}` : undefined}
        className="group flex min-w-0 flex-1 items-center gap-4 rounded-xl text-left disabled:cursor-default"
      >
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", doc ? "bg-whatsapp text-white" : "bg-card")}>
          {doc ? <IconCircleCheckFilled className="size-5" /> : <IconFileText className="size-5 text-muted-foreground" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-sm">{title}</span>
          <span className="block truncate text-muted-foreground text-xs group-enabled:group-hover:text-foreground group-enabled:group-hover:underline">
            {doc ? `${doc.fileName} · Aperçu` : "Aucun fichier"}
          </span>
        </span>
      </button>
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
