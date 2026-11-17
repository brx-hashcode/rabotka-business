"use client";

import { useTranslations } from "next-intl";
import { IconRefresh } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";

/**
 * Route-level fallback, the Next counterpart of rabotka-admin's AppError.
 */
export default function ErrorPage({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  const t = useTranslations("pages.error");
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-lg">{t("title")}</h1>
        <p className="max-w-sm text-muted-foreground text-sm">
          {t("text")}
        </p>
      </div>

      <Button onClick={reset}>
        <IconRefresh />
        {t("retry")}
      </Button>

      {process.env.NODE_ENV === "development" && (
        <pre className="max-w-full overflow-x-auto text-left text-muted-foreground text-xs">
          {error.message}
        </pre>
      )}
    </div>
  );
}
