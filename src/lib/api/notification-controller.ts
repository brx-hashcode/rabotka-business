import { BusinessBaseController } from "./base-controller";

/** One in-app notification (`profile/notifications`, ProfileNotificationDto). */
export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  readAt: string | null;
};

export type NotificationPage = {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
};

/** The account's in-app feed — the same one the client app's bell reads. */
class NotificationController extends BusinessBaseController {
  list(limit = 20): Promise<NotificationPage> {
    return this.get(`/profile/notifications?page=1&limit=${limit}`);
  }

  unreadCount(): Promise<{ count: number }> {
    return this.get("/profile/notifications/unread-count");
  }

  markRead(id: string): Promise<unknown> {
    return this.post(`/profile/notifications/${encodeURIComponent(id)}/read`);
  }

  markAllRead(): Promise<unknown> {
    return this.post("/profile/notifications/read-all");
  }
}

const controller = new NotificationController();

export const listNotifications = controller.list.bind(controller);
export const getUnreadCount = controller.unreadCount.bind(controller);
export const markNotificationRead = controller.markRead.bind(controller);
export const markAllNotificationsRead = controller.markAllRead.bind(controller);

export const notificationsKey = ["notifications"] as const;

/** « il y a 5 min », « hier »… — French, relative to now. */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "à l'instant";
}
