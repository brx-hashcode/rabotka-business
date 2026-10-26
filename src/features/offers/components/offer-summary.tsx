"use client";

import { useWatch, type Control } from "react-hook-form";
import {
  IconCalendarEvent,
  IconCash,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconMapPin,
  IconUsers,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import type { EmploymentType, PaymentFlow } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import { EMPLOYMENT_LABEL, fcfa, isDatedMission, PAYMENT_SUFFIX } from "../offer-labels";
import type { OfferFormValues } from "./offer-form";

const day = (date: string, time: string) => {
  const d = new Date(`${date}T${time || "12:00"}`);
  if (Number.isNaN(d.getTime())) return null;
  const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  return time ? `${label} à ${time.replace(":", " h ")}` : label;
};

/**
 * The offer as candidates will read it, kept in step with the form, and what
 * is still missing before it can be published.
 */
export function OfferSummary({
  control,
  categoryName,
  countryName,
}: Readonly<{
  control: Control<OfferFormValues>;
  categoryName: (id: string) => string | undefined;
  countryName: (code: string) => string | undefined;
}>) {
  const v = useWatch({ control }) as OfferFormValues;
  const type = v.employmentType as EmploymentType;
  const category = v.categoryId ? categoryName(v.categoryId) : undefined;
  const when = v.scheduledDate ? day(v.scheduledDate, v.scheduledTime) : null;
  const where = v.isRemote ? "À distance" : [v.city, countryName(v.countryCode)].filter(Boolean).join(", ");
  const quantity = Number(v.quantity) || 0;
  const amount = Number(v.amount) || 0;

  const checks = [
    { label: "Intitulé", done: v.title.trim().length >= 5 },
    { label: "Description (20 caractères au moins)", done: v.description.trim().length >= 20 },
    { label: "Métier", done: !!v.categoryId },
    { label: isDatedMission(type) ? "Date de la mission" : "Date de clôture", done: !!v.scheduledDate },
    { label: "Lieu", done: v.isRemote || (!!v.countryCode && !!v.city) },
  ];
  const done = checks.filter((c) => c.done).length;

  return (
    <section className="space-y-5 rounded-3xl bg-card p-6">
      <div className="space-y-3">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Aperçu de l&apos;offre</p>
        <h2 className={cn("break-words font-semibold text-xl leading-snug", !v.title.trim() && "text-muted-foreground")}>
          {v.title.trim() || "Intitulé de l'offre"}
        </h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-brand-lime px-2.5 py-1 font-medium text-[#0f2414]">{EMPLOYMENT_LABEL[type]}</span>
          {category && <span className="rounded-full bg-page px-2.5 py-1 font-medium">{category}</span>}
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <Row icon={IconCalendarEvent} label={isDatedMission(type) ? "Date" : "Clôture"} value={when} />
        <Row icon={IconMapPin} label="Lieu" value={where || null} hint={v.isRemote ? undefined : v.address.trim() || undefined} />
        <Row
          icon={IconUsers}
          label="Postes"
          value={quantity >= 1 ? `${quantity} personne${quantity > 1 ? "s" : ""}` : null}
        />
        <Row
          icon={IconCash}
          label="Rémunération"
          value={
            amount
              ? `${fcfa(amount)}${v.paymentFlow ? ` ${PAYMENT_SUFFIX[v.paymentFlow as PaymentFlow]}` : ""}`
              : "À discuter avec le candidat"
          }
        />
      </dl>

      <div className="space-y-3 rounded-2xl bg-page p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium text-sm">{done === checks.length ? "Prête à publier" : "À compléter"}</p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {done}/{checks.length}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-card">
          <div className="h-full rounded-full bg-whatsapp-dark transition-[width]" style={{ width: `${(done / checks.length) * 100}%` }} />
        </div>
        <ul className="space-y-1.5 text-sm">
          {checks.map((c) => (
            <li key={c.label} className={cn("flex items-center gap-2", c.done ? "text-foreground" : "text-muted-foreground")}>
              {c.done ? (
                <IconCircleCheckFilled className="size-4 shrink-0 text-whatsapp-dark" />
              ) : (
                <IconCircleDashed className="size-4 shrink-0" />
              )}
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  hint,
}: Readonly<{ icon: TablerIcon; label: string; value: string | null; hint?: string }>) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-page">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className={cn("break-words font-medium", !value && "text-muted-foreground")}>{value ?? "Non renseigné"}</dd>
        {hint && <dd className="break-words text-muted-foreground text-xs">{hint}</dd>}
      </div>
    </div>
  );
}
