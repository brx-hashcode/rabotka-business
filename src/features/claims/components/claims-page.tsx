"use client";

import { useLocale, useTranslations } from "next-intl";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  IconArrowUpRight,
  IconCircleCheck,
  IconClockHour4,
  IconHelp,
  IconMessageReport,
  IconMessages,
  IconPhoto,
  IconPlus,
} from "@tabler/icons-react";

import { Bone, TilesSkeleton } from "#/components/page-skeletons";
import { StatTile } from "#/features/home/components/stat-tile";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import type { Translator } from "#/i18n/translator";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { claimsKey, listClaims, type Claim, type ClaimStatus } from "#/lib/api/claim-controller";
import { cn } from "#/lib/utils";
import { isClosed, splitTitle, StatusPill } from "./claim-bits";

const date = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" });

/** « il y a 3 jours », for the last change on a request. */
function ago(iso: string, t: Translator<"claims.list">, locale: Locale): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return minutes <= 1 ? t("ago.justNow") : t("ago.minutes", { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("ago.hours", { n: hours });
  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? t("ago.yesterday") : t("ago.days", { n: days });
  return t("ago.on", { date: date(iso, locale) });
}

/** The account's claims to the Rabotka team — the client app's endpoints — as cards, open ones first. */
export function ClaimsPage() {
  const t = useTranslations("claims.list");
  const friendlyError = useFriendlyError();
  const claims = useQuery({ queryKey: claimsKey, queryFn: () => listClaims(1, 100) });
  // The tab lives in the URL (?onglet=), so a reload or a shared link keeps it.
  const [tab, setTab] = useQueryState("onglet", parseAsStringLiteral(["open", "closed"] as const).withDefault("open"));
  const all = claims.data?.data ?? [];
  const open = all.filter((c) => !isClosed(c.status as ClaimStatus));
  const closed = all.filter((c) => isClosed(c.status as ClaimStatus));
  const shown = tab === "open" ? open : closed;
  const waiting = open.filter((c) => c.status === "CREATED").length;

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("intro")}</p>
        </div>
        <Link
          href="/espace/reclamations/nouvelle"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 font-medium text-white hover:bg-ink/90"
        >
          <IconPlus className="size-4" />
          {t("new")}
        </Link>
      </div>

      {/* The summary, as on the other pages: one card of tiles. */}
      {claims.isLoading ? (
        <div className="rounded-3xl bg-card p-6 sm:p-8">
          <TilesSkeleton count={3} />
        </div>
      ) : (
        claims.data &&
        all.length > 0 && (
          <section className="grid grid-cols-1 gap-3 rounded-3xl bg-card p-6 sm:grid-cols-3 sm:gap-4 sm:p-8">
            <StatTile icon={IconMessages} label={t("open")} value={String(open.length)} hint={t("openHint")} />
            <StatTile icon={IconClockHour4} label={t("waiting")} value={String(waiting)} hint={t("waitingHint")} />
            <StatTile icon={IconCircleCheck} label={t("closed")} value={String(closed.length)} hint={t("closedHint")} />
          </section>
        )
      )}

      <section className="space-y-4">
        <div role="tablist" className="inline-flex rounded-full bg-card p-1">
          {(
            [
              ["open", t("open"), open.length],
              ["closed", t("closed"), closed.length],
            ] as const
          ).map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => void setTab(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium text-sm",
                tab === key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span className="tabular-nums opacity-70">{n}</span>
            </button>
          ))}
        </div>

        {claims.isLoading ? (
          <CardsSkeleton />
        ) : !claims.data ? (
          <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(claims.error, t("loadFailed"))}</p>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
              <IconMessageReport className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">{tab === "open" ? t("emptyOpen") : t("emptyClosed")}</p>
            {tab === "open" && (
              <p className="max-w-sm text-muted-foreground text-sm">{t("emptyText")}</p>
            )}
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => (
              <li key={c.id}>
                <ClaimCard claim={c} />
              </li>
            ))}
            {tab === "open" && (
              <li>
                <Link
                  href="/espace/reclamations/nouvelle"
                  className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-3xl bg-card/60 p-5 text-center text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                >
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-page">
                    <IconHelp className="size-5" />
                  </span>
                  <span className="font-medium text-sm">{t("another")}</span>
                  <span className="text-xs">{t("anotherText")}</span>
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function ClaimCard({ claim: c }: Readonly<{ claim: Claim }>) {
  const t = useTranslations("claims.list");
  const tc = useTranslations("claims");
  const locale = useLocale();
  const { topic, subject } = splitTitle(c.title);
  const Icon = topic?.icon ?? IconMessageReport;
  const updated = c.updatedAt !== c.createdAt;
  return (
    <Link
      href={`/espace/reclamations/${c.id}`}
      className="group flex h-full min-h-48 flex-col gap-4 rounded-3xl bg-card p-5 transition-colors hover:bg-card/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-page">
            <Icon className="size-5" />
          </span>
          <span className="truncate text-muted-foreground text-sm">{topic ? tc(`topics.${topic.value}.label`) : t("request")}</span>
        </div>
        <StatusPill status={c.status as ClaimStatus} />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="line-clamp-2 font-semibold leading-snug">{subject}</p>
        <p className="line-clamp-3 text-muted-foreground text-sm">{c.description}</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-page px-3.5 py-2.5 text-muted-foreground text-xs">
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span>{t("sentOn", { date: date(c.createdAt, locale) })}</span>
          {updated && <span>{t("updated", { ago: ago(c.updatedAt, t, locale) })}</span>}
          {c.attachmentUrls.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <IconPhoto className="size-3.5" />
              {c.attachmentUrls.length}
            </span>
          )}
        </span>
        <IconArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex min-h-48 flex-col gap-4 rounded-3xl bg-card p-5">
          <div className="flex items-center justify-between">
            <Bone className="size-11 rounded-2xl" />
            <Bone className="h-6 w-20 rounded-full" />
          </div>
          <Bone className="h-4 w-2/3" />
          <Bone className="h-3.5 w-full" />
          <Bone className="mt-auto h-9 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
