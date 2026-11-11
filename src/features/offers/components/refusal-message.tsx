"use client";

import { useQuery } from "@tanstack/react-query";

import { Textarea } from "#/components/ui/textarea";
import { listMessageTemplates, messageTemplatesKey } from "#/lib/api/message-templates-controller";
import { cn } from "#/lib/utils";

/** Ready words for a refusal while the team's own templates load (the server offers the same). */
export const REFUSAL_TEMPLATES = [
  {
    label: "Poste pourvu",
    text: "Merci pour votre candidature. Les postes de cette offre sont désormais pourvus. Nous gardons votre profil en tête pour nos prochaines missions.",
  },
  {
    label: "Profil différent",
    text: "Merci pour votre candidature. Nous avons retenu des profils plus proches de ce que demande cette mission. Bonne continuation dans vos recherches.",
  },
  {
    label: "Disponibilités",
    text: "Merci pour votre candidature. Vos disponibilités ne correspondent pas aux dates de cette mission. N'hésitez pas à postuler à nos prochaines offres.",
  },
] as const;

/**
 * The message a refused candidate reads, in their notification: a template
 * to start from, the words to adjust. Contact details are refused by the
 * server (a refusal is no way round « obtenir le contact »).
 */
export function RefusalMessageField({ value, onChange }: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const templates = useRefusalTemplates();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => onChange(t.text)}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium text-xs transition-colors",
              value === t.text ? "bg-selected text-selected-foreground" : "bg-page text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={500}
        rows={4}
        placeholder="Un mot pour le candidat (facultatif)"
        className="min-h-24 rounded-xl border-0 bg-page px-4 py-3 shadow-none"
      />
      <p className="text-muted-foreground text-xs">Le candidat lit ce message dans sa notification. Pas de téléphone, d&apos;e-mail ni de lien.</p>
    </div>
  );
}

/**
 * The refusal words to pick from: the team's own « Refus » templates
 * (Organisation → Modèles de messages), else the ready-made ones.
 */
export function useRefusalTemplates(): { label: string; text: string }[] {
  const { data } = useQuery({ queryKey: messageTemplatesKey, queryFn: listMessageTemplates, staleTime: 60_000 });
  if (!data) return [...REFUSAL_TEMPLATES];
  const own = data.templates.filter((t) => t.kind === "REFUSAL").map((t) => ({ label: t.title, text: t.body }));
  if (own.length > 0) return own;
  return data.suggested.filter((t) => t.kind === "REFUSAL").map((t) => ({ label: t.title, text: t.body }));
}
