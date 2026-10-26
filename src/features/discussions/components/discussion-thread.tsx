"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconDots, IconLock, IconSend2, IconTrash, IconUser } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Skeleton } from "#/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { DiscussionMessage } from "#/lib/api/discussions-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { discussionsContent } from "../content";
import { mergeThread } from "../merge-thread";
import {
  useDeleteDiscussionMessage,
  useDiscussion,
  useDiscussionHistory,
  useDiscussionThread,
  useHideDiscussion,
  useMarkDiscussionRead,
  useReportRedaction,
  useSendMessage,
  THREAD_PAGE_SIZE,
} from "../use-discussions";
import { CounterpartAvatar } from "./discussions-shell";
import { MessageBubble } from "./message-bubble";

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const days = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

/**
 * One conversation: the client app's thread on the same endpoints, so the
 * server's moderation applies unchanged — a message is sent as typed and
 * comes back clean, redacted or held; nothing is shown before that verdict.
 */
export function DiscussionThread({ id }: Readonly<{ id: string }>) {
  const router = useRouter();
  const content = discussionsContent.thread;
  const header = useDiscussion(id);
  const thread = useDiscussionThread(id);
  const [historyWanted, setHistoryWanted] = useState(false);
  const history = useDiscussionHistory(id, historyWanted);
  const send = useSendMessage(id);
  const markRead = useMarkDiscussionRead();
  const report = useReportRedaction();
  const remove = useDeleteDiscussionMessage(id);
  const hide = useHideDiscussion();
  const [draft, setDraft] = useState("");
  const [toDelete, setToDelete] = useState<DiscussionMessage | null>(null);
  const [confirmHide, setConfirmHide] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const live = thread.data?.data ?? [];
  const messages = mergeThread(history.data?.pages.map((p) => p.data) ?? [], live);
  const total = thread.data?.total ?? 0;
  const hasOlder = historyWanted ? history.hasNextPage : total > THREAD_PAGE_SIZE;
  const unreadIncoming = live.filter((m) => !m.mine && !m.readAt).length;
  const d = header.data;

  // Reading the thread marks it read — again whenever something new arrives.
  const { mutate: markThreadRead } = markRead;
  useEffect(() => {
    if (unreadIncoming > 0) markThreadRead(id);
  }, [id, unreadIncoming, markThreadRead]);

  // Follow the conversation unless the reader scrolled up to read history.
  const lastId = messages.at(-1)?.id;
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  function submit() {
    const body = draft.trim();
    if (!body || send.isPending) return;
    stickToBottom.current = true;
    send.mutate(body, {
      onSuccess: () => setDraft(""),
      onError: (err) => toast.error(friendlyError(err, content.sendFailed)),
    });
  }

  // The first incoming message with a hole carries the rule, once per thread.
  const firstHoleId = messages.find((m) => !m.mine && m.status === "REDACTED")?.id;

  return (
    <>
      <header className="flex items-center gap-3 border-page border-b-2 p-4 sm:px-6">
        <Link href="/espace/discussions" aria-label="Retour aux messages" className="-ml-1 rounded-full p-2 hover:bg-page lg:hidden">
          <IconArrowLeft className="size-5" />
        </Link>
        {d ? (
          <>
            <CounterpartAvatar name={d.counterpartName} avatarUrl={d.counterpartAvatarUrl} online={d.counterpartOnline} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{d.counterpartName}</p>
              <p className="truncate text-muted-foreground text-xs">
                {d.counterpartOnline ? <span className="text-whatsapp-dark">{content.online}</span> : null}
                {d.counterpartOnline && d.jobTitle ? " · " : null}
                {d.jobTitle}
              </p>
            </div>
            <Link
              href={`/espace/candidats/${d.counterpartId}`}
              className="hidden h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70 sm:inline-flex"
            >
              <IconUser className="size-4" />
              {content.viewProfile}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Plus d'actions" className="rounded-full p-2 outline-none hover:bg-page">
                <IconDots className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
                <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm focus:bg-page sm:hidden">
                  <Link href={`/espace/candidats/${d.counterpartId}`}>
                    <IconUser className="size-4" />
                    {content.viewProfile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setConfirmHide(true)}
                  className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-destructive text-sm focus:bg-destructive/10 focus:text-destructive"
                >
                  <IconTrash className="size-4" />
                  {discussionsContent.list.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Skeleton className="h-12 flex-1 rounded-2xl" />
        )}
      </header>

      {/* The standing rule, known before the first attempt. */}
      <p className="flex items-start gap-2 bg-chip-amber/60 px-4 py-2.5 text-chip-amber-foreground text-xs sm:px-6">
        <IconLock className="mt-px size-3.5 shrink-0" />
        {discussionsContent.warning.header}
      </p>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
      >
        {thread.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl" />
            <Skeleton className="h-16 w-3/5 rounded-2xl" />
          </div>
        ) : !thread.data ? (
          <p className="py-10 text-center text-muted-foreground text-sm">{friendlyError(thread.error, "Cette conversation est indisponible.")}</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-sm">{content.empty}</p>
        ) : (
          <>
            {hasOlder && (
              <div className="mb-2 flex justify-center">
                <button
                  type="button"
                  disabled={history.isFetching}
                  onClick={() => {
                    stickToBottom.current = false;
                    if (historyWanted) void history.fetchNextPage();
                    else setHistoryWanted(true);
                  }}
                  className="rounded-full bg-page px-4 py-1.5 font-medium text-muted-foreground text-xs hover:text-foreground"
                >
                  {history.isFetching ? content.olderLoading : content.older}
                </button>
              </div>
            )}
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              return (
                <div key={m.id}>
                  {newDay && (
                    <p className="my-4 text-center">
                      <span className="rounded-full bg-page px-3 py-1 font-medium text-muted-foreground text-xs">{dayLabel(m.createdAt)}</span>
                    </p>
                  )}
                  <MessageBubble
                    message={m}
                    firstOfGroup={newDay || prev?.senderId !== m.senderId}
                    showRecipientNotice={m.id === firstHoleId}
                    onReport={(messageId) => report.mutate(messageId)}
                    onDelete={setToDelete}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      {d?.closed ? (
        <p className="border-page border-t-2 px-6 py-4 text-center text-muted-foreground text-sm">{content.closed}</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-2 border-page border-t-2 p-3 sm:px-4"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter breaks the line — as in every desktop messenger.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={content.placeholder}
            aria-label={content.placeholder}
            className="field-sizing-content max-h-40 min-h-12 flex-1 resize-none rounded-2xl bg-page px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-label={content.send}
            disabled={!draft.trim() || send.isPending}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-opacity hover:bg-ink/90 disabled:opacity-40"
          >
            <IconSend2 className="size-5" />
          </button>
        </form>
      )}

      <ActionDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        tone="warning"
        icon={<IconTrash className="size-5" />}
        title={content.actionsDelete}
        description={content.actionsDeleteExplain}
        confirmLabel={content.actionsDeleteConfirm}
        onConfirm={() => {
          if (!toDelete) return;
          remove.mutate(toDelete.id, {
            onSuccess: () => toast.success(content.actionsDeleted),
            onError: () => toast.error(content.actionsDeleteFailed),
          });
          setToDelete(null);
        }}
      />

      <ActionDialog
        open={confirmHide}
        onOpenChange={setConfirmHide}
        tone="warning"
        icon={<IconTrash className="size-5" />}
        title={discussionsContent.list.delete}
        description={discussionsContent.list.deleteExplain}
        confirmLabel={discussionsContent.list.deleteConfirm}
        onConfirm={() => {
          setConfirmHide(false);
          hide.mutate(id, {
            onSuccess: () => toast.success(discussionsContent.list.deleted),
            onError: () => toast.error(discussionsContent.list.deleteFailed),
          });
          router.push("/espace/discussions");
        }}
      />
    </>
  );
}
