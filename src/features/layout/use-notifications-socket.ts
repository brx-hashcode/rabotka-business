"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import { myBusinessKey } from "#/lib/api/business-controller";
import { cvScreeningsKey } from "#/lib/api/cv-screening-controller";
import { notificationsKey } from "#/lib/api/notification-controller";
import { offersKey } from "#/lib/api/offer-controller";

/**
 * Refreshes the bell the moment the backend pushes a notification
 * (`/notifications` namespace, `notification:new`), and an « Analyse de CV »
 * as its CVs are read (`cv-screening:progress`).
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
    socket.on("notification:new", () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
      // Most of them are about an application: the inbox and offers follow.
      void queryClient.invalidateQueries({ queryKey: offersKey });
      // Others change the business itself (plan paid or ended, organisation
      // verified): its subscription, quotas and figures, all under one prefix.
      void queryClient.invalidateQueries({ queryKey: myBusinessKey });
    });
    // A CV of an « Analyse de CV » was read: the ranking fills in as it goes.
    socket.on("cv-screening:progress", () => {
      void queryClient.invalidateQueries({ queryKey: cvScreeningsKey });
    });
    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}
