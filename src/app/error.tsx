"use client";

import { IconRefresh } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";

/**
 * Route-level fallback, the Next counterpart of rabotka-admin's AppError.
 */
export default function ErrorPage({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-lg">Une erreur est survenue</h1>
        <p className="max-w-sm text-muted-foreground text-sm">
          Cette page n&apos;a pas pu se charger. Réessayez — si le problème
          persiste, vérifiez votre connexion internet.
        </p>
      </div>

      <Button onClick={reset}>
        <IconRefresh />
        Réessayer
      </Button>

      {process.env.NODE_ENV === "development" && (
        <pre className="max-w-full overflow-x-auto text-left text-muted-foreground text-xs">
          {error.message}
        </pre>
      )}
    </div>
  );
}
