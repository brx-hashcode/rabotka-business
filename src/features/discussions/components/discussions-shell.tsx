"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCheck, IconChecks, IconMessageCircle, IconSearch } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { friendlyError } from "#/lib/api/friendly-error";
import type { Discussion } from "#/lib/api/discussions-controller";
import { cn, getInitials } from "#/lib/utils";
import { discussionsContent } from "../content";
import { listTime } from "../list-time";
import { useDiscussions } from "../use-discussions";

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * Discussions as two panes: the conversations, and the open one beside them.
 * Below `lg` one at a time — the list, or the thread with a way back.
 */
export function DiscussionsShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const threadOpen = pathname !== "/espace/discussions";

  return (
    <div className="grid h-[calc(100svh-7.5rem)] min-h-[30rem] gap-6 pt-2 lg:grid-cols-[22rem_minmax(0,1fr)] 2xl:grid-cols-[26rem_minmax(0,1fr)]">
      <section className={cn("min-h-0 flex-col rounded-3xl bg-card", threadOpen ? "hidden lg:flex" : "flex")}>
        <DiscussionList activeId={threadOpen ? pathname.split("/").pop() : undefined} />
      </section>
      <section className={cn("min-h-0 flex-col overflow-hidden rounded-3xl bg-card", threadOpen ? "flex" : "hidden lg:flex")}>
        {children}
      </section>
    </div>
  );
}

function DiscussionList({ activeId }: Readonly<{ activeId?: string }>) {
  const content = discussionsContent.list;
  const { data, isLoading, error } = useDiscussions();
  const [q, setQ] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const all = data?.data;

  const shown = useMemo(() => {
    const needle = fold(q.trim());
    return (all ?? []).filter(
      (d) => (!unreadOnly || d.unreadCount > 0) && (!needle || fold(`${d.counterpartName} ${d.jobTitle ?? ""}`).includes(needle)),
    );
  }, [all, q, unreadOnly]);

  return (
    <>
      <div className="space-y-3 p-5 pb-3">
        <h1 className="font-semibold text-2xl tracking-tight">{content.title}</h1>
        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={content.searchPlaceholder}
            className="h-11 rounded-full border-0 bg-page pl-10 shadow-none"
          />
        </div>
        <div className="flex gap-2">
          {[
            { v: false, l: content.filterAll },
            { v: true, l: content.filterUnread },
          ].map((f) => (
            <button
              key={f.l}
              type="button"
              aria-pressed={unreadOnly === f.v}
              onClick={() => setUnreadOnly(f.v)}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors",
                unreadOnly === f.v ? "bg-selected text-selected-foreground" : "bg-page text-muted-foreground hover:text-foreground",
              )}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <div className="space-y-2 px-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : !all ? (
          <p className="px-3 py-6 text-muted-foreground text-sm">{friendlyError(error, "Vos messages sont indisponibles.")}</p>
        ) : all.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
              <IconMessageCircle className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">{content.emptyTitle}</p>
            <p className="text-muted-foreground text-sm">{content.emptyDescription}</p>
          </div>
        ) : shown.length === 0 ? (
          <p className="px-3 py-6 text-center text-muted-foreground text-sm">{unreadOnly && !q ? content.noUnread : content.noSearchResult}</p>
        ) : (
          <ul className="space-y-0.5">
            {shown.map((d) => (
              <DiscussionRow key={d.id} discussion={d} active={d.id === activeId} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function DiscussionRow({ discussion: d, active }: Readonly<{ discussion: Discussion; active: boolean }>) {
  const unread = d.unreadCount > 0;
  const preview = d.closed
    ? discussionsContent.list.closed
    : d.lastMessageHeld
      ? discussionsContent.warning.held
      : d.lastMessagePreview || d.jobTitle || "";
  return (
    <li>
      <Link
        href={`/espace/discussions/${d.id}`}
        className={cn("flex items-center gap-3 rounded-2xl p-3 transition-colors", active ? "bg-page" : "hover:bg-page/60")}
      >
        <CounterpartAvatar name={d.counterpartName} avatarUrl={d.counterpartAvatarUrl} online={d.counterpartOnline} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate", unread ? "font-semibold" : "font-medium")}>{d.counterpartName}</span>
            <span className={cn("shrink-0 text-xs tabular-nums", unread ? "font-semibold text-whatsapp-dark" : "text-muted-foreground")}>
              {listTime(d.lastMessageAt)}
            </span>
          </span>
          {d.jobTitle && <span className="block truncate text-muted-foreground text-xs">{d.jobTitle}</span>}
          <span className="mt-0.5 flex items-center gap-1.5">
            {d.lastMessageMine &&
              !d.lastMessageHeld &&
              (d.lastMessageRead ? (
                <IconChecks className="size-3.5 shrink-0 text-sky-600" />
              ) : (
                <IconCheck className="size-3.5 shrink-0 text-muted-foreground" />
              ))}
            <span className={cn("min-w-0 flex-1 truncate text-sm", unread ? "text-foreground" : "text-muted-foreground")}>{preview}</span>
            {unread && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-whatsapp-dark px-1.5 font-semibold text-[11px] text-white">
                {d.unreadCount}
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function CounterpartAvatar({
  name,
  avatarUrl,
  online,
  className,
}: Readonly<{ name: string; avatarUrl: string | null; online: boolean; className?: string }>) {
  return (
    <span className={cn("relative shrink-0", className)}>
      <Avatar className="size-12 rounded-2xl">
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" className="object-cover" />}
        <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">{getInitials(name)}</AvatarFallback>
      </Avatar>
      {online && (
        <span aria-label="En ligne" className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full bg-whatsapp ring-2 ring-card" />
      )}
    </span>
  );
}
