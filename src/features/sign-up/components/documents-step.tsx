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
import { useLocale, useTranslations } from "next-intl";

import { Spinner } from "#/components/ui/spinner";
import { INTL_LOCALE } from "#/i18n/config";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { uploadSignUpDocument } from "#/lib/api/signup-controller";
import type { BusinessCatalog } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { requiredDocuments } from "../required-documents";
import { DocumentPreviewDialog } from "./document-preview";
import { useWhyNot } from "#/lib/use-why-not";
import { FormError, StepActions, StepHeading } from "./form-bits";

export type UploadedDocument = { url: string; key: string; fileName: string; mimeType?: string };
/** By document type: one file each. */
export type DocumentsValue = Record<string, UploadedDocument>;

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * The organisation's papers. The catalog for the chosen country, type and
 * legal form says which ones it must send (« obligatoires »: every group, one
 * paper of each — the RCCM and the NIU, the récépissé or the arrêté…); the
 * others follow, recommended then complementary. Files go to the private KYC
 * store as soon as they are picked, with the signup token.
 */
export function DocumentsStep({
  catalog,
  category,
  legalForm,
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
  /** Empty or undefined when none was chosen. */
  legalForm?: string;
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
    required: [],
  };
  const { groups, anyPaper, recommended, optional, missing } = requiredDocuments(documents, legalForm, value);
  const label = new Map(catalog.documentTypes.map((d) => [d.value, d.label]));
  const t = useTranslations("signUp");
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  // A type with nothing usual (« Autre organisation ») shows the whole list.
  const [showOptional, setShowOptional] = useState(
    recommended.length === 0 || optional.some((t) => value[t]),
  );
  // « A » ou « B » et « C »: the language's own "or" and "and".
  const or = new Intl.ListFormat(INTL_LOCALE[locale], { type: "disjunction" });
  const and = new Intl.ListFormat(INTL_LOCALE[locale], { type: "conjunction" });
  const missingText = anyPaper
    ? t("documents.anyDocument")
    : and.format(missing.map((group) => or.format(group.map((d) => t("documents.quoted", { name: label.get(d) ?? d })))));
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
        title={t("documents.title")}
        text={t("documents.text")}
      />

      {groups.length > 0 && (
        <section className="space-y-3">
          <p className="font-semibold text-sm">{t("documents.required")}</p>
          {groups.map((group) =>
            group.length === 1 ? (
              <DocumentRow
                key={group[0]}
                type={group[0]}
                title={label.get(group[0]) ?? group[0]}
                doc={value[group[0]]}
                onSet={set}
                {...rowProps}
              />
            ) : (
              <div key={group.join("|")} className="space-y-2 rounded-3xl bg-page/60 p-2">
                <p className="px-2 pt-1 text-muted-foreground text-xs">{t("documents.eitherOne")}</p>
                {group.map((type) => (
                  <DocumentRow key={type} type={type} title={label.get(type) ?? type} doc={value[type]} onSet={set} {...rowProps} />
                ))}
              </div>
            ),
          )}
        </section>
      )}

      {recommended.length > 0 && (
        <section className="space-y-3">
          <p className="font-semibold text-sm">
            {t("documents.recommended")} <span className="font-normal text-muted-foreground">({t("form.optional")})</span>
          </p>
          {recommended.map((type) => (
            <DocumentRow key={type} type={type} title={label.get(type) ?? type} doc={value[type]} onSet={set} {...rowProps} />
          ))}
        </section>
      )}

      {optional.length > 0 && (
        <section className="space-y-3">
          {showOptional ? (
            <>
              <p className="font-semibold text-sm">
                {anyPaper ? t("documents.yours") : t("documents.complementary")}{" "}
                <span className="font-normal text-muted-foreground">
                  ({anyPaper ? t("documents.atLeastOne") : t("form.optional")})
                </span>
              </p>
              {optional.map((type) => (
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
              {t("documents.addComplementary")}
            </button>
          )}
        </section>
      )}

      <FormError message={error} />
      {missing.length > 0 && (
        <p className="text-muted-foreground text-sm">{t("documents.missing", { list: missingText })}</p>
      )}
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
        disabled={missing.length > 0}
        reason={t("documents.missing", { list: missingText })}
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
  const t = useTranslations("signUp.documents");
  const whyNot = useWhyNot();
  const friendlyError = useFriendlyError();

  async function upload(file: File) {
    onError(null);
    if (file.size > MAX_BYTES) {
      onError(t("tooBig", { name: file.name }));
      return;
    }
    setUploading(true);
    try {
      const result = await uploadSignUpDocument(file, signupToken);
      onPreview(result.key, URL.createObjectURL(file));
      onSet(type, { url: result.url, key: result.key, fileName: file.name, mimeType: file.type });
    } catch (err) {
      onError(friendlyError(err, t("uploadFailed", { name: file.name })));
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
        title={whyNot([!doc, { say: t("noFile") }])}
        onClick={() => onView(type)}
        aria-label={doc ? t("previewOf", { title }) : undefined}
        className="group flex min-w-0 flex-1 items-center gap-4 rounded-xl text-left"
      >
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", doc ? "bg-whatsapp text-white" : "bg-card")}>
          {doc ? <IconCircleCheckFilled className="size-5" /> : <IconFileText className="size-5 text-muted-foreground" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-sm">{title}</span>
          <span className="block truncate text-muted-foreground text-xs group-enabled:group-hover:text-foreground group-enabled:group-hover:underline">
            {doc ? t("preview", { fileName: doc.fileName }) : t("noFile")}
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
          <button type="button" onClick={() => input.current?.click()} aria-label={t("replace")} className="rounded-full p-2 hover:bg-black/5">
            <IconRefresh className="size-4" />
          </button>
          <button type="button" onClick={() => onSet(type, null)} aria-label={t("remove")} className="rounded-full p-2 hover:bg-black/5">
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
          {t("upload")}
        </button>
      )}
    </div>
  );
}
