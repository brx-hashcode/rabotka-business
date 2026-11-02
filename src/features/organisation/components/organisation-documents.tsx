"use client";

import { useRef, useState } from "react";
import { IconEye, IconFileText, IconPlus, IconRefresh } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { DocumentPreviewDialog } from "#/features/sign-up/components/document-preview";
import { friendlyError } from "#/lib/api/friendly-error";
import { myBusinessDocumentUrl, uploadMyBusinessDocument } from "#/lib/api/business-controller";
import type { BusinessCatalog, MyBusiness, VerificationStatus } from "#/lib/api/types";
import { cn } from "#/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;

type Doc = MyBusiness["documents"][number];

const STATUS: Record<VerificationStatus, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-chip-amber text-chip-amber-foreground" },
  VERIFIED: { label: "Accepté", className: "bg-chip-green text-chip-green-foreground" },
  REJECTED: { label: "Refusé", className: "bg-destructive/10 text-destructive" },
};

export function StatusPill({ status }: Readonly<{ status: VerificationStatus }>) {
  const { label, className } = STATUS[status];
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-1 font-medium text-xs", className)}>{label}</span>
  );
}

/**
 * The organisation's papers as the review sees them. A refused one shows why
 * and is replaced in one click; the new version goes straight back to review
 * (the refused one stays on file for the team). Missing required papers, and
 * the optional ones, can be added.
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
  const [viewing, setViewing] = useState<Doc | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const label = new Map(catalog?.documentTypes.map((d) => [d.value, d.label]));
  const provided = new Set(business.documents.map((d) => d.documentType));
  const optional = (catalog?.categories.find((c) => c.value === business.category)?.documents.optional ?? []).filter(
    (t) => !provided.has(t),
  );
  const refused = business.documents.filter((d) => d.verificationStatus === "REJECTED").length;
  // Verified: the papers are settled; another one goes through the team.
  const locked = business.verificationStatus === "VERIFIED";

  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 sm:p-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">Documents</h2>
        <p className="text-muted-foreground text-sm">
          {locked
            ? "Ceux de votre vérification. Pour en ajouter un, faites une demande à l'équipe. Vos documents restent confidentiels."
            : refused > 0
              ? `${refused} document${refused > 1 ? "s" : ""} à remplacer.`
              : "PDF, JPG, PNG ou WEBP, 10 Mo maximum. Vos documents restent confidentiels."}
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
                  {doc.fileName ?? "Document"}
                  {doc.resubmitted && doc.verificationStatus === "PENDING" ? " · nouvelle version envoyée" : ""}
                </p>
              </div>
              <StatusPill status={doc.verificationStatus} />
            </div>

            {doc.verificationStatus === "REJECTED" && (
              <p className="rounded-xl bg-destructive/8 px-3 py-2 text-destructive text-sm">
                Motif : {doc.rejectionReason || "non précisé"}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setViewing(doc)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-4 font-medium text-sm transition-colors hover:bg-card/70"
              >
                <IconEye className="size-4" />
                Voir
              </button>
              {!locked && doc.verificationStatus !== "VERIFIED" && (
                <UploadButton
                  documentType={doc.documentType}
                  replacesId={doc.id}
                  label="Remplacer"
                  icon="replace"
                  primary={doc.verificationStatus === "REJECTED"}
                  onUploaded={onChange}
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      {!locked && business.missingDocuments.map((group) => (
        <div key={group.map((d) => d.type).join("|")} className="space-y-3 rounded-2xl bg-chip-amber/60 p-4">
          <p className="font-medium text-sm">
            À fournir : {group.map((d) => d.label).join(" ou ")}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.map((d) => (
              <UploadButton
                key={d.type}
                documentType={d.type}
                label={group.length > 1 ? d.label : "Ajouter"}
                icon="add"
                primary
                onUploaded={onChange}
              />
            ))}
          </div>
        </div>
      ))}

      {!locked && optional.length > 0 &&
        (showOptional ? (
          <div className="space-y-2">
            <p className="font-medium text-sm">
              Documents complémentaires <span className="font-normal text-muted-foreground">(facultatif)</span>
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
            Ajouter un document complémentaire
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
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const Icon = icon === "add" ? IconPlus : IconRefresh;

  async function send(file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Format non accepté : envoyez un PDF, JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Fichier trop lourd : 10 Mo maximum.");
      return;
    }
    setPending(true);
    try {
      onUploaded(await uploadMyBusinessDocument(file, documentType, replacesId));
      toast.success(replacesId ? "Nouvelle version envoyée : elle sera vérifiée." : "Document ajouté : il sera vérifié.");
    } catch (err) {
      toast.error(friendlyError(err, "Le document n'a pas pu être envoyé. Réessayez."));
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
          <Loader aria-label="Envoi" className={cn("size-4 animate-spin", primary && "text-white")} />
        ) : (
          <Icon className="size-4" />
        )}
        {label}
      </button>
    </>
  );
}
