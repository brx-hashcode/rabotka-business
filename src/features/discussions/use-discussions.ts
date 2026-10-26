"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteDiscussionMessage,
  getDiscussion,
  hideDiscussion,
  listDiscussionMessages,
  listDiscussions,
  markDiscussionRead,
  openDiscussion,
  reportRedaction,
  sendDiscussionMessage,
} from "#/lib/api/discussions-controller";
import { notificationsKey } from "#/lib/api/notification-controller";

/**
 * The client app's discussion hooks, minus its socket: the business space
 * keeps its session in httpOnly cookies on its own domain, which the
 * `/messagerie` websocket cannot read, so it polls. React Query pauses the
 * intervals while the tab is hidden.
 */
export const discussionsKeys = {
  all: ["discussions"] as const,
  list: () => [...discussionsKeys.all, "list"] as const,
  thread: (id: string) => [...discussionsKeys.all, "thread", id] as const,
  one: (id: string) => [...discussionsKeys.all, "one", id] as const,
  /** Outside `all`: history does not change, and refetching every loaded page on each poll would be waste. */
  history: (id: string) => ["discussions-history", id] as const,
};

const LIST_POLL = 15_000;
/** The open thread: a missing reply reads as broken, not as late. */
const THREAD_POLL = 5_000;
export const THREAD_PAGE_SIZE = 50;

export function useDiscussions() {
  return useQuery({
    queryKey: discussionsKeys.list(),
    // 100, the server's ceiling: search and « Non lues » run over what is loaded.
    queryFn: () => listDiscussions(1, 100),
    refetchInterval: LIST_POLL,
  });
}

export function useUnreadDiscussionsCount(): number {
  const { data } = useDiscussions();
  return (data?.data ?? []).reduce((sum, d) => sum + d.unreadCount, 0);
}

/** The thread's header; seeded from the list so a known thread paints at once. */
export function useDiscussion(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: discussionsKeys.one(id),
    queryFn: async () => (await getDiscussion(id)).conversation,
    refetchInterval: 30_000,
    initialData: () =>
      queryClient.getQueryData<Awaited<ReturnType<typeof listDiscussions>>>(discussionsKeys.list())?.data.find((d) => d.id === id),
  });
}

/** The newest page, polled. */
export function useDiscussionThread(id: string) {
  return useQuery({
    queryKey: discussionsKeys.thread(id),
    queryFn: () => listDiscussionMessages(id, 1, THREAD_PAGE_SIZE),
    refetchInterval: THREAD_POLL,
  });
}

/** What is behind the live page, on request. Offsets drift under a live thread: merge by id. */
export function useDiscussionHistory(id: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: discussionsKeys.history(id),
    queryFn: ({ pageParam }) => listDiscussionMessages(id, pageParam, THREAD_PAGE_SIZE),
    initialPageParam: 2,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = THREAD_PAGE_SIZE + allPages.reduce((n, page) => n + page.data.length, 0);
      return loaded < lastPage.total ? allPages.length + 2 : undefined;
    },
    enabled,
  });
}

/**
 * No optimistic insert: the server decides what the message becomes (clean,
 * redacted or held), and showing the raw text first would flash a number as
 * delivered before taking it back.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendDiscussionMessage(conversationId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: discussionsKeys.thread(conversationId) });
      void queryClient.invalidateQueries({ queryKey: discussionsKeys.list() });
    },
  });
}

export function useMarkDiscussionRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markDiscussionRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: discussionsKeys.list() });
      // The bell's NEW_MESSAGE row for this thread goes with it.
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });
}

/** Optimistic: there is no verdict to wait for, and the tombstone looks the same whoever draws it. */
export function useDeleteDiscussionMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteDiscussionMessage(messageId),
    onMutate: async (messageId: string) => {
      const key = discussionsKeys.thread(conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof listDiscussionMessages>>>(key);
      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          data: previous.data.map((m) =>
            m.id === messageId ? { ...m, body: "", redactions: [], reported: false, deletedAt: new Date().toISOString() } : m,
          ),
        });
      }
      return { previous };
    },
    onError: (_e, _id, context) => {
      if (context?.previous) queryClient.setQueryData(discussionsKeys.thread(conversationId), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: discussionsKeys.thread(conversationId) });
      void queryClient.invalidateQueries({ queryKey: discussionsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: discussionsKeys.history(conversationId) });
    },
  });
}

export function useReportRedaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => reportRedaction(messageId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: discussionsKeys.all }),
  });
}

/** « Supprimer la discussion », for this side only. Optimistic, like WhatsApp's. */
export function useHideDiscussion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hideDiscussion(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: discussionsKeys.list() });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof listDiscussions>>>(discussionsKeys.list());
      if (previous) {
        queryClient.setQueryData(discussionsKeys.list(), {
          ...previous,
          data: previous.data.filter((d) => d.id !== id),
          total: Math.max(0, previous.total - 1),
        });
      }
      return { previous };
    },
    onError: (_e, _id, context) => {
      if (context?.previous) queryClient.setQueryData(discussionsKeys.list(), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: discussionsKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });
}

/** Opens (or finds — idempotent server side) the thread of an application. */
export function useOpenDiscussion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => openDiscussion(applicationId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: discussionsKeys.list() }),
  });
}
