"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowRight,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconCreditCard,
  IconFileText,
  IconLockOpen,
  IconShieldCheck,
} from "@tabler/icons-react";

import { Skeleton } from "#/components/ui/skeleton";
import { NotificationList } from "#/features/layout/components/notification-bell";
import { StatusPill } from "#/features/organisation/components/organisation-documents";
import { useSessionUser } from "#/hooks/use-session-user";
import { getMyBusiness, getMySubscription, myBusinessKey, mySubscriptionKey } from "#/lib/api/business-controller";
import {
  listNotifications,
  markNotificationRead,
  notificationsKey,
  type AppNotification,
} from "#/lib/api/notification-controller";
import type { MyBusiness, MySubscription } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { SubscriptionBanner } from "#/features/subscription/components/subscription-banner";
import { StatTile } from "./stat-tile";

const DAY_MS = 24 * 60 * 60 * 1000;
const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const of = (used: number, limit: number | null) => (limit === null ? `${used}` : `${used}/${limit}`);

/**
 * The business space's home, on real data only: the organisation, its plan
 * and its notifications. Offers and candidates join when those pages exist.
 */
export function HomeOverview() {
  const { data: user } = useSessionUser();
  const business = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const b = business.data;
  const s = subscription.data;

  return (
    <div className="w-full space-y-6 pt-2">
      <Hero firstName={user?.first_name} business={b} subscription={s} loading={business.isLoading || subscription.isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <SubscriptionCard subscription={s} loading={subscription.isLoading} />
        <DocumentsCard business={b} loading={business.isLoading} />
        <NotificationsCard />
      </div>

      {b && s && <NextSteps business={b} subscription={s} />}
    </div>
  );
}

function Hero({
  firstName,
  business,
  subscription,
  loading,
}: Readonly<{ firstName?: string; business?: MyBusiness; subscription?: MySubscription; loading: boolean }>) {
  const e = subscription?.entitlements;
  const docs = business?.documents ?? [];
  const accepted = docs.filter((d) => d.verificationStatus === "VERIFIED").length;
  const daysLeft = e?.endsAt ? Math.max(0, Math.ceil((new Date(e.endsAt).getTime() - new Date().setHours(0, 0, 0, 0)) / DAY_MS)) : null;
  const verification =
    business?.verificationStatus === "VERIFIED"
      ? "Vérifiée"
      : business?.verificationStatus === "REJECTED" || docs.some((d) => d.verificationStatus === "REJECTED")
        ? "À corriger"
        : "En cours";

  return (
    <section className="rounded-3xl bg-card p-6 sm:p-8">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">Tableau de bord</h1>
        <p className="text-muted-foreground">
          {firstName ? `Bonjour ${firstName}, ` : ""}
          {business ? `voici l'activité de ${business.name}.` : "voici l'activité de votre organisation."}
        </p>
        {/* Only when something is to do about the plan. */}
        <SubscriptionBanner className="mt-4 rounded-2xl p-4" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : !e || !business ? (
          <p className="rounded-2xl bg-page p-5 text-muted-foreground text-sm sm:col-span-2 xl:col-span-4">
            Ces informations sont indisponibles pour le moment. Réessayez dans un instant.
          </p>
        ) : (
          <>
            <StatTile
              icon={IconFileText}
              label="Offres actives"
              value={of(e.activeOffers, e.plan ? e.activeOffersLimit : 0)}
              hint={e.activeOffersLimit === null && e.plan ? "illimitées" : undefined}
            />
            <StatTile
              icon={IconLockOpen}
              label="Contacts débloqués"
              value={e.plan ? of(e.unlocksUsed, e.unlocksQuota) : "—"}
              hint={e.plan ? "cette période" : "payés à l'unité"}
            />
            <StatTile
              icon={IconCreditCard}
              label="Abonnement"
              value={daysLeft === null ? "—" : `J-${daysLeft}`}
              hint={e.plan ? `${e.plan.name}${e.status === "TRIAL" ? " · essai" : ""}` : "Aucune formule"}
            />
            <StatTile
              icon={IconShieldCheck}
              label="Vérification"
              value={verification}
              hint={`${accepted}/${docs.length} document${docs.length > 1 ? "s" : ""} accepté${accepted > 1 ? "s" : ""}`}
            />
          </>
        )}
      </div>
    </section>
  );
}

function Card({ title, action, children }: Readonly<{ title: string; action?: React.ReactNode; children: React.ReactNode }>) {
  return (
    <section className="flex flex-col gap-5 rounded-3xl bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function CardLink({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 font-medium text-sm text-whatsapp-dark hover:underline">
      {children}
      <IconArrowRight className="size-4" />
    </Link>
  );
}

