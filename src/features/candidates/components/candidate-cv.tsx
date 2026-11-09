"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconFileText, IconLock } from "@tabler/icons-react";

import { PreviewSheet, previewKindOf } from "#/components/preview-sheet";
import { Skeleton } from "#/components/ui/skeleton";
import { candidateCvUrl, getCandidateCv } from "#/lib/api/candidate-controller";

/** Under the key the candidate's other queries use: an unlocked contact refreshes it. */
export const candidateCvKey = (workerId: string) => ["candidate", workerId, "cv"] as const;

/**
 * « CV du candidat » on their profile: the CV they added themselves, whether or
 * not they applied with it. Shut until the contact is obtained (it has their
 * phone and e-mail on it), and said so, rather than hidden.
 */
export function CandidateCvSection({ workerId, name }: Readonly<{ workerId: string; name: string }>) {
  const { data, isLoading } = useQuery({
    queryKey: candidateCvKey(workerId),
    queryFn: () => getCandidateCv(workerId),
  });
  const [open, setOpen] = useState(false);
  const cv = data?.cv ?? null;

  return (
    <section className="space-y-3">
      <h3 className="font-medium text-sm">CV du candidat</h3>
      {isLoading ? (
        <Skeleton className="h-16 rounded-2xl" />
      ) : !cv ? (
        <p className="flex items-center gap-2 rounded-2xl bg-page p-4 text-muted-foreground text-sm">
          <IconFileText className="size-5" />
          Le candidat n&apos;a pas encore ajouté de CV.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-page p-4">
          <IconFileText className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{cv.fileName}</p>
            <p className="text-muted-foreground text-xs">
              Ajouté le {new Date(cv.uploadedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {cv.available ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-card px-4 font-medium text-sm hover:bg-card/70"
            >
              Voir le CV
            </button>
          ) : (
            <span
              title="Le CV porte ses coordonnées : il s'ouvre une fois son contact obtenu."
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 font-medium text-muted-foreground text-sm"
            >
              <IconLock className="size-4" />
              Après obtention du contact
            </span>
          )}
        </div>
      )}
      {cv?.available && (
        <PreviewSheet
          open={open}
          onOpenChange={setOpen}
          title={`CV de ${name}`}
          subtitle="Ajouté par le candidat à son profil"
          src={candidateCvUrl(workerId)}
          kind={previewKindOf(cv.mimeType) ?? "pdf"}
          fileName={cv.fileName}
          unavailable="Ce CV n'a pas pu être chargé."
        />
      )}
    </section>
  );
}
