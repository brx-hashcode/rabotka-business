"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconBell, IconChecks } from "@tabler/icons-react";

import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Bone } from "#/components/page-skeletons";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsKey,
  timeAgo,
  type AppNotification,
} from "#/lib/api/notification-controller";
import { cn } from "#/lib/utils";
import { notificationLook } from "../notification-look";
import { useNotificationsSocket } from "../use-notifications-socket";

const PAGE = 20;

/**
 * The bell: the unread count (pushed live, and refreshed every minute) and the
 * latest notifications, grouped by day. A notification opens the page it is
 * about when that page is in this space.
 */
export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useNotificationsSocket();
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const unread = useQuery({
    queryKey: [...notificationsKey, "unread"],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  });
  const feed = useQuery({
    queryKey: [...notificationsKey, "list", limit],
    queryFn: () => listNotifications(limit),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: notificationsKey });
  const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh });

  async function openOne(n: AppNotification) {
    if (!n.readAt) await markNotificationRead(n.id).catch(() => undefined);
    void refresh();
    const link = espaceLink(n.link);
    if (link) {
      setOpen(false);
      router.push(link);
    }
  }

  const count = unread.data?.count ?? 0;
  const items = feed.data?.items;
  const hasMore = !!feed.data && feed.data.total > feed.data.items.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={count > 0 ? `Notifications, ${count} non lues` : "Notifications"}
        className="relative flex size-12 items-center justify-center rounded-2xl bg-card text-foreground transition-colors hover:bg-card/70"
      >
        <IconBell className="size-5" />
        {count > 0 && (
          <span className="absolute top-2 right-2 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-semibold text-[10px] text-white leading-4">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border-0 bg-card shadow-soft before:hidden [&>[data-slot=popover-viewport]]:p-0"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-lg">Notifications</p>
            {count > 0 && (
              <span className="rounded-full bg-chip-green px-2 py-0.5 font-semibold text-chip-green-foreground text-xs tabular-nums">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={() => readAll.mutate()}
              disabled={readAll.isPending}
              className="-mr-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-page hover:text-foreground disabled:opacity-60"
            >
              <IconChecks className="size-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>
        <div className="max-h-[min(65svh,32rem)] overflow-y-auto overscroll-contain pb-2">
          <NotificationList items={items} loading={feed.isLoading} onOpen={(n) => void openOne(n)} />
          {hasMore && (
            <div className="px-4 pt-2">
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                disabled={feed.isFetching}
                className="w-full rounded-full bg-page py-2.5 font-medium text-sm transition-colors hover:bg-page/70 disabled:opacity-60"
              >
                {feed.isFetching ? "Chargement…" : "Voir plus"}
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The feed's rows, newest first, under the day they arrived. */
export function NotificationList({
  items,
  loading,
  onOpen,
  max,
}: Readonly<{
  items: AppNotification[] | undefined;
  loading: boolean;
  onOpen?: (n: AppNotification) => void;
  max?: number;
}>) {
  if (loading) {
    return (
      <div role="status" aria-label="Chargement" className="px-2 pt-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-3">
            <Bone className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="flex justify-between gap-4">
                <Bone className="h-4 w-1/2" />
                <Bone className="h-3 w-8" />
              </div>
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!items?.length) {
    return (
      <div className="flex flex-col items-center gap-2 px-8 pt-6 pb-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-page text-muted-foreground">
          <IconBell className="size-6" />
        </span>
        <p className="font-medium text-sm">Aucune notification</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Candidatures, analyses de CV, entretiens et abonnement s&apos;afficheront ici.
        </p>
      </div>
    );
  }
  return groupByDay(items.slice(0, max)).map(([label, rows]) => (
    <section key={label}>
      <h3 className="sticky top-0 z-10 bg-card px-5 pt-3 pb-1.5 font-medium text-muted-foreground text-xs">{label}</h3>
      <ul className="px-2">
        {rows.map((n) => (
          <li key={n.id}>
            <Row n={n} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </section>
  ));
}

function Row({ n, onOpen }: Readonly<{ n: AppNotification; onOpen?: (n: AppNotification) => void }>) {
  const { icon: Icon, tone } = notificationLook(n.type);
  const unread = !n.readAt;
  return (
    <button
      type="button"
      onClick={() => onOpen?.(n)}
      className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-page focus-visible:bg-page focus-visible:outline-none"
    >
      <span className="relative shrink-0">
        <span className={cn("flex size-10 items-center justify-center rounded-full", tone)}>
          <Icon className="size-[18px]" />
        </span>
        {unread && (
          <span aria-label="Non lue" className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-whatsapp ring-2 ring-card" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className={cn("min-w-0 text-sm leading-snug", unread ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
            {n.title}
          </span>
          <span
            className={cn("shrink-0 text-[11px] tabular-nums", unread ? "font-medium text-whatsapp-dark" : "text-muted-foreground")}
            title={timeAgo(n.createdAt)}
          >
            {shortAgo(n.createdAt)}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[13px] text-muted-foreground leading-snug">{n.body}</span>
      </span>
    </button>
  );
}

/** « Aujourd'hui », « Hier », « Cette semaine », « Plus ancien », in feed order. */
export function groupByDay<T extends { createdAt: string }>(list: T[], now = new Date()): [string, T[]][] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = 86_400_000;
  const label = (iso: string) => {
    const t = new Date(iso).getTime();
    if (t >= start.getTime()) return "Aujourd'hui";
    if (t >= start.getTime() - day) return "Hier";
    if (t >= start.getTime() - 6 * day) return "Cette semaine";
    return "Plus ancien";
  };
  const groups = new Map<string, T[]>();
  for (const n of list) {
    const key = label(n.createdAt);
    groups.set(key, [...(groups.get(key) ?? []), n]);
  }
  return [...groups];
}

/** « 5 min », « 7 h », « 2 j », then the date: short enough to sit beside the title. */
export function shortAgo(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  const minutes = Math.floor((now - date.getTime()) / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Where a notification opens in the space. Business notifications already
 * point into `/espace`; the employer ones carry the client app's paths
 * (`/candidatures/:applicationId`, `/missions/:offerId`, `/discussions/:id`,
 * `/claims/:id`…), each sent to the same page here. A notice about one
 * candidature opens its offer on it (`/espace/offres/:id?candidature=`) when
 * the link names the offer (`?offre=` on a new application, or a mission
 * path); otherwise Candidatures, which forwards to the offer once it finds
 * it. Anything else has no page in the space.
 */
export function espaceLink(link: string | null | undefined): string | null {
  if (!link) return null;
  if (link.startsWith("/espace")) return link;
  const [path, query] = link.split("?");
  const [, root, id] = path.split("/");
  const params = new URLSearchParams(query);
  const offerOn = (offerId: string, applicationId: string) =>
    `/espace/offres/${encodeURIComponent(offerId)}?candidature=${encodeURIComponent(applicationId)}`;
  const candidature = params.get("candidature");
  if (candidature) {
    return id && ["missions", "job-offers", "offres"].includes(root)
      ? offerOn(id, candidature)
      : `/espace/candidatures?candidature=${encodeURIComponent(candidature)}`;
  }
  switch (root) {
    case "candidatures": {
      const offre = params.get("offre");
      if (id && offre) return offerOn(offre, id);
      return id ? `/espace/candidatures?candidature=${encodeURIComponent(id)}` : "/espace/candidatures";
    }
    case "missions":
    case "job-offers":
    case "offres":
      return id ? `/espace/offres/${encodeURIComponent(id)}` : "/espace/offres";
    case "discussions":
      return id ? `/espace/discussions/${encodeURIComponent(id)}` : "/espace/discussions";
    case "claims":
      if (id === "new") return "/espace/reclamations/nouvelle";
      return id ? `/espace/reclamations/${encodeURIComponent(id)}` : "/espace/reclamations";
    case "profile":
      return "/espace/organisation";
    default:
      return null;
  }
}
