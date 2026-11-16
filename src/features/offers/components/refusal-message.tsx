"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Textarea } from "#/components/ui/textarea";
import { listMessageTemplates, messageTemplatesKey } from "#/lib/api/message-templates-controller";
import { contentMessages } from "#/i18n/content";
import { cn } from "#/lib/utils";
import { useOfferLanguage } from "../offer-language";

/**
 * Ready words for a refusal (offers.refusal.templates), in the offer's
 * language: the candidate reads them, so they follow the job, not the screen.
 */
export function useDefaultRefusals(): { label: string; text: string }[] {
  return contentMessages(useOfferLanguage()).offers.raw("refusal.templates") as { label: string; text: string }[];
}

/**
 * The message a refused candidate reads, in their notification: a template
 * to start from, the words to adjust. Contact details are refused by the
 * server (a refusal is no way round « obtenir le contact »).
 */
export function RefusalMessageField({ value, onChange }: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const templates = useRefusalTemplates();
  const tr = useTranslations("offers.refusal");
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
        placeholder={tr("placeholder")}
        className="min-h-24 rounded-xl border-0 bg-page px-4 py-3 shadow-none"
      />
      <p className="text-muted-foreground text-xs">{tr("note")}</p>
    </div>
  );
}

/**
 * The refusal words to pick from: the team's own « Refus » templates
 * (Organisation → Modèles de messages), else the ready-made ones.
 */
export function useRefusalTemplates(): { label: string; text: string }[] {
  const { data } = useQuery({ queryKey: messageTemplatesKey, queryFn: listMessageTemplates, staleTime: 60_000 });
  const defaults = useDefaultRefusals();
  const language = useOfferLanguage();
  if (!data) return defaults;
  const own = data.templates.filter((t) => t.kind === "REFUSAL").map((t) => ({ label: t.title, text: t.body }));
  if (own.length > 0) return own;
  // The server's ready-made ones are French: for an offer in another language, ours.
  if (language !== "fr") return defaults;
  return data.suggested.filter((t) => t.kind === "REFUSAL").map((t) => ({ label: t.title, text: t.body }));
}