function SubscriptionCard({ subscription, loading }: Readonly<{ subscription?: MySubscription; loading: boolean }>) {
  if (loading || !subscription) {
    return (
      <Card title="Abonnement">
        {loading ? (
          <Skeleton className="h-52 rounded-2xl" />
        ) : (
          <p className="text-muted-foreground text-sm">Votre abonnement est indisponible pour le moment.</p>
        )}
      </Card>
    );
  }
  const e = subscription.entitlements;
  if (!e.plan) {
    return (
      <Card title="Abonnement">
        <p className="text-muted-foreground text-sm">
          Aucune formule en cours : vos contacts sont payés à l&apos;unité et vous ne pouvez pas publier d&apos;offres.
        </p>
        <Link
          href="/espace/abonnement"
          className="mt-auto inline-flex h-12 items-center justify-center rounded-full bg-ink font-medium text-[15px] text-white hover:bg-ink/90"
        >
          Choisir une formule
        </Link>
      </Card>
    );
  }
  const quota = e.unlocksQuota;
  const pct = quota === null || quota === 0 ? 0 : Math.min(100, (e.unlocksUsed / quota) * 100);
  return (
    <Card title="Abonnement" action={<CardLink href="/espace/abonnement">Gérer</CardLink>}>
      <div className="flex items-center gap-6">
        {/* Contacts used against the period's quota. */}
        <div
          className="relative size-36 shrink-0 rounded-full"
          style={{ background: `conic-gradient(var(--color-chip-violet-foreground) ${pct}%, var(--page) ${pct}% 100%)` }}
        >
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-card text-center">
            <span className="font-semibold text-2xl">{e.unlocksUsed}</span>
            <span className="text-muted-foreground text-xs">{quota === null ? "contacts" : `sur ${quota}`}</span>
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Formule</dt>
            <dd className="font-semibold">{e.plan.name}</dd>
          </div>
          {e.endsAt && (
            <div>
              <dt className="text-muted-foreground">{e.status === "TRIAL" ? "Fin de l'essai" : "Échéance"}</dt>
              <dd className="font-semibold">{date(e.endsAt)}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Offres actives</dt>
            <dd className="font-semibold">{of(e.activeOffers, e.activeOffersLimit)}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}

function DocumentsCard({ business, loading }: Readonly<{ business?: MyBusiness; loading: boolean }>) {
  const docs = business?.documents ?? [];
  const toFix = docs.some((d) => d.verificationStatus === "REJECTED") || (business?.missingDocuments.length ?? 0) > 0;
  return (
    <Card title="Documents" action={<CardLink href="/espace/organisation">{toFix ? "Compléter" : "Voir"}</CardLink>}>
      {loading ? (
        <Skeleton className="h-52 rounded-2xl" />
      ) : docs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun document envoyé.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {docs.slice(0, 4).map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-2xl bg-page p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card">
                <IconFileText className="size-4 text-muted-foreground" />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-sm">{d.label}</span>
              <StatusPill status={d.verificationStatus} />
            </li>
          ))}
          {(business?.missingDocuments ?? []).map((g) => (
            <li key={g.map((x) => x.type).join("|")} className="rounded-2xl bg-chip-amber px-3 py-2.5 text-chip-amber-foreground text-sm">
              À fournir : {g.map((x) => x.label).join(" ou ")}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function NotificationsCard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const feed = useQuery({ queryKey: [...notificationsKey, "list", 5], queryFn: () => listNotifications(5) });

  async function open(n: AppNotification) {
    if (!n.readAt) await markNotificationRead(n.id).catch(() => undefined);
    void queryClient.invalidateQueries({ queryKey: notificationsKey });
    if (n.link?.startsWith("/espace")) router.push(n.link);
  }

  return (
    <Card title="Notifications récentes">
      <NotificationList items={feed.data?.items} loading={feed.isLoading} onOpen={(n) => void open(n)} max={5} />
    </Card>
  );
}

function NextSteps({ business, subscription }: Readonly<{ business: MyBusiness; subscription: MySubscription }>) {
  const steps = [
    { label: "Ajouter le logo de votre organisation", done: !!business.logoUrl, href: "/espace/organisation" },
    {
      label: "Faire accepter vos documents",
      done:
        business.documents.length > 0 &&
        business.documents.every((d) => d.verificationStatus === "VERIFIED") &&
        business.missingDocuments.length === 0,
      href: "/espace/organisation",
    },
    { label: "Obtenir la vérification de l'organisation", done: business.verificationStatus === "VERIFIED", href: "/espace/organisation" },
    { label: "Choisir une formule", done: !!subscription.entitlements.plan, href: "/espace/abonnement" },
  ];
  const done = steps.filter((s) => s.done).length;
  return (
    <Card title="Prochaines étapes" action={<span className="text-muted-foreground text-sm">{done}/{steps.length + 1} faites</span>}>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {steps.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={cn(
                "flex h-full items-start gap-3 rounded-2xl p-4 text-sm transition-colors",
                s.done ? "bg-chip-green text-chip-green-foreground" : "bg-page hover:bg-page/70",
              )}
            >
              {s.done ? <IconCircleCheckFilled className="size-5 shrink-0" /> : <IconCircleDashed className="size-5 shrink-0 text-muted-foreground" />}
              <span className="font-medium">{s.label}</span>
            </Link>
          </li>
        ))}
        <li className="flex items-start gap-3 rounded-2xl bg-page p-4 text-muted-foreground text-sm">
          <IconCircleDashed className="size-5 shrink-0" />
          <span className="font-medium">
            Publier votre première offre <span className="ml-1 rounded-full bg-card px-2 py-0.5 text-[11px]">Bientôt</span>
          </span>
        </li>
      </ul>
    </Card>
  );
}
