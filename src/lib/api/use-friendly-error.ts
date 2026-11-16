"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

import { friendlyError, type StandardErrors } from "./friendly-error";

/**
 * friendlyError with its standard sentences (network, server, session…) in
 * the reader's language. The fallback is the caller's, already translated.
 */
export function useFriendlyError() {
  const t = useTranslations("common.errors");
  return useCallback(
    (error: unknown, fallback: string, options: { keepUnauthorized?: boolean } = {}) => {
      const standard: StandardErrors = {
        network: t("network"),
        server: t("server"),
        session: t("session"),
        permission: t("permission"),
        rateLimit: t("rateLimit"),
      };
      return friendlyError(error, fallback, { ...options, standard });
    },
    [t],
  );
}
