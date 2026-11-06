"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { TooltipProvider } from "#/components/ui/tooltip";
import { Toaster } from "#/components/ui/sonner";
import { setSessionExpiredHandler } from "#/lib/auth/session-client";
import { httpStatusOf } from "#/lib/api/friendly-error";
import { SessionProvider } from "./session-context";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        // Pages visited earlier in the session open from cache (then refresh
        // in the background) instead of showing their skeleton again.
        gcTime: 30 * 60 * 1000,
        // A 4xx won't change on a retry (a 401 has already been through one
        // refresh-and-retry in withSession): show it at once instead of after
        // ~7 s of skeleton. Network errors and 5xx get two more tries.
        retry: (failureCount, error) => {
          const status = httpStatusOf(error);
          if (status !== null && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * One client per server render (never shared between visitors), one for the
 * lifetime of the tab in the browser.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

type ProvidersProps = Readonly<{
  children: ReactNode;
  isAuthenticated: boolean;
}>;

export function Providers({ children, isAuthenticated }: ProvidersProps) {
  const queryClient = getQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  // The session could not be refreshed (cookies already cleared by
  // /session/refresh): drop cached data and open sign-in. `next`
  // brings the person back to the current page.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      queryClient.clear();
      const here = `${globalThis.location.pathname}${globalThis.location.search}`;
      router.replace(`/auth/sign-in?next=${encodeURIComponent(here)}`);
      router.refresh();
    });
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider isAuthenticated={isAuthenticated}>
        {/*
          Light by default; the business space (/espace) has a toggle and
          remembers the choice. The landing and sign-in stay light whatever
          was chosen there: their lime band and photos are designed for it.
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme={pathname.startsWith("/espace") ? undefined : "light"}
          storageKey="theme"
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <TooltipProvider>
              {children}
              <Toaster position="top-center" />
            </TooltipProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
