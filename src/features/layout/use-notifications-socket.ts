"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { refreshFor, SCREENING_PROGRESS_KEYS, type PushedNotification } from "./notification-refresh";

/**
 * Refreshes, the moment the backend pushes a notification (`/notifications`
 * namespace, `notification:new`), the bell and whatever it is about; and an
 * analysis's CVs as they are read (`cv-screening:progress`).
 *
 * Long-polling only: each request goes through `src/proxy.ts`, which swaps the
 * httpOnly session cookie for the bearer header — a WebSocket upgrade could not
 * carry it, and the page never holds the token. The room comes from that token
 * on the server; the minute poll on the badge stays as the fallback.
 */
export function useNotificationsSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // `/socket.io`, not `/socket.io/`: Next would redirect that one first.
    const socket = io("/notifications", { transports: ["polling"], upgrade: false, addTrailingSlash: false });
    // Each notification refreshes what it is about (notification-refresh.ts).
    socket.on("notification:new", (notification?: PushedNotification) => {
      refreshFor(queryClient, notification ?? {});
    });
    // A CV was read (an « Analyse de CV », or a candidate analysed as they
    // applied): its screening and the offer's cards fill in as it goes.
    socket.on("cv-screening:progress", () => {
      for (const queryKey of SCREENING_PROGRESS_KEYS) void queryClient.invalidateQueries({ queryKey });
    });
    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}
