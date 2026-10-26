"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconBell } from "@tabler/icons-react";

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

/**
 * The bell: the unread count (refreshed every minute) and the latest
 * notifications. A notification opens the page it is about when that page is
 * in this space.
 */
export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const unread = useQuery({
    queryKey: [...notificationsKey, "unread"],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  });
  const feed = useQuery({
    queryKey: [...notificationsKey, "list", 20],
    queryFn: () => listNotifications(20),
    enabled: open,
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
      <PopoverContent align="end" sideOffset={10} className="w-[min(32rem,calc(100vw-2rem))] rounded-3xl border-0 p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3 pb-3">
          <p className="font-semibold text-lg">Notifications</p>
          {count > 0 && (
            <button
              type="button"
              onClick={() => readAll.mutate()}
              className="font-medium text-muted-foreground text-xs hover:text-foreground"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
        <div className="-mx-1 max-h-[min(36rem,70vh)] overflow-y-auto px-1">
          <NotificationList items={feed.data?.items} loading={feed.isLoading} onOpen={(n) => void openOne(n)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The feed's rows; shared by the bell and the dashboard card. */
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
      <div className="space-y-1" role="status" aria-label="Chargement">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 p-2.5">
            <Bone className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2 pt-1">
              <Bone className="h-3.5 w-1/2" />
              <Bone className="h-3 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!items?.length) return <p className="py-6 text-center text-muted-foreground text-sm">Aucune notification pour le moment.</p>;
  return (
    <ul className="flex flex-col gap-1">
      {items.slice(0, max).map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => onOpen?.(n)}
            className="flex w-full items-start gap-3 rounded-2xl p-2.5 text-left transition-colors hover:bg-page"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-page">
              <IconBell className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className={cn("truncate text-sm", n.readAt ? "font-medium" : "font-semibold")}>{n.title}</span>
                {!n.readAt && <span aria-label="Non lue" className="size-2 shrink-0 rounded-full bg-whatsapp" />}
              </span>
              <span className="line-clamp-3 text-muted-foreground text-sm">{n.body}</span>
              <span className="text-muted-foreground text-xs">{timeAgo(n.createdAt)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Where a notification opens in the space. Business notifications already
 * point into `/espace`; the employer ones carry the client app's paths
 * (`/candidatures/:applicationId`, `/missions/:offerId`, `/discussions/:id`,
 * `/claims/:id`…), each sent to the same page here. Anything else has no page
 * in the space.
 */
export function espaceLink(link: string | null | undefined): string | null {
  if (!link) return null;
  if (link.startsWith("/espace")) return link;
  const [, root, id] = link.split("?")[0].split("/");
  switch (root) {
    case "candidatures":
      return id ? `/espace/candidatures?candidature=${encodeURIComponent(id)}` : "/espace/candidatures";
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
