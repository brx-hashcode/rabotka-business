"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { createProgressRefresh, refreshFor, type PushedNotification, type ScreeningProgress } from "./notification-refresh";
import { armNotificationSound, playNotificationSound } from "./notification-sound";
import { setSocketConnected } from "./socket-status";

/**
 * Refreshes, the moment the backend pushes a notification (`/notifications`
 * namespace, `notification:new`), the bell and whatever it is about; and an
 * analysis's CVs as they are read (`cv-screening:progress`). A new
 * notification also chimes.
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
    // The polls it covers slow down while it is up (socket-status.ts).
    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    // Each notification refreshes what it is about (notification-refresh.ts)
    // and chimes, as in rabotka-admin (notification-sound.ts).
    const disarm = armNotificationSound();
    socket.on("notification:new", (notification?: PushedNotification) => {
      refreshFor(queryClient, notification ?? {});
      playNotificationSound();
    });
    // A CV was read (an « Analyse de CV », or a candidate analysed as they
    // applied): its screening and the offer's cards fill in as it goes.
    // Throttled: that screening at once, the rest every 2 s and at the end.
    const progress = createProgressRefresh((queryKey) => void queryClient.invalidateQueries({ queryKey }));
    socket.on("cv-screening:progress", (event?: ScreeningProgress) => progress(event));
    return () => {
      disarm();
      socket.disconnect();
      setSocketConnected(false);
    };
  }, [queryClient]);
}
