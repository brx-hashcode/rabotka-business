"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sheet, SheetContent, SheetTitle } from "#/components/ui/sheet";
import { useOrganisationFavicon } from "#/features/layout/use-organisation-favicon";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { pageAllowed } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";

/**
 * The business space: the dark green sidebar (a sheet below `lg`), the top
 * bar, and the page on the light grey ground.
 */
export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const [menuOpen, setMenuOpen] = useState(false);
  useOrganisationFavicon();
  // A page typed in by hand that the role cannot use: said here, rather
  // than a full page whose every button ends in « non autorisé ».
  const pathname = usePathname();
  const { role } = useMember();
  const refused = !!role && !pageAllowed(role, pathname);

  return (
    <div className="min-h-svh bg-page lg:flex">
      <aside className="sticky top-0 hidden h-svh w-72 shrink-0 p-3 lg:block">
        <AppSidebar />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-80 max-w-[85vw] border-0 bg-transparent p-3 shadow-none">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <AppSidebar onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <AppHeader onOpenMenu={() => setMenuOpen(true)} />
        <main className="px-4 pb-10 sm:px-6">
          {refused ? (
            <section className="mx-auto mt-10 max-w-lg space-y-3 rounded-3xl bg-card p-8 text-center">
              <p className="font-semibold text-lg">Cette page est réservée</p>
              <p className="text-muted-foreground text-sm">
                {role === "REVIEWER"
                  ? "Un évaluateur lit les candidatures et donne son avis ; cette page est pour ceux qui recrutent."
                  : "Elle est réservée à l'administrateur de votre organisation."}
              </p>
              <Link
                href="/espace"
                className="inline-flex h-11 items-center rounded-full bg-ink px-5 font-medium text-sm text-white hover:bg-ink/90"
              >
                Retour au tableau de bord
              </Link>
            </section>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
