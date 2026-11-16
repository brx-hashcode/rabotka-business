"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { IconEye, IconFileText, IconPlus, IconRefresh } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { DocumentPreviewDialog } from "#/features/sign-up/components/document-preview";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { myBusinessDocumentUrl, uploadMyBusinessDocument } from "#/lib/api/business-controller";
import type { BusinessCatalog, MyBusiness, VerificationStatus } from "#/lib/api/types";
import { cn } from "#/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;

type Doc = MyBusiness["documents"][number];

const STATUS: Record<VerificationStatus, string> = {
  PENDING: "bg-chip-amber text-chip-amber-foreground",
  VERIFIED: "bg-chip-green text-chip-green-foreground",
  REJECTED: "bg-destructive/10 text-destructive",
};

export function StatusPill({ status }: Readonly<{ status: VerificationStatus }>) {
  const t = useTranslations("organisation.documents.status");
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-1 font-medium text-xs", STATUS[status])}>{t(status)}</span>
  );
}

/**
 * The organisation's papers as the review sees them. A refused one shows why
 * and is replaced in one click; the new version goes straight back to review
 * (the refused one stays on file for the team). None is required: the ones
 * recommended for its country and type, then the others, can be added.
 */
export function OrganisationDocuments({
  business,
  catalog,
  onChange,
}: Readonly<{
  business: MyBusiness;
  catalog: BusinessCatalog | undefined;
  onChange: (next: MyBusiness) => void;
}>) {
  const t = useTranslations("organisation.documents");
  const [viewing, setViewing] = useState<Doc | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const label = new Map(catalog?.documentTypes.map((d) => [d.value, d.label]));
  const provided = new Set(business.documents.map((d) => d.documentType));
  const optional = (catalog?.categories.find((c) => c.value === business.category)?.documents.optional ?? []).filter(
    (t) => !provided.has(t),
  );
  // Absent from a backend before the countries.
  const recommended = business.missingRecommended ?? [];
  const refused = business.documents.filter((d) => d.verificationStatus === "REJECTED").length;
  // Verified: the papers are settled; another one goes through the team.
  const locked = business.verificationStatus === "VERIFIED";

  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 sm:p-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">
          {locked
            ? t("lockedText")
            : refused > 0
              ? t("toReplace", { count: refused })
              : t("formats")}
        </p>
      </div>

      <ul className="space-y-2">
        {business.documents.map((doc) => (
          <li key={doc.id} className="space-y-3 rounded-2xl bg-page p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card">
                <IconFileText className="size-5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{doc.label}</p>
                <p className="truncate text-muted-foreground text-xs">
                  {doc.fileName ?? t("file")}
                  {doc.resubmitted && doc.verificationStatus === "PENDING" ? ` · ${t("resubmitted")}` : ""}
                </p>
              </div>
              <StatusPill status={doc.verificationStatus} />
            </div>

            {doc.verificationStatus === "REJECTED" && (
              <p className="rounded-xl bg-destructive/8 px-3 py-2 text-destructive text-sm">
                {t("reason", { reason: doc.rejectionReason || t("noReason") })}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setViewing(doc)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-4 font-medium text-sm transition-colors hover:bg-card/70"
              >
                <IconEye className="size-4" />
                {t("view")}
              </button>
              {!locked && doc.verificationStatus !== "VERIFIED" && (
                <UploadButton
                  documentType={doc.documentType}
                  replacesId={doc.id}
                  label={t("replace")}
                  icon="replace"
                  primary={doc.verificationStatus === "REJECTED"}
                  onUploaded={onChange}
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      {!locked && recommended.length > 0 && (
        <div className="space-y-3 rounded-2xl bg-page p-4">
          <p className="font-medium text-sm">
            {t("recommended")}{" "}
            <span className="font-normal text-muted-foreground">{t("recommendedHint")}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {recommended.map((d) => (
              <UploadButton key={d.type} documentType={d.type} label={d.label} icon="add" onUploaded={onChange} />
            ))}
          </div>
        </div>
      )}

      {!locked && optional.length > 0 &&
        (showOptional ? (
          <div className="space-y-2">
            <p className="font-medium text-sm">
              {t("extra")} <span className="font-normal text-muted-foreground">{t("optional")}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {optional.map((type) => (
                <UploadButton
                  key={type}
                  documentType={type}
                  label={label.get(type) ?? type}
                  icon="add"
                  onUploaded={onChange}
                />
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowOptional(true)}
            className="inline-flex items-center gap-2 rounded-full bg-page px-4 py-2.5 font-medium text-sm transition-colors hover:bg-page/70"
          >
            <IconPlus className="size-4" />
            {t("addExtra")}
          </button>
        ))}

      <DocumentPreviewDialog
        title={viewing?.label ?? ""}
        doc={
          viewing
            ? {
                url: myBusinessDocumentUrl(viewing.id),
                key: viewing.id,
                fileName: viewing.fileName ?? viewing.label,
                mimeType: viewing.mimeType ?? undefined,
              }
            : null
        }
        src={viewing ? myBusinessDocumentUrl(viewing.id) : undefined}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      />
    </section>
  );
}

/** Picks a file and sends it at once: a new paper, or a replacement. */
function UploadButton({
  documentType,
  replacesId,
  label,
  icon,
  primary,
  onUploaded,
}: Readonly<{
  documentType: string;
  replacesId?: string;
  label: string;
  icon: "add" | "replace";
  primary?: boolean;
  onUploaded: (next: MyBusiness) => void;
}>) {
  const t = useTranslations("organisation.documents");
  const friendlyError = useFriendlyError();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const Icon = icon === "add" ? IconPlus : IconRefresh;

  async function send(file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error(t("badType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("tooBig"));
      return;
    }
    setPending(true);
    try {
      onUploaded(await uploadMyBusinessDocument(file, documentType, replacesId));
      toast.success(replacesId ? t("replaced") : t("added"));
    } catch (err) {
      toast.error(friendlyError(err, t("failed")));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void send(file);
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full px-4 font-medium text-sm transition-colors disabled:opacity-100",
          primary ? "bg-ink text-white hover:bg-ink/90" : "bg-card hover:bg-card/70",
        )}
      >
        {pending ? (
          <Loader aria-label={t("sending")} className={cn("size-4 animate-spin", primary && "text-white")} />
        ) : (
          <Icon className="size-4" />
        )}
        {label}
      </button>
    </>
  );
}
